/**
 * Returns the expedition day number (integer) since account creation.
 * Day 1 is the day the profile was created. Uses UTC to avoid timezone drift.
 * Returns 1 if the input is invalid.
 */
export function getExpeditionDay(profileCreatedAt) {
  if (!profileCreatedAt) return 1

  const created = new Date(profileCreatedAt)
  if (isNaN(created.getTime())) return 1

  const now = new Date()

  const createdDate = Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate())
  const nowDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  const msPerDay = 1000 * 60 * 60 * 24
  const daysSince = Math.floor((nowDate - createdDate) / msPerDay)

  return Math.max(1, daysSince + 1)
}
