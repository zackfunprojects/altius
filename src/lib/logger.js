/**
 * Structured error logging for production observability.
 * Logs to console in dev, can be extended to send to an external service.
 */

const IS_DEV = import.meta.env.DEV

export function logError(context, error, metadata = {}) {
  const entry = {
    level: 'error',
    context,
    message: error?.message || String(error),
    timestamp: new Date().toISOString(),
    ...metadata,
  }

  if (IS_DEV) {
    console.error(`[${context}]`, error, metadata)
  } else {
    // In production, structured log for Vercel/Supabase log drains
    console.error(JSON.stringify(entry))
  }
}

export function logWarn(context, message, metadata = {}) {
  if (IS_DEV) {
    console.warn(`[${context}]`, message, metadata)
  } else {
    console.warn(JSON.stringify({ level: 'warn', context, message, ...metadata }))
  }
}
