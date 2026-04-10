import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  anthropic,
  SHERPA_SYSTEM_PROMPT,
  callWithRetry,
  validateSkillDescription,
  getUserIdFromRequest,
  checkRateLimit,
  ValidationError,
} from "../_shared/anthropic.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Auth check
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const skillDescription = validateSkillDescription(body.skill_description);

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SHERPA_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `A new climber wants to learn: "${skillDescription}"

Before mapping their trail, you need to understand what they already carry. Generate 2-3 prerequisite interview questions specific to this skill. These questions should assess:
1. Their existing knowledge or experience with this skill
2. Any tools, software, or resources they already have
3. Their specific goals or what they want to be able to do

Return ONLY a JSON array of question objects. Each object has:
- "question": the question text, written in the Sherpa's voice (warm, direct, mountaineering-flavored)
- "purpose": internal note explaining what this question reveals about the climber (not shown to user)

Example format:
[
  { "question": "Have you edited video before? Even roughly - phone clips, school projects, anything.", "purpose": "Assesses baseline video editing experience to determine starting camp" },
  { "question": "Do you have editing software on your machine, or are we starting from bare rock?", "purpose": "Determines tool setup needs and whether a tool tutorial camp is needed" }
]

Return ONLY the JSON array, no other text.`,
          },
        ],
      })
    );

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let questions;
    try {
      const cleaned = text
        .replace(/```json?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      questions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", text.slice(0, 200));
      return new Response(
        JSON.stringify({ error: "Failed to generate questions. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Validate response structure
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("AI returned invalid questions structure:", questions);
      return new Response(
        JSON.stringify({ error: "Failed to generate questions. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Ensure each question has required fields
    const validated = questions
      .filter(
        (q: unknown) =>
          q && typeof q === "object" && typeof (q as Record<string, unknown>).question === "string"
      )
      .map((q: Record<string, string>) => ({
        question: q.question,
        purpose: q.purpose || "",
      }));

    if (validated.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to generate valid questions. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ questions: validated }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("trek-interview error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
