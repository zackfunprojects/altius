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

/**
 * Computes expedition day from profile creation date.
 * Port of src/lib/expedition.js for server-side use.
 */
function getExpeditionDay(createdAt: string): number {
  const start = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Truncates text to maxLen chars, appending "..." if truncated.
 */
function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || "";
  return text.slice(0, maxLen) + "...";
}

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
    const { message, section_id, trek_id, conversation_history, mode } = body;
    const chatMode = mode === "general" ? "general" : "section";

    if (!message || typeof message !== "string") {
      throw new ValidationError("message is required");
    }
    if (message.trim().length === 0) {
      throw new ValidationError("message cannot be empty");
    }
    if (message.length > 2000) {
      throw new ValidationError("message must be 2000 characters or fewer");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ═══════════════════════════════════════════════════════════
    // 5-BLOCK CONTEXT ASSEMBLY (all queries run in parallel)
    // ═══════════════════════════════════════════════════════════

    // Block 2: Expedition State - profile
    const profilePromise = supabase
      .from("profiles")
      .select("display_name, current_elevation, subscription_tier, total_treks_completed, expedition_origin, created_at")
      .eq("id", authUserId)
      .single();

    // Block 3: Active Trek Context
    const trekPromise = trek_id
      ? supabase
          .from("treks")
          .select("trek_name, skill_description, difficulty, total_camps, completed_camps, prerequisite_answers, user_id")
          .eq("id", trek_id)
          .single()
      : Promise.resolve({ data: null });

    const activeCampPromise = trek_id
      ? supabase
          .from("camps")
          .select("camp_name, camp_number, status")
          .eq("trek_id", trek_id)
          .eq("status", "active")
          .order("camp_number")
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null });

    // Section context (for section mode)
    const sectionPromise = section_id
      ? supabase
          .from("trail_sections")
          .select("title, section_type, modalities, content, user_id")
          .eq("id", section_id)
          .single()
      : Promise.resolve({ data: null });

    // Exercise performance across the trek
    const exercisePromise = trek_id
      ? supabase
          .from("exercise_responses")
          .select("passed, evaluation, attempt_number")
          .eq("trek_id", trek_id)
          .eq("user_id", authUserId)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: null });

    // Block 4: Trek Journal
    const journalPromise = trek_id
      ? supabase
          .from("trek_journal")
          .select("body, is_camp_reflection, created_at")
          .eq("trek_id", trek_id)
          .eq("user_id", authUserId)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: null });

    // Block 5: Trek Notebook (cross-trek memory)
    const notebookPromise = supabase
      .from("trek_notebook")
      .select("skill_name, key_concepts, summit_entry")
      .eq("user_id", authUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Execute all queries in parallel (capture errors for logging)
    const results = await Promise.all([
      profilePromise,
      trekPromise,
      activeCampPromise,
      sectionPromise,
      exercisePromise,
      journalPromise,
      notebookPromise,
    ]);

    // Log query errors but don't fail the request
    for (const r of results) {
      if (r && typeof r === "object" && "error" in r && r.error) {
        console.warn("Context query error:", r.error.message);
      }
    }

    const profile = results[0]?.data ?? null;
    const trek = results[1]?.data ?? null;
    const activeCamp = results[2]?.data ?? null;
    const section = results[3]?.data ?? null;
    const exercises = results[4]?.data ?? null;
    const journal = results[5]?.data ?? null;
    const notebook = results[6]?.data ?? null;

    // Verify ownership for section and trek
    if (section && section.user_id !== authUserId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
    if (trek && trek.user_id !== authUserId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Verify section belongs to the trek if both provided
    if (section && trek_id && section_id) {
      const { data: sectionCheck } = await supabase
        .from("trail_sections")
        .select("trek_id")
        .eq("id", section_id)
        .single();
      if (sectionCheck && sectionCheck.trek_id !== trek_id) {
        return new Response(
          JSON.stringify({ error: "Section does not belong to this trek" }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // ASSEMBLE CONTEXT STRING
    // ═══════════════════════════════════════════════════════════

    const contextParts: string[] = [];

    // Block 2: Expedition State
    if (profile) {
      const expeditionDay = profile.created_at ? getExpeditionDay(profile.created_at) : 1;
      contextParts.push(
        `Climber: ${profile.display_name || "Unknown"}
Elevation: ${profile.current_elevation || 0} ft
Expedition Day: ${expeditionDay}
Subscription: ${profile.subscription_tier || "free"}
Treks Completed: ${profile.total_treks_completed || 0}`
      );
    }

    // Block 3: Active Trek Context
    if (trek) {
      let trekBlock = `Active Trek: "${trek.trek_name}" - learning ${trek.skill_description} (${trek.difficulty})
Camp Progress: ${trek.completed_camps || 0}/${trek.total_camps || 0} camps`;

      if (activeCamp) {
        trekBlock += `\nCurrent Camp: ${activeCamp.camp_name} (Camp ${activeCamp.camp_number})`;
      }

      // Section context
      if (section) {
        trekBlock += `\nCurrent Section: "${section.title}" (${section.section_type})`;
        if (chatMode === "section" && Array.isArray(section.content?.narrative)) {
          const textBlocks = section.content.narrative
            .filter((b: { type: string }) => b.type === "sherpa_text")
            .map((b: { content: string }) => b.content)
            .join("\n");
          if (textBlocks.length > 0) {
            trekBlock += `\nLesson summary: ${truncate(textBlocks, 1200)}`;
          }
        }
      }

      // Exercise performance
      if (exercises && exercises.length > 0) {
        const total = exercises.length;
        const passed = exercises.filter((e: { passed: boolean }) => e.passed).length;
        const failedMultiple = exercises.filter(
          (e: { passed: boolean; attempt_number: number }) => !e.passed && e.attempt_number >= 2
        ).length;
        trekBlock += `\nExercise Performance: ${passed}/${total} passed`;
        if (failedMultiple > 0) {
          trekBlock += ` (${failedMultiple} exercises struggled with)`;
        }
      }

      contextParts.push(trekBlock);
    }

    // Block 4: Trek Journal
    if (journal && journal.length > 0) {
      const journalLines = journal
        .slice(0, 5)
        .map((j: { body: string; is_camp_reflection: boolean }) =>
          `- ${j.is_camp_reflection ? "[Camp Reflection] " : ""}${truncate(j.body, 200)}`
        )
        .join("\n");
      contextParts.push(`Recent Journal Notes:\n${journalLines}`);
    }

    // Block 5: Trek Notebook (cross-trek memory)
    if (notebook && notebook.length > 0) {
      const notebookLines = notebook
        .slice(0, 5)
        .map((n: { skill_name: string; key_concepts: string[] }) => {
          const concepts = Array.isArray(n.key_concepts)
            ? n.key_concepts.slice(0, 3).join(", ")
            : "";
          return `- ${n.skill_name}${concepts ? ` (${concepts})` : ""}`;
        })
        .join("\n");
      contextParts.push(`Completed Treks:\n${notebookLines}`);
    }

    // Build context instruction
    const contextInstruction = chatMode === "general"
      ? "The climber is in a general conversation with you. You have full context of their expedition. Be helpful, specific, and reference their actual progress. Keep your warmth and wisdom."
      : "The climber is asking a question during their lesson. Answer in the context of what they are currently learning. Be helpful and specific. Keep answers concise but thorough.";

    const fullContext = contextParts.length > 0
      ? `${contextParts.join("\n\n")}\n\n${contextInstruction}`
      : contextInstruction;

    // ═══════════════════════════════════════════════════════════
    // CALL AI
    // ═══════════════════════════════════════════════════════════

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (Array.isArray(conversation_history)) {
      for (const msg of conversation_history.slice(-20)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: typeof msg.content === "string" ? truncate(msg.content, 2000) : "",
          });
        }
      }
    }

    messages.push({ role: "user", content: message.trim() });

    const maxTokens = chatMode === "general" ? 2048 : 1024;

    const response = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: `${SHERPA_SYSTEM_PROMPT}\n\n${fullContext}`,
        messages,
      })
    );

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return new Response(
      JSON.stringify({ response: text }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    console.error("sherpa error:", error.message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
