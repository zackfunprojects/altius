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
 */
export function sanitizeErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'

  const msg = typeof error === 'string' ? error : error.message || ''

  // Map common technical errors to friendly messages
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Could not reach the server. Check your internet connection.'
  }
  if (msg.includes('JWT') || msg.includes('token')) {
    return 'Your session has expired. Please sign in again.'
  }
  if (msg.includes('rate limit') || msg.includes('Too many requests')) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (msg.includes('PGRST') || msg.includes('42')) {
    return 'A database error occurred. Please try again.'
  }
  if (msg.length > 200) {
    return 'Something went wrong. Please try again.'
  }

  return msg
}
