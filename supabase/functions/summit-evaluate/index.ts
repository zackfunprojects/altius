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
    const { trek_id, deliverable_url, deliverable_text } = body;

    if (!trek_id || typeof trek_id !== "string") {
      throw new ValidationError("trek_id is required");
    }

    if (!deliverable_text || typeof deliverable_text !== "string" || deliverable_text.trim().length === 0) {
      throw new ValidationError("deliverable_text is required - describe what you built");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the trek and verify ownership
    const { data: trek, error: trekError } = await supabase
      .from("treks")
      .select("*")
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

    if (trek.status !== "active") {
      throw new ValidationError("Trek must be active to submit a summit challenge");
    }

    // Verify all camps are completed
    const { data: camps, error: campsError } = await supabase
      .from("camps")
      .select("status")
      .eq("trek_id", trek_id);

    if (campsError) throw campsError;

    const incompleteCamps = (camps || []).filter(
      (c: { status: string }) => c.status !== "completed"
    );
    if (incompleteCamps.length > 0) {
      throw new ValidationError(
        `All camps must be completed before attempting the summit. ${incompleteCamps.length} camp(s) remaining.`
      );
    }

    const summitChallenge = trek.summit_challenge || {};
    const rubric = Array.isArray(summitChallenge.rubric) ? summitChallenge.rubric : [];

    // Build the evaluation prompt
    const rubricText = rubric
      .map(
        (r: { dimension: string; weight: number; criteria: string }, i: number) =>
          `${i + 1}. ${r.dimension} (weight: ${r.weight}): ${r.criteria}`
      )
      .join("\n");

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `${SHERPA_SYSTEM_PROMPT}

You are now the Summit Judge. You evaluate mastery challenges with honest, specific, rubric-based feedback. You write a Summit Entry - a short, personal reflection on the climber's journey and what they demonstrated. This entry goes into their permanent Trek Notebook.

Your Summit Entry should be 2-4 sentences. It should feel like a mentor writing a recommendation - specific to what this climber built, honest about their strengths, and written with warmth. Never generic. Never hollow praise.`,
        messages: [
          {
            role: "user",
            content: `Evaluate this summit challenge submission.

Trek: ${trek.trek_name}
Skill: ${trek.skill_description}
Difficulty: ${trek.difficulty}

Summit Challenge:
${summitChallenge.description || "Complete the mastery challenge for this skill."}

Evaluation Rubric:
${rubricText || "Evaluate overall mastery of the skill."}

Climber's Submission:
${deliverable_text.slice(0, 5000)}
${deliverable_url ? `\nDeliverable URL: ${deliverable_url}` : ""}

Pass criteria: Each dimension must score >= 0.6 AND overall score >= 0.7.

Return a JSON object with this exact structure:
{
  "passed": boolean,
  "overall_score": number between 0.0 and 1.0,
  "dimension_scores": [
    { "dimension": "dimension name from rubric", "score": number 0.0-1.0, "feedback": "specific feedback for this dimension" }
  ],
  "summit_entry": "Your 2-4 sentence Summit Entry for the Trek Notebook. Written as The Sherpa reflecting on this climber's achievement. Personal, specific, honest.",
  "retry_guidance": "If not passed: specific guidance on what to improve. If passed: null"
}

Be honest. Reference exactly what the climber submitted. If they described real work with specific details, evaluate that work. If the submission is vague or insufficient, say so directly.

Return ONLY the JSON object, no other text.`,
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
      console.error("Failed to parse summit evaluation:", text.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Failed to evaluate submission. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Validate and enforce pass criteria
    result.overall_score = typeof result.overall_score === "number" ? result.overall_score : 0;
    result.dimension_scores = Array.isArray(result.dimension_scores) ? result.dimension_scores : [];
    result.summit_entry = typeof result.summit_entry === "string" ? result.summit_entry : "";
    result.retry_guidance = result.retry_guidance || null;

    // Enforce: all dimensions >= 0.6 AND overall >= 0.7
    const allDimensionsPass = result.dimension_scores.every(
      (d: { score: number }) => typeof d.score === "number" && d.score >= 0.6
    );
    result.passed = result.passed === true && result.overall_score >= 0.7 && allDimensionsPass;

    // If passed, update the trek with summit data
    if (result.passed) {
      const { error: updateError } = await supabase
        .from("treks")
        .update({
          summit_entry: result.summit_entry,
          summit_deliverable_url: deliverable_url || null,
        })
        .eq("id", trek_id)
        .eq("user_id", authUserId);

      if (updateError) {
        console.error("Failed to update trek with summit data:", updateError.message);
        return new Response(
          JSON.stringify({ error: "Evaluation passed but failed to save. Please try again." }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

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

    console.error("summit-evaluate error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
