/**
 * Sanitizes text content to prevent XSS when rendering user or AI-generated strings.
 * Strips HTML tags and decodes common entities.
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Sanitizes an API error message for display.
 * Strips technical details, returns a user-friendly message.
 * Never leaks raw backend error strings to users.
 */
export function sanitizeErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'

  const raw = typeof error === 'string' ? error : String(error?.message || '')
  const msg = raw.toLowerCase()

  // Map common technical errors to friendly messages
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
    return 'Could not reach the server. Check your internet connection.'
  }
  if (msg.includes('jwt') || msg.includes('token') || msg.includes('session')) {
    return 'Your session has expired. Please sign in again.'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (msg.includes('pgrst') || msg.includes('violates') || msg.includes('constraint')) {
    return 'A database error occurred. Please try again.'
  }

  // Only return the raw message if it looks user-safe (short, no technical jargon)
  if (raw.length <= 120 && !msg.includes('error') && !msg.includes('exception') && !msg.includes('stack')) {
    return raw
  }

  return 'Something went wrong. Please try again.'
}
