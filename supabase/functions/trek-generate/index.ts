import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.103.0";
import { anthropic, SHERPA_SYSTEM_PROMPT } from "../_shared/anthropic.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { skill_description, prerequisite_answers, user_id, user_context } =
      await req.json();

    if (!skill_description || !user_id) {
      return new Response(
        JSON.stringify({ error: "skill_description and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context about prior treks for cross-trek intelligence
    const priorTreksContext = user_context?.notebook_skills?.length
      ? `\nThe climber has already summited these skills: ${user_context.notebook_skills.join(", ")}. Reference this prior knowledge where relevant and compress or skip camps that overlap.`
      : "";

    const prereqContext = prerequisite_answers?.length
      ? `\nPrerequisite interview answers:\n${prerequisite_answers.map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SHERPA_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `A climber wants to learn: "${skill_description}"
${prereqContext}
${priorTreksContext}

Generate a complete trek structure for this skill. The trek should be a realistic, well-scoped learning path from the climber's current level to demonstrable mastery.

Return ONLY a JSON object with this exact structure:
{
  "trek_name": "A memorable Sherpa-voiced name for this trek (e.g. 'The Launch Video Trail')",
  "difficulty": "one of: day_hike, weekend_trek, expedition, siege",
  "estimated_duration": "realistic time estimate (e.g. '2-3 weeks at 30 minutes per day')",
  "terrain_params": {
    "domain": "one of: technical, creative, communication, analytical, practical",
    "peakStyle": "sharp|flowing|rolling|layered|varied",
    "atmosphere": "crisp|warm|golden|misty|grounded"
  },
  "tool_recommendations": [
    { "name": "Tool Name", "url": "https://...", "free": true }
  ],
  "summit_challenge": {
    "description": "What mastery looks like - a specific deliverable or demonstration",
    "rubric": [
      { "dimension": "Dimension Name", "weight": 0.25, "criteria": "What excellence looks like" }
    ]
  },
  "skill_badge": {
    "icon": "a single descriptive word for the badge icon",
    "label": "Short skill label",
    "color": "hex color that fits the skill domain"
  },
  "camps": [
    {
      "camp_number": 0,
      "camp_name": "Base Camp: [Name] - always start with Base Camp",
      "learning_objectives": ["Objective 1", "Objective 2"],
      "sections": [
        {
          "section_number": 1,
          "title": "Section title",
          "section_type": "one of: concept, exercise, demonstration, guided_analysis, project_step, reflection, tool_tutorial, branching_scenario, parallel_route",
          "modalities": ["one or more of: fireside, trail_sketch, demonstration, practice_ledge, over_the_shoulder, branching_scenario, parallel_route, guided_analysis, multimodal_input"]
        }
      ],
      "checkpoint": {
        "type": "one of: multiple_choice, short_answer, drag_sequence, code_editor, writing_prompt, file_upload",
        "description": "What the climber must do to prove they're ready to advance"
      }
    }
  ]
}

Guidelines:
- 4-7 camps is typical. Day hikes: 2-3 camps. Sieges: 6-8 camps.
- Each camp should have 3-6 trail sections.
- Base camp (camp_number 0) always covers fundamentals and orientation.
- The final camp before the summit should be the most challenging practice.
- Section types should vary - mix concepts, exercises, demonstrations, and projects.
- The summit challenge should be a real deliverable appropriate to the skill.
- Rubric dimensions should be specific and evaluable.
- If the climber has prior experience (from prerequisite answers), compress early camps.

Return ONLY the JSON object, no other text.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let trekData;
    try {
      const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
      trekData = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse trek generation response", raw: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Write the trek structure to the database using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the trek row
    const { data: trek, error: trekError } = await supabase
      .from("treks")
      .insert({
        user_id,
        skill_description,
        trek_name: trekData.trek_name,
        difficulty: trekData.difficulty,
        status: "proposed",
        estimated_duration: trekData.estimated_duration,
        summit_challenge: trekData.summit_challenge,
        skill_badge: trekData.skill_badge,
        terrain_params: trekData.terrain_params,
        prerequisite_answers: prerequisite_answers || null,
        tool_recommendations: trekData.tool_recommendations || null,
        total_camps: trekData.camps?.length || 0,
      })
      .select()
      .single();

    if (trekError) {
      return new Response(
        JSON.stringify({ error: "Failed to create trek", detail: trekError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create camps and sections
    for (const camp of trekData.camps || []) {
      const { data: campRow, error: campError } = await supabase
        .from("camps")
        .insert({
          trek_id: trek.id,
          user_id,
          camp_number: camp.camp_number,
          camp_name: camp.camp_name,
          learning_objectives: camp.learning_objectives,
          checkpoint_definition: camp.checkpoint || null,
          status: "locked",
        })
        .select()
        .single();

      if (campError) {
        console.error("Failed to create camp:", campError);
        continue;
      }

      // Create trail sections for this camp
      const sections = (camp.sections || []).map(
        (section: {
          section_number: number;
          title: string;
          section_type: string;
          modalities: string[];
        }) => ({
          camp_id: campRow.id,
          trek_id: trek.id,
          user_id,
          section_number: section.section_number,
          title: section.title,
          section_type: section.section_type,
          modalities: section.modalities,
          status: "locked",
        })
      );

      if (sections.length > 0) {
        const { error: sectionsError } = await supabase
          .from("trail_sections")
          .insert(sections);

        if (sectionsError) {
          console.error("Failed to create sections:", sectionsError);
        }
      }
    }

    // Return the trek data and the created trek ID
    return new Response(
      JSON.stringify({
        trek_id: trek.id,
        trek_name: trekData.trek_name,
        difficulty: trekData.difficulty,
        estimated_duration: trekData.estimated_duration,
        terrain_params: trekData.terrain_params,
        tool_recommendations: trekData.tool_recommendations,
        summit_challenge: trekData.summit_challenge,
        skill_badge: trekData.skill_badge,
        camps: trekData.camps,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
