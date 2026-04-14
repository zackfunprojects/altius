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
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
const elevenlabsVoiceId = Deno.env.get("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel

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
    const { trek_id, section_id, audio_base64, conversation_history } = body;

    if (!audio_base64 || typeof audio_base64 !== "string") {
      throw new ValidationError("audio_base64 is required");
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "Voice features require additional setup. Contact support." }),
        { status: 503, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Transcribe audio via OpenAI Whisper
    const audioBytes = Uint8Array.from(atob(audio_base64), (c) => c.charCodeAt(0));
    const audioBlob = new Blob([audioBytes], { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-1");

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error("Whisper error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to transcribe audio. Please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text || "";

    if (!transcript.trim()) {
      return new Response(
        JSON.stringify({ error: "Could not detect speech. Please try again." }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get Sherpa response via Claude
    // Build context messages from conversation history
    const messages: Array<{ role: string; content: string }> = [];

    if (Array.isArray(conversation_history)) {
      for (const msg of conversation_history.slice(-10)) {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content.slice(0, 2000) });
        }
      }
    }

    messages.push({ role: "user", content: transcript });

    // Fetch trek context for Sherpa
    let contextBlock = "";
    if (trek_id) {
      const { data: trek } = await supabase
        .from("treks")
        .select("trek_name, skill_description, difficulty")
        .eq("id", trek_id)
        .single();

      if (trek) {
        contextBlock = `\n\nTrek context: ${trek.trek_name} (${trek.difficulty}) - ${trek.skill_description}`;
      }
    }

    const sherpaResponse = await callWithRetry(() =>
      anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: `${SHERPA_SYSTEM_PROMPT}

You are in Fireside Lesson mode - a spoken conversation with the climber. Keep responses concise and conversational (2-4 sentences). Speak naturally as you would around a campfire. Do not use markdown formatting, bullet points, or code blocks - this will be read aloud.${contextBlock}`,
        messages: messages as Array<{ role: "user" | "assistant"; content: string }>,
      })
    );

    const responseText =
      sherpaResponse.content?.[0]?.type === "text" ? sherpaResponse.content[0].text : "";

    // Step 3: Synthesize speech via ElevenLabs (optional)
    let audioResponseBase64 = null;

    if (elevenlabsApiKey && responseText) {
      try {
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${elevenlabsVoiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": elevenlabsApiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: responseText,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.6,
                similarity_boost: 0.75,
              },
            }),
          }
        );

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const bytes = new Uint8Array(audioBuffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          audioResponseBase64 = btoa(binary);
        } else {
          console.error("ElevenLabs TTS error:", await ttsResponse.text());
        }
      } catch (ttsErr) {
        console.error("TTS synthesis failed:", (ttsErr as Error).message);
      }
    }

    return new Response(
      JSON.stringify({
        transcript,
        response_text: responseText,
        audio_base64: audioResponseBase64,
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

    console.error("sherpa-voice error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
