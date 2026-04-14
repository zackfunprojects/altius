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
    const { trek_id, screenshot_base64, tool_name, current_task } = body;

    if (!trek_id || typeof trek_id !== "string") {
      throw new ValidationError("trek_id is required");
    }

    if (!screenshot_base64 || typeof screenshot_base64 !== "string") {
      throw new ValidationError("screenshot_base64 is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify trek ownership and Pro tier
    const { data: trek, error: trekError } = await supabase
      .from("treks")
      .select("user_id, trek_name, skill_description, difficulty")
      .eq("id", trek_id)
      .single();

    if (trekError || !trek) {
      throw new ValidationError("Trek not found");
    }

    if (trek.user_id !== authUserId) {
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
        JSON.stringify({ error: "Over-the-Shoulder coaching requires a Pro subscription." }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `${SHERPA_SYSTEM_PROMPT}

You are now coaching Over-the-Shoulder. The climber is working in an external tool and has shared their screen. Analyze what you see and provide specific, actionable coaching. Reference exactly what is on screen. Keep it concise - 2-3 coaching points maximum.`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: screenshot_base64,
                },
              },
              {
                type: "text",
                text: `The climber is working on: ${trek.skill_description}
Trek: ${trek.trek_name}
${tool_name ? `Tool being used: ${tool_name}` : ""}
${current_task ? `Current task: ${current_task}` : ""}

Analyze this screenshot and provide coaching. Return a JSON object:
{
  "analysis": "Brief description of what you see on screen (1-2 sentences)",
  "coaching_points": [
    "Specific, actionable coaching point referencing what's on screen"
  ],
  "suggestion": "One clear next step the climber should take"
}

Return ONLY the JSON object.`,
              },
            ],
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
      const parsed = JSON.parse(cleaned);

      // Validate shape - must be a plain object, not array/scalar
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Unexpected response shape");
      }

      result = parsed;
    } catch {
      // Avoid logging screen-derived content that may contain PII/secrets
      console.error("Failed to parse screen analysis response");
      return new Response(
        JSON.stringify({ error: "Failed to analyze screen. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    result.analysis = result.analysis || "";
    result.coaching_points = Array.isArray(result.coaching_points) ? result.coaching_points : [];
    result.suggestion = result.suggestion || "";

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

    console.error("screen-analyze error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
