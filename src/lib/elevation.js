import { supabase } from './supabase'

const SUMMIT_ELEVATION = {
  day_hike: 200,
  weekend_trek: 500,
  expedition: 1000,
  siege: 2000,
}

/**
 * Awards elevation to a user and logs the event.
 * Inserts an elevation_log row and updates profiles.current_elevation + last_active.
 */
export async function awardElevation({ userId, delta, sourceType, sourceId, trekId }) {
  // Get current elevation
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_elevation')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  const totalAfter = profile.current_elevation + delta

  // Insert elevation log entry
  const { error: logError } = await supabase.from('elevation_log').insert({
    user_id: userId,
    delta,
    total_after: totalAfter,
    source_type: sourceType,
    source_id: sourceId || null,
    trek_id: trekId || null,
  })

  if (logError) throw logError

  // Update profile elevation and last_active
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      current_elevation: totalAfter,
      last_active: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) throw updateError

  return { delta, totalAfter }
}

/**
 * Returns the elevation delta for a given source type.
 * For exercise_passed, pass attemptNumber to determine first vs subsequent.
 * For summit_completed, pass difficulty.
 * For event_bonus, pass the delta directly.
 */
export function getElevationDelta(sourceType, { attemptNumber, difficulty, delta } = {}) {
  switch (sourceType) {
    case 'lesson_completed':
      return 10
    case 'exercise_passed':
      return attemptNumber === 1 ? 15 : 10
    case 'camp_reached':
      return 50
    case 'summit_completed':
      return SUMMIT_ELEVATION[difficulty] || 200
    case 'journal_note':
      return 2
    case 'event_bonus':
      return delta || 0
    default:
      return 0
  }
}
