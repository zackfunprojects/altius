import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set in Supabase secrets");
}

export const anthropic = new Anthropic({ apiKey });

export const SHERPA_SYSTEM_PROMPT = `You are The Sherpa - a patient, deeply experienced mountain guide who teaches climbers the skills they need to reach their summits. You speak with warmth and unhurried wisdom. You use the language of the mountain naturally: weather, terrain, pace, rest, altitude. You never shame the climber for slowness or gaps. You treat difficulty as the mountain teaching, not the climber failing.

You are not a chatbot. You are a tutor and guide. You build trails, teach lessons, create exercises, and verify mastery. Your teaching is specific, adaptive, and honest. You do not move a climber forward until they are ready. You do not simplify to the point of dishonesty. You meet each climber exactly where they are and take them exactly where they need to go.

You never say "Great job" or give generic praise. Everything you say is specific to this climber, this skill, this moment on the trail.`;

/**
 * Calls Anthropic with exponential backoff retry logic.
 */
export async function callWithRetry(
  fn: () => Promise<Anthropic.Message>,
  maxRetries = 3
): Promise<Anthropic.Message> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err instanceof Anthropic.RateLimitError ||
        err instanceof Anthropic.InternalServerError ||
        err instanceof Anthropic.APIConnectionError;

      if (!isRetryable || attempt === maxRetries - 1) throw err;

      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Retry loop exited unexpectedly");
}

const MAX_SKILL_LENGTH = 500;
const MAX_ANSWER_LENGTH = 1000;

/**
 * Validates and sanitizes skill description input.
 */
export function validateSkillDescription(input: unknown): string {
  if (!input || typeof input !== "string") {
    throw new ValidationError("skill_description is required and must be a string");
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new ValidationError("skill_description cannot be empty");
  }
  if (trimmed.length > MAX_SKILL_LENGTH) {
    throw new ValidationError(`skill_description must be ${MAX_SKILL_LENGTH} characters or fewer`);
  }
  return trimmed;
}

/**
 * Validates prerequisite answers array.
 */
export function validatePrerequisiteAnswers(
  input: unknown
): Array<{ question: string; answer: string }> | null {
  if (!input) return null;
  if (!Array.isArray(input)) {
    throw new ValidationError("prerequisite_answers must be an array");
  }
  return input.map((item, i) => {
    if (!item || typeof item !== "object") {
      throw new ValidationError(`prerequisite_answers[${i}] must be an object`);
    }
    const q = typeof item.question === "string" ? item.question.trim() : "";
    const a = typeof item.answer === "string" ? item.answer.trim().slice(0, MAX_ANSWER_LENGTH) : "";
    return { question: q, answer: a };
  });
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Extracts the authenticated user ID from a Supabase request.
 * Returns null if not authenticated.
 */
export function getUserIdFromRequest(req: Request): string | null {
  // Supabase Edge Functions receive the JWT in the Authorization header.
  // The user ID is available via the decoded JWT. We parse it manually
  // since we don't have access to supabase.auth.getUser() in edge context.
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    // JWT is base64url encoded: header.payload.signature
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub || null;
  } catch {
    return null;
  }
}

// Simple in-memory rate limiter (per-function instance, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per user

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}
