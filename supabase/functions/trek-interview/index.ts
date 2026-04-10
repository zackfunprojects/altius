import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { anthropic, SHERPA_SYSTEM_PROMPT } from "../_shared/anthropic.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { skill_description } = await req.json();

    if (!skill_description || typeof skill_description !== "string") {
      return new Response(
        JSON.stringify({ error: "skill_description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SHERPA_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `A new climber wants to learn: "${skill_description}"

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
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON from the response
    let questions;
    try {
      // Handle potential markdown code blocks in response
      const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
