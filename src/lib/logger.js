/**
 * Structured error logging for production observability.
 * Logs to console in dev, structured JSON in production.
 */

const IS_DEV = import.meta.env.DEV

function safeStringify(obj) {
  try {
    return JSON.stringify(obj)
  } catch {
    return JSON.stringify({ level: obj.level, context: obj.context, message: 'Failed to serialize log entry' })
  }
}

export function logError(context, error, metadata = {}) {
  const message = error?.message || String(error)

  if (IS_DEV) {
    console.error(`[${context}]`, error, metadata)
  } else {
    console.error(safeStringify({
      ...metadata,
      level: 'error',
      context,
      message,
      timestamp: new Date().toISOString(),
    }))
  }
}

export function logWarn(context, message, metadata = {}) {
  if (IS_DEV) {
    console.warn(`[${context}]`, message, metadata)
  } else {
    console.warn(safeStringify({
      ...metadata,
      level: 'warn',
      context,
      message,
    }))
  }
}
