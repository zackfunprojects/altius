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
    const { trek_id } = body;

    if (!trek_id || typeof trek_id !== "string") {
      throw new ValidationError("trek_id is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch trek, active section, and active camp in parallel
    const [
      { data: trek, error: trekError },
      { data: activeSection },
      { data: activeCamp },
    ] = await Promise.all([
      supabase
        .from("treks")
        .select("trek_name, skill_description, difficulty, user_id")
        .eq("id", trek_id)
        .single(),
      supabase
        .from("trail_sections")
        .select("title, section_type")
        .eq("trek_id", trek_id)
        .eq("status", "active")
        .order("section_number")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("camps")
        .select("camp_name, camp_number")
        .eq("trek_id", trek_id)
        .eq("status", "active")
        .order("camp_number")
        .limit(1)
        .maybeSingle(),
    ]);

    if (trekError || !trek) {
      throw new ValidationError("Trek not found");
    }

    // Verify ownership
    if (trek.user_id !== authUserId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const sectionContext = activeSection
      ? `They are currently working on "${activeSection.title}" (${activeSection.section_type}).`
      : "";

    const campContext = activeCamp
      ? `They are at ${activeCamp.camp_name} (Camp ${activeCamp.camp_number}).`
      : "";

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        system: SHERPA_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate ONE thought-provoking morning question for a climber learning "${trek.skill_description}" on the trek "${trek.trek_name}" (${trek.difficulty}). ${campContext} ${sectionContext}

The question should:
- Help them reflect on what they're learning
- Be specific to their skill, not generic
- Be under 2 sentences
- Sound like something a wise mountain guide would ask over morning coffee

Return ONLY the question text, nothing else.`,
          },
        ],
      })
    );

    const question =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    return new Response(
      JSON.stringify({ question }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("morning-question error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
