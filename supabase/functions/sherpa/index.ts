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
    const { message, section_id, trek_id, conversation_history } = body;

    if (!message || typeof message !== "string") {
      throw new ValidationError("message is required");
    }

    if (message.trim().length === 0) {
      throw new ValidationError("message cannot be empty");
    }

    if (message.length > 2000) {
      throw new ValidationError("message must be 2000 characters or fewer");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build context blocks
    let sectionContext = "";
    let trekContext = "";

    if (section_id) {
      const { data: section } = await supabase
        .from("trail_sections")
        .select("title, section_type, modalities, content")
        .eq("id", section_id)
        .single();

      if (section) {
        sectionContext = `\nCurrent section: "${section.title}" (${section.section_type})`;
        if (section.content?.narrative) {
          // Include a summary of the lesson content, not the full thing
          const textBlocks = section.content.narrative
            .filter((b: { type: string }) => b.type === "sherpa_text")
            .map((b: { content: string }) => b.content)
            .join("\n");
          if (textBlocks.length > 0) {
            sectionContext += `\nLesson content summary: ${textBlocks.slice(0, 1500)}`;
          }
        }
      }
    }

    if (trek_id) {
      const { data: trek } = await supabase
        .from("treks")
        .select("trek_name, skill_description, difficulty")
        .eq("id", trek_id)
        .single();

      if (trek) {
        trekContext = `\nTrek: "${trek.trek_name}" - learning ${trek.skill_description} (${trek.difficulty})`;
      }
    }

    // Fetch profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, current_elevation")
      .eq("id", authUserId)
      .single();

    const contextBlock = `${trekContext}${sectionContext}
Climber: ${profile?.display_name || "Unknown"} (elevation: ${profile?.current_elevation || 0} ft)

The climber is asking a question during their lesson. Answer in the context of what they are currently learning. Be helpful and specific. Keep answers concise but thorough.`;

    // Build messages with conversation history
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (Array.isArray(conversation_history)) {
      for (const msg of conversation_history.slice(-10)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : "",
          });
        }
      }
    }

    messages.push({ role: "user", content: message.trim() });

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `${SHERPA_SYSTEM_PROMPT}\n\n${contextBlock}`,
        messages,
      })
    );

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return new Response(
      JSON.stringify({ response: text }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("sherpa error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
