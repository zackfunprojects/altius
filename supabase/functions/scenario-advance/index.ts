import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  anthropic,
  SHERPA_SYSTEM_PROMPT,
  callWithRetry,
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
    const { exercise_spec, conversation_history, user_message } = body;

    if (!exercise_spec || typeof exercise_spec !== "object") {
      throw new ValidationError("exercise_spec is required");
    }

    if (!exercise_spec.npc_character || !exercise_spec.scenario || !exercise_spec.max_turns) {
      throw new ValidationError("exercise_spec must include npc_character, scenario, and max_turns");
    }

    if (!user_message || typeof user_message !== "string") {
      throw new ValidationError("user_message is required");
    }

    if (user_message.trim().length === 0) {
      throw new ValidationError("user_message cannot be empty");
    }

    if (!Array.isArray(conversation_history)) {
      throw new ValidationError("conversation_history must be an array");
    }

    // Build conversation messages
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of conversation_history) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role,
          content: typeof msg.content === "string" ? msg.content : "",
        });
      }
    }

    messages.push({ role: "user", content: user_message.trim() });

    const turnNumber = Math.ceil(messages.filter((m) => m.role === "user").length);
    const isComplete = turnNumber >= exercise_spec.max_turns;

    const scenarioContext = `You are playing a character in a conversation simulator exercise.

Character: ${exercise_spec.npc_character}
Scenario: ${exercise_spec.scenario}
${exercise_spec.user_role ? `The climber's role: ${exercise_spec.user_role}` : ""}
${exercise_spec.objectives ? `Learning objectives: ${Array.isArray(exercise_spec.objectives) ? exercise_spec.objectives.join("; ") : exercise_spec.objectives}` : ""}

Stay in character as the NPC described above. Respond naturally as that character would. Do not break character or provide meta-commentary about the exercise.

${isComplete ? "This is the final turn of the scenario. Bring the conversation to a natural conclusion." : `This is turn ${turnNumber} of ${exercise_spec.max_turns}.`}`;

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `${SHERPA_SYSTEM_PROMPT}\n\n${scenarioContext}`,
        messages,
      })
    );

    const npcResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    return new Response(
      JSON.stringify({
        npc_response: npcResponse,
        turn_number: turnNumber,
        is_complete: isComplete,
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

    console.error("scenario-advance error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
