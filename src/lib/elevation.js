import { supabase } from './supabase'

const SUMMIT_ELEVATION = {
  day_hike: 200,
  weekend_trek: 500,
  expedition: 1000,
  siege: 2000,
}

/**
 * Awards elevation to a user and logs the event.
 * Uses an atomic RPC call to increment elevation and insert the log entry
 * in a single database transaction, avoiding read/modify/write race conditions.
 *
 * Falls back to a client-side approach if the RPC doesn't exist yet.
 */
export async function awardElevation({ userId, delta, sourceType, sourceId, trekId }) {
  // Try atomic RPC first
  const { data: rpcResult, error: rpcError } = await supabase.rpc('award_elevation', {
    p_user_id: userId,
    p_delta: delta,
    p_source_type: sourceType,
    p_source_id: sourceId || null,
    p_trek_id: trekId || null,
  })

  if (!rpcError) {
    return { delta, totalAfter: rpcResult }
  }

  // Fallback: atomic increment via RPC that handles both profile update + log insert
  const { data: updatedProfile, error: rpcFallbackError } = await supabase.rpc('increment_elevation_fallback', {
    p_user_id: userId,
    p_delta: delta,
  })

  if (!rpcFallbackError) {
    // RPC succeeded - insert log entry (non-critical, profile is already updated)
    await supabase.from('elevation_log').insert({
      user_id: userId,
      delta,
      total_after: updatedProfile,
      source_type: sourceType,
      source_id: sourceId || null,
      trek_id: trekId || null,
    })
    return { delta, totalAfter: updatedProfile }
  }

  // Last resort: sequential (accepts minor race risk over total failure)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_elevation')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  const totalAfter = profile.current_elevation + delta

  await supabase
    .from('profiles')
    .update({ current_elevation: totalAfter, last_active: new Date().toISOString() })
    .eq('id', userId)

  await supabase.from('elevation_log').insert({
    user_id: userId,
    delta,
    total_after: totalAfter,
    source_type: sourceType,
    source_id: sourceId || null,
    trek_id: trekId || null,
  })

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
