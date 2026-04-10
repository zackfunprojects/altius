import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.103.0";
import {
  anthropic,
  SHERPA_SYSTEM_PROMPT,
  callWithRetry,
  validateSkillDescription,
  validatePrerequisiteAnswers,
  getUserIdFromRequest,
  checkRateLimit,
  ValidationError,
} from "../_shared/anthropic.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VALID_DIFFICULTIES = ["day_hike", "weekend_trek", "expedition", "siege"];
const VALID_SECTION_TYPES = [
  "concept", "exercise", "demonstration", "guided_analysis",
  "project_step", "reflection", "tool_tutorial", "branching_scenario", "parallel_route",
];
const VALID_MODALITIES = [
  "fireside", "trail_sketch", "demonstration", "practice_ledge",
  "over_the_shoulder", "branching_scenario", "parallel_route", "guided_analysis", "multimodal_input",
];

/**
 * Validates the AI-generated trek structure and sanitizes fields.
 */
function validateTrekData(data: Record<string, unknown>): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    throw new ValidationError("AI returned invalid trek structure");
  }

  const trekName = typeof data.trek_name === "string" ? data.trek_name.trim() : null;
  if (!trekName) throw new ValidationError("AI did not generate a trek name");

  const difficulty = VALID_DIFFICULTIES.includes(data.difficulty as string)
    ? data.difficulty
    : "weekend_trek";

  const camps = Array.isArray(data.camps) ? data.camps : [];
  if (camps.length === 0) throw new ValidationError("AI did not generate any camps");

  // Validate camps have contiguous numbering starting from 0
  const validatedCamps = camps.map((camp: Record<string, unknown>, i: number) => {
    if (!camp || typeof camp !== "object") {
      throw new ValidationError(`Camp ${i} is invalid`);
    }

    const campName = typeof camp.camp_name === "string" ? camp.camp_name : `Camp ${i}`;
    const objectives = Array.isArray(camp.learning_objectives)
      ? camp.learning_objectives.filter((o: unknown) => typeof o === "string")
      : [];

    const sections = Array.isArray(camp.sections)
      ? camp.sections.map((s: Record<string, unknown>, j: number) => ({
          section_number: j + 1, // Force sequential numbering
          title: typeof s.title === "string" ? s.title : `Section ${j + 1}`,
          section_type: VALID_SECTION_TYPES.includes(s.section_type as string)
            ? s.section_type
            : "concept",
          modalities: Array.isArray(s.modalities)
            ? s.modalities.filter((m: unknown) => VALID_MODALITIES.includes(m as string))
            : ["fireside"],
        }))
      : [];

    if (sections.length === 0) {
      throw new ValidationError(`Camp "${campName}" has no sections`);
    }

    return {
      camp_number: i, // Force sequential numbering starting from 0
      camp_name: campName,
      learning_objectives: objectives,
      sections,
      checkpoint: camp.checkpoint && typeof camp.checkpoint === "object" ? camp.checkpoint : null,
    };
  });

  // Validate summit_challenge
  const summit = data.summit_challenge as Record<string, unknown> | undefined;
  const summitChallenge = {
    description: summit && typeof summit.description === "string"
      ? summit.description
      : "Demonstrate mastery of the skill.",
    rubric: summit && Array.isArray(summit.rubric)
      ? summit.rubric.filter(
          (r: unknown) =>
            r && typeof r === "object" && typeof (r as Record<string, unknown>).dimension === "string"
        )
      : [],
  };

  return {
    ...data,
    trek_name: trekName,
    difficulty,
    estimated_duration: typeof data.estimated_duration === "string" ? data.estimated_duration : "2-4 weeks",
    camps: validatedCamps,
    summit_challenge: summitChallenge,
    terrain_params: data.terrain_params && typeof data.terrain_params === "object" ? data.terrain_params : null,
    tool_recommendations: Array.isArray(data.tool_recommendations) ? data.tool_recommendations : [],
    skill_badge: data.skill_badge && typeof data.skill_badge === "object"
      ? data.skill_badge
      : { icon: "default", label: trekName, color: "#1A3D7C" },
  };
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Auth check - verify JWT user matches requested user_id
    const authUserId = getUserIdFromRequest(req);
    if (!authUserId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Rate limit
    if (!checkRateLimit(authUserId)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const skillDescription = validateSkillDescription(body.skill_description);
    const prerequisiteAnswers = validatePrerequisiteAnswers(body.prerequisite_answers);

    // Validate user_id matches authenticated user
    const requestedUserId = body.user_id;
    if (requestedUserId && requestedUserId !== authUserId) {
      return new Response(
        JSON.stringify({ error: "User ID mismatch" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
    const userId = authUserId;

    // Build context about prior treks
    const userContext = body.user_context;
    const priorTreksContext = userContext?.notebook_skills?.length
      ? `\nThe climber has already summited these skills: ${userContext.notebook_skills.join(", ")}. Reference this prior knowledge where relevant and compress or skip camps that overlap.`
      : "";

    const prereqContext = prerequisiteAnswers?.length
      ? `\nPrerequisite interview answers:\n${prerequisiteAnswers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}`
      : "";

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SHERPA_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `A climber wants to learn: "${skillDescription}"
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
      })
    );

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let rawTrekData;
    try {
      const cleaned = text
        .replace(/```json?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      rawTrekData = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse trek generation response:", text.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Failed to generate trek. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize AI response
    const trekData = validateTrekData(rawTrekData);

    // Write the trek structure to the database using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the trek row
    const { data: trek, error: trekError } = await supabase
      .from("treks")
      .insert({
        user_id: userId,
        skill_description: skillDescription,
        trek_name: trekData.trek_name,
        difficulty: trekData.difficulty,
        status: "proposed",
        estimated_duration: trekData.estimated_duration,
        summit_challenge: trekData.summit_challenge,
        skill_badge: trekData.skill_badge,
        terrain_params: trekData.terrain_params,
        prerequisite_answers: prerequisiteAnswers,
        tool_recommendations: trekData.tool_recommendations,
        total_camps: (trekData.camps as unknown[]).length,
      })
      .select()
      .single();

    if (trekError) {
      console.error("Failed to create trek:", trekError);
      return new Response(
        JSON.stringify({ error: "Failed to save trek. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Create camps and sections - rollback trek on failure
    const camps = trekData.camps as Array<Record<string, unknown>>;
    try {
      for (const camp of camps) {
        const { data: campRow, error: campError } = await supabase
          .from("camps")
          .insert({
            trek_id: trek.id,
            user_id: userId,
            camp_number: camp.camp_number,
            camp_name: camp.camp_name,
            learning_objectives: camp.learning_objectives,
            checkpoint_definition: camp.checkpoint || null,
            status: "locked",
          })
          .select()
          .single();

        if (campError) {
          throw new Error(`Failed to create camp "${camp.camp_name}": ${campError.message}`);
        }

        const sections = (camp.sections as Array<Record<string, unknown>>).map(
          (section) => ({
            camp_id: campRow.id,
            trek_id: trek.id,
            user_id: userId,
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
            throw new Error(`Failed to create sections for "${camp.camp_name}": ${sectionsError.message}`);
          }
        }
      }
    } catch (dbError) {
      // Rollback: delete the trek (CASCADE will clean up camps and sections)
      console.error("Rolling back trek creation:", dbError);
      await supabase.from("treks").delete().eq("id", trek.id);
      return new Response(
        JSON.stringify({ error: "Failed to save trek structure. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fire trek_started expedition event
    await supabase.from("expedition_events").insert({
      user_id: userId,
      trek_id: trek.id,
      event_type: "trek_started",
      title: `New trek: ${trekData.trek_name}`,
      body: `The Sherpa has mapped a ${trekData.difficulty} trek with ${camps.length} camps.`,
      metadata: { difficulty: trekData.difficulty, camps: camps.length },
    });

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
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("trek-generate error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
