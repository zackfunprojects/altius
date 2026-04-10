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
    const { exercise_spec, user_response, attempt_number, exercise_index, section_id, trek_id } = body;

    if (!section_id || typeof section_id !== "string") {
      throw new ValidationError("section_id is required");
    }

    if (!exercise_spec || typeof exercise_spec !== "object") {
      throw new ValidationError("exercise_spec is required");
    }

    if (user_response === undefined || user_response === null) {
      throw new ValidationError("user_response is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the section and verify ownership
    const { data: section, error: sectionError } = await supabase
      .from("trail_sections")
      .select("*")
      .eq("id", section_id)
      .single();

    if (sectionError || !section) {
      throw new ValidationError("Section not found");
    }

    if (section.user_id !== authUserId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    let result;

    // For multiple_choice with a correct_answer, skip AI evaluation
    if (
      exercise_spec.exercise_type === "multiple_choice" &&
      exercise_spec.correct_answer
    ) {
      const selectedId = user_response.selected_option_id;
      let passed = false;

      // Check against correct_answer string
      if (selectedId === exercise_spec.correct_answer) {
        passed = true;
      }

      // Also check if options have is_correct flag
      if (
        !passed &&
        Array.isArray(exercise_spec.options) &&
        exercise_spec.options.some(
          (opt: { id?: string; is_correct?: boolean }) =>
            opt.id === selectedId && opt.is_correct === true
        )
      ) {
        passed = true;
      }

      result = {
        passed,
        score: passed ? 1.0 : 0.0,
        feedback: exercise_spec.explanation || (passed
          ? "Correct."
          : "That's not quite right. Review the material and try again."),
        dimension_scores: [],
        hints_for_retry: passed ? [] : ["Re-read the section and consider each option carefully."],
      };
    } else {
      // AI evaluation for all other exercise types
      const passThreshold = exercise_spec.pass_threshold || 0.7;

      const response = await callWithRetry(() =>
        anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: `${SHERPA_SYSTEM_PROMPT}

You are evaluating a climber's exercise response. Be fair, specific, and constructive. Never give generic praise. Your feedback should help the climber understand exactly what they did well and what needs improvement.`,
          messages: [
            {
              role: "user",
              content: `Evaluate this exercise submission.

Exercise spec:
${JSON.stringify(exercise_spec, null, 2)}

Climber's response:
${JSON.stringify(user_response, null, 2)}

Attempt number: ${attempt_number || 1}
Pass threshold: ${passThreshold}

Return a JSON object with this exact structure:
{
  "passed": boolean,
  "score": number between 0.0 and 1.0,
  "feedback": "specific feedback for the climber",
  "dimension_scores": [
    { "dimension": "name of assessment dimension", "score": number 0.0-1.0, "note": "brief note" }
  ],
  "hints_for_retry": ["hint 1", "hint 2"] // only if not passed
}

The climber passes if score >= ${passThreshold}. Be specific in your feedback - reference exactly what the climber wrote. If they are on attempt ${attempt_number || 1}, provide progressively more helpful hints.

Return ONLY the JSON object, no other text.`,
            },
          ],
        })
      );

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      try {
        const cleaned = text
          .replace(/```json?\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        result = JSON.parse(cleaned);
      } catch {
        console.error("Failed to parse evaluation response:", text.slice(0, 300));
        return new Response(
          JSON.stringify({ error: "Failed to evaluate response. Please try again." }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      // Ensure required fields
      result.passed = result.passed === true && result.score >= passThreshold;
      result.score = typeof result.score === "number" ? result.score : 0;
      result.feedback = result.feedback || "";
      result.dimension_scores = Array.isArray(result.dimension_scores) ? result.dimension_scores : [];
      result.hints_for_retry = Array.isArray(result.hints_for_retry) ? result.hints_for_retry : [];
    }

    // Write to exercise_responses table
    const { error: insertError } = await supabase
      .from("exercise_responses")
      .insert({
        section_id,
        trek_id: trek_id || section.trek_id,
        user_id: authUserId,
        exercise_index: exercise_index ?? 0,
        attempt_number: attempt_number || 1,
        response: user_response,
        evaluation: result,
        passed: result.passed,
      });

    if (insertError) {
      console.error("Failed to save exercise response:", insertError.message);
      // Don't fail the request - still return the evaluation
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

    console.error("exercise-evaluate error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
