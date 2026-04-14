import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.103.0";
import {
  anthropic,
  SHERPA_SYSTEM_PROMPT,
  callWithRetry,
  getUserIdFromRequest,
  checkRateLimit,
  ValidationError,
} from "../_shared/anthropic.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authUserId = getUserIdFromRequest(req);
    if (!authUserId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!checkRateLimit(authUserId)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { notebook_entry_id } = body;

    if (!notebook_entry_id || typeof notebook_entry_id !== "string") {
      throw new ValidationError("notebook_entry_id is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch notebook entry and verify ownership
    const { data: entry, error: entryError } = await supabase
      .from("trek_notebook")
      .select("*")
      .eq("id", notebook_entry_id)
      .single();

    if (entryError || !entry) {
      throw new ValidationError("Notebook entry not found");
    }

    if (entry.user_id !== authUserId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Check Pro tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", authUserId)
      .single();

    if (profile?.subscription_tier !== "pro") {
      return new Response(
        JSON.stringify({ error: "Skill Refresh requires a Pro subscription." }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const keyConcepts = Array.isArray(entry.key_concepts) ? entry.key_concepts : [];

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `${SHERPA_SYSTEM_PROMPT}

You are generating Skill Refresh exercises - quick review questions to test whether the climber still remembers what they learned. These should be concise, varied in type, and directly test recall of the key concepts. Generate 3-5 exercises.`,
        messages: [
          {
            role: "user",
            content: `Generate refresh exercises for this completed skill.

Skill: ${entry.skill_name}
Key concepts learned:
${keyConcepts.map((c: string, i: number) => `${i + 1}. ${c}`).join("\n")}

Return a JSON object with this structure:
{
  "exercises": [
    {
      "type": "multiple_choice" | "short_answer" | "drag_sequence",
      "prompt": "The question or instruction",
      "spec": {
        // For multiple_choice: "options": [{"id": "a", "text": "..."}], "correct_answer": "a"
        // For short_answer: "expected_keywords": ["keyword1", "keyword2"]
        // For drag_sequence: "items": [{"id": "1", "text": "..."}], "correct_order": ["1", "2", "3"]
      }
    }
  ]
}

Mix exercise types. Test recall, not recognition. Keep exercises quick - 30 seconds each max.

Return ONLY the JSON object.`,
          },
        ],
      })
    );

    const text =
      response.content?.[0]?.type === "text" ? response.content[0].text : "";

    let result;
    try {
      const cleaned = text
        .replace(/```json?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse skill refresh:", text.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Failed to generate refresh exercises. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    result.exercises = Array.isArray(result.exercises) ? result.exercises : [];

    // Update last_refreshed_at
    await supabase
      .from("trek_notebook")
      .update({ last_refreshed_at: new Date().toISOString() })
      .eq("id", notebook_entry_id)
      .eq("user_id", authUserId);

    return new Response(
      JSON.stringify(result),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("skill-refresh error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
