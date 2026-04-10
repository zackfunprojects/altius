/**
 * Returns the expedition day number (integer) since account creation.
 * Day 1 is the day the profile was created.
 */
export function getExpeditionDay(profileCreatedAt) {
  const created = new Date(profileCreatedAt)
  const now = new Date()

  // Zero out time components for clean day calculation
  const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate())
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const msPerDay = 1000 * 60 * 60 * 24
  const daysSince = Math.floor((nowDate - createdDate) / msPerDay)

  return daysSince + 1 // Day 1 is creation day
}
