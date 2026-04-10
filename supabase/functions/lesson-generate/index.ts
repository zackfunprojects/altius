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
    const { section_id } = body;

    if (!section_id || typeof section_id !== "string") {
      throw new ValidationError("section_id is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the section
    const { data: section, error: sectionError } = await supabase
      .from("trail_sections")
      .select("*")
      .eq("id", section_id)
      .single();

    if (sectionError || !section) {
      throw new ValidationError("Section not found");
    }

    // Verify ownership
    if (section.user_id !== authUserId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // If content already exists, return it
    if (section.content) {
      return new Response(
        JSON.stringify(section.content),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fetch camp context
    const { data: camp } = await supabase
      .from("camps")
      .select("camp_name, learning_objectives, camp_number")
      .eq("id", section.camp_id)
      .single();

    // Fetch trek context
    const { data: trek } = await supabase
      .from("treks")
      .select("skill_description, trek_name, difficulty, prerequisite_answers, tool_recommendations")
      .eq("id", section.trek_id)
      .single();

    // Fetch prior sections in this camp for context
    const { data: priorSections } = await supabase
      .from("trail_sections")
      .select("title, section_type, status")
      .eq("camp_id", section.camp_id)
      .lt("section_number", section.section_number)
      .order("section_number");

    // Fetch exercise performance from prior sections in this trek
    const { data: priorExercises } = await supabase
      .from("exercise_responses")
      .select("passed, evaluation")
      .eq("trek_id", section.trek_id)
      .eq("user_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch notebook for cross-trek context
    const { data: notebook } = await supabase
      .from("trek_notebook")
      .select("skill_name, key_concepts")
      .eq("user_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Assess learner performance
    const totalExercises = priorExercises?.length || 0;
    const passedExercises = priorExercises?.filter((e) => e.passed).length || 0;
    const performanceNote = totalExercises > 0
      ? `The climber has completed ${passedExercises}/${totalExercises} exercises so far. ${
          passedExercises / totalExercises < 0.6
            ? "They appear to be struggling - provide more detailed explanations and examples."
            : passedExercises / totalExercises > 0.9
              ? "They are excelling - you can move at a brisker pace and go deeper."
              : "They are progressing steadily."
        }`
      : "";

    const notebookContext = notebook?.length
      ? `Prior completed treks: ${notebook.map((n) => `${n.skill_name} (concepts: ${(n.key_concepts || []).join(", ")})`).join("; ")}`
      : "";

    const priorSectionsContext = priorSections?.length
      ? `Sections already covered in this camp: ${priorSections.map((s) => `${s.title} (${s.section_type})`).join(", ")}`
      : "This is the first section in this camp.";

    const toolContext = trek?.tool_recommendations?.length
      ? `Recommended tools for this trek: ${trek.tool_recommendations.map((t: { name: string; free: boolean }) => `${t.name}${t.free ? " (free)" : ""}`).join(", ")}`
      : "";

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SHERPA_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate lesson content for a trail section in the trek "${trek?.trek_name || "Unknown"}".

Skill being learned: ${trek?.skill_description || "Unknown"}
Difficulty: ${trek?.difficulty || "weekend_trek"}
Camp: ${camp?.camp_name || "Unknown"} (Camp ${camp?.camp_number || 0})
Camp objectives: ${(camp?.learning_objectives || []).join("; ")}

Section: "${section.title}"
Section type: ${section.section_type}
Teaching modalities to use: ${(section.modalities || []).join(", ")}

${priorSectionsContext}
${performanceNote}
${notebookContext}
${toolContext}

Generate the lesson content as a JSON object with this structure:
{
  "narrative": [
    // Ordered array of content blocks. Mix these types based on the section's modalities:

    // Sherpa teaching text - the core instructional content
    { "type": "sherpa_text", "content": "Teaching text in the Sherpa's voice..." },

    // Visual diagram or flowchart (for trail_sketch modality)
    { "type": "trail_sketch", "spec": {
      "title": "Diagram title",
      "steps": [
        { "label": "Step 1", "description": "What this step means" },
        { "label": "Step 2", "description": "What this step means" }
      ]
    }},

    // Step-by-step demonstration (for demonstration modality)
    { "type": "demonstration", "spec": {
      "title": "Demo title",
      "steps": [
        { "step": 1, "instruction": "What to do", "explanation": "Why this works" }
      ]
    }},

    // Real-world example analysis (for guided_analysis modality)
    { "type": "guided_analysis", "spec": {
      "title": "Analysis title",
      "examples": [
        { "title": "Example name", "description": "What to observe", "analysis_prompts": ["What do you notice about...?"] }
      ]
    }},

    // Exercise (for practice_ledge modality) - define the exercise spec
    // Choose the exercise_type that best matches the skill being practiced:
    { "type": "exercise", "spec": {
      "exercise_type": "one of: multiple_choice, short_answer, writing_prompt, drag_sequence, code_editor, conversation_sim",
      "prompt": "The exercise instruction in your Sherpa voice",
      "pass_threshold": 0.7,
      "hints": ["Hint 1 if they struggle", "Hint 2 for further help"],
      // For multiple_choice:
      "options": [{"id": "a", "text": "Option text"}],
      "correct_answer": "a",
      "explanation": "Why this is correct",
      // For short_answer:
      "expected_concepts": ["concept1", "concept2"],
      "min_length": 50,
      // For writing_prompt:
      "constraints": {"min_words": 50, "max_words": 300},
      "rubric": "What a good response addresses",
      // For drag_sequence:
      "items": [{"id": "1", "content": "Item to sequence"}],
      "correct_order": ["1", "2", "3"],
      // For code_editor:
      "language": "javascript",
      "starter_code": "function solve(input) {\\n  // your code here\\n}",
      "test_cases": [{"input": "test input", "expected_output": "expected", "description": "Test name"}],
      // For conversation_sim:
      "scenario": "Scenario description",
      "npc_character": "Character description",
      "user_role": "Your role",
      "objectives": ["Objective 1"],
      "max_turns": 6,
      "evaluation_dimensions": ["dimension1"]
    }},
    // Include ONLY the fields relevant to the chosen exercise_type

    // Parallel route - user and Sherpa both produce from same brief, then compare
    { "type": "parallel_route", "spec": {
      "brief": "The shared brief/task",
      "user_prompt": "What the climber should produce",
      "sherpa_version": "The Sherpa's approach (hidden until climber submits)",
      "comparison_dimensions": ["Dimension to compare"]
    }},

    // Branching scenario - interactive choices with consequences
    { "type": "branching_scenario", "spec": {
      "scenario_text": "The situation described",
      "choices": [
        { "id": "a", "text": "Choice text", "consequence": "What happens", "next_scenario": { "scenario_text": "Next situation", "choices": [...] } }
      ]
    }},

    // Tool recommendation
    { "type": "tool_recommendation", "spec": {
      "name": "Tool name",
      "description": "What it's for and why",
      "free": true
    }},

    // Reflection prompt
    { "type": "reflection_prompt", "prompt": "A thoughtful question for the climber to reflect on..." }
  ],
  "estimated_minutes": 15
}

Guidelines:
- Start with a sherpa_text block that orients the climber to what this section covers
- Use 4-8 content blocks total
- Mix block types based on the modalities listed
- Teaching should be specific and practical, not generic
- The Sherpa's voice is warm but direct - no filler, no generic praise
- If this section is an exercise type, include at least one exercise block
- End with either a sherpa_text summary or a reflection prompt
- Content should build on prior sections without repeating them

Return ONLY the JSON object, no other text.`,
          },
        ],
      })
    );

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let content;
    try {
      const cleaned = text
        .replace(/```json?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      content = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse lesson content:", text.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Failed to generate lesson. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Validate basic structure
    if (!content.narrative || !Array.isArray(content.narrative)) {
      content = { narrative: [{ type: "sherpa_text", content: text }], estimated_minutes: 10 };
    }

    // Save content to the section (conditional: only if still null to avoid race)
    const { data: updated } = await supabase
      .from("trail_sections")
      .update({ content })
      .eq("id", section_id)
      .is("content", null)
      .select("content")
      .maybeSingle();

    // If another request already wrote content, return the existing content
    if (!updated) {
      const { data: existing } = await supabase
        .from("trail_sections")
        .select("content")
        .eq("id", section_id)
        .single();
      if (existing?.content) {
        return new Response(
          JSON.stringify(existing.content),
          { headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify(content),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("lesson-generate error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
