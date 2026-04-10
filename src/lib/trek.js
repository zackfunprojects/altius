import { supabase } from './supabase'
import { awardElevation, getElevationDelta } from './elevation'
import { getExpeditionDay } from './expedition'

const VALID_TRANSITIONS = {
  proposed: ['active', 'abandoned'],
  active: ['paused', 'completed', 'abandoned'],
  paused: ['active', 'abandoned'],
  completed: [],
  abandoned: [],
}

function assertTransition(currentStatus, targetStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new Error(`Cannot transition trek from '${currentStatus}' to '${targetStatus}'`)
  }
}

/**
 * Creates a new trek with status 'proposed'.
 * The trek still needs AI-generated fields (trek_name, camps, etc.) before activation.
 */
export async function createTrek({ userId, skillDescription }) {
  const { data, error } = await supabase
    .from('treks')
    .insert({
      user_id: userId,
      skill_description: skillDescription,
      trek_name: 'Untitled Trek',
      difficulty: 'weekend_trek',
      status: 'proposed',
      summit_challenge: {},
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Activates a proposed trek - sets status to 'active', unlocks base camp.
 * Enforces free tier limit of 1 active trek.
 */
export async function activateTrek(trekId) {
  // Fetch trek to validate status transition
  const { data: trek, error: fetchError } = await supabase
    .from('treks')
    .select('status, user_id, trek_name, difficulty')
    .eq('id', trekId)
    .single()

  if (fetchError) throw fetchError
  assertTransition(trek.status, 'active')

  // Check free tier limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', trek.user_id)
    .single()

  if (profile?.subscription_tier !== 'pro') {
    const activeCount = await getActiveTrekCount(trek.user_id)
    if (activeCount >= 1) {
      throw new Error('Free tier is limited to 1 active trek. Complete or abandon your current trek first.')
    }
  }

  const { error: trekError } = await supabase
    .from('treks')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', trekId)

  if (trekError) throw trekError

  // Unlock base camp (camp_number = 0)
  const { error: campError } = await supabase
    .from('camps')
    .update({ status: 'active' })
    .eq('trek_id', trekId)
    .eq('camp_number', 0)

  if (campError) throw campError

  // Unlock first section of base camp
  const { data: baseCamp } = await supabase
    .from('camps')
    .select('id')
    .eq('trek_id', trekId)
    .eq('camp_number', 0)
    .single()

  if (baseCamp) {
    const { error: sectionError } = await supabase
      .from('trail_sections')
      .update({ status: 'active' })
      .eq('camp_id', baseCamp.id)
      .eq('section_number', 1)

    if (sectionError) throw sectionError
  }

  // Fire expedition event
  await fireLifecycleEvent(trek.user_id, trekId, 'trek_started',
    `Trek activated: ${trek.trek_name}`,
    `Beginning a ${trek.difficulty} trek.`
  )
}

/**
 * Pauses an active trek.
 */
export async function pauseTrek(trekId) {
  const { data: trek, error: fetchError } = await supabase
    .from('treks')
    .select('status, user_id')
    .eq('id', trekId)
    .single()

  if (fetchError) throw fetchError
  assertTransition(trek.status, 'paused')

  const { error } = await supabase
    .from('treks')
    .update({ status: 'paused' })
    .eq('id', trekId)

  if (error) throw error
}

/**
 * Resumes a paused trek.
 */
export async function resumeTrek(trekId) {
  const { data: trek, error: fetchError } = await supabase
    .from('treks')
    .select('status, user_id')
    .eq('id', trekId)
    .single()

  if (fetchError) throw fetchError
  assertTransition(trek.status, 'active')

  const { error } = await supabase
    .from('treks')
    .update({ status: 'active' })
    .eq('id', trekId)

  if (error) throw error
}

/**
 * Completes a trek - updates status, creates notebook entry, awards summit elevation.
 * Uses an RPC for atomicity when available, falls back to sequential writes.
 * Idempotent - checks trek status before proceeding.
 */
export async function completeTrek(trekId) {
  const { data: trek, error: trekFetchError } = await supabase
    .from('treks')
    .select('*')
    .eq('id', trekId)
    .single()

  if (trekFetchError) throw trekFetchError

  // Idempotency guard
  if (trek.status === 'completed') return
  assertTransition(trek.status, 'completed')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', trek.user_id)
    .single()

  if (profileError) throw profileError

  const expeditionDay = getExpeditionDay(profile.created_at)

  const { data: camps } = await supabase
    .from('camps')
    .select('learning_objectives')
    .eq('trek_id', trekId)
    .order('camp_number')

  const keyConcepts = (camps || []).flatMap(
    (c) => Array.isArray(c.learning_objectives) ? c.learning_objectives : []
  )

  // Try atomic RPC first
  const { error: rpcError } = await supabase.rpc('complete_trek', {
    p_trek_id: trekId,
    p_user_id: trek.user_id,
    p_skill_name: trek.skill_description,
    p_skill_badge: trek.skill_badge || { icon: 'default', label: trek.trek_name, color: '#1A3D7C' },
    p_summit_date: expeditionDay,
    p_summit_entry: trek.summit_entry || 'Summit reached.',
    p_key_concepts: keyConcepts,
    p_summit_deliverable_url: trek.summit_deliverable_url || null,
    p_difficulty: trek.difficulty,
  })

  if (!rpcError) {
    // Fire event after successful RPC
    await fireLifecycleEvent(trek.user_id, trekId, 'summit_completed',
      `Summit reached: ${trek.trek_name}`,
      trek.summit_entry || 'The summit is yours.'
    )
    return
  }

  // Fallback: sequential writes
  const { error: updateError } = await supabase
    .from('treks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', trekId)
    .eq('status', 'active')

  if (updateError) throw updateError

  const { error: notebookError } = await supabase.from('trek_notebook').insert({
    user_id: trek.user_id,
    trek_id: trekId,
    skill_name: trek.skill_description,
    skill_badge: trek.skill_badge || { icon: 'default', label: trek.trek_name, color: '#1A3D7C' },
    summit_date: expeditionDay,
    summit_entry: trek.summit_entry || 'Summit reached.',
    key_concepts: keyConcepts,
    summit_deliverable_url: trek.summit_deliverable_url,
  })

  if (notebookError) throw notebookError

  // Increment total_treks_completed via RPC (atomic)
  const { error: incrError } = await supabase.rpc('increment_treks_completed', {
    p_user_id: trek.user_id,
  })

  if (incrError) {
    // Last resort fallback - direct update (not atomic but functional)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('total_treks_completed')
      .eq('id', trek.user_id)
      .single()

    if (currentProfile) {
      await supabase
        .from('profiles')
        .update({ total_treks_completed: currentProfile.total_treks_completed + 1 })
        .eq('id', trek.user_id)
    }
  }

  const delta = getElevationDelta('summit_completed', { difficulty: trek.difficulty })
  await awardElevation({
    userId: trek.user_id,
    delta,
    sourceType: 'summit_completed',
    sourceId: trekId,
    trekId,
  })

  await fireLifecycleEvent(trek.user_id, trekId, 'summit_completed',
    `Summit reached: ${trek.trek_name}`,
    trek.summit_entry || 'The summit is yours.'
  )
}

/**
 * Abandons a trek. No penalty.
 */
export async function abandonTrek(trekId) {
  const { data: trek, error: fetchError } = await supabase
    .from('treks')
    .select('status, user_id')
    .eq('id', trekId)
    .single()

  if (fetchError) throw fetchError
  assertTransition(trek.status, 'abandoned')

  const { error } = await supabase
    .from('treks')
    .update({ status: 'abandoned' })
    .eq('id', trekId)

  if (error) throw error
}

/**
 * Returns the count of active treks for a user. Free tier is limited to 1.
 */
export async function getActiveTrekCount(userId) {
  const { count, error } = await supabase
    .from('treks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) throw error
  return count
}

/**
 * Unlocks the next camp in the trek sequence.
 * Distinguishes between "no next camp" (returns null) and actual errors (throws).
 */
export async function unlockNextCamp(trekId, currentCampNumber) {
  const nextCampNumber = currentCampNumber + 1

  const { data: nextCamp, error: fetchError } = await supabase
    .from('camps')
    .select('id')
    .eq('trek_id', trekId)
    .eq('camp_number', nextCampNumber)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!nextCamp) return null

  const { error: updateError } = await supabase
    .from('camps')
    .update({ status: 'active' })
    .eq('id', nextCamp.id)

  if (updateError) throw updateError

  const { error: sectionError } = await supabase
    .from('trail_sections')
    .update({ status: 'active' })
    .eq('camp_id', nextCamp.id)
    .eq('section_number', 1)

  if (sectionError) throw sectionError

  return nextCamp.id
}

/**
 * Completes a trail section. Awards elevation and checks if camp is complete.
 * Idempotent - skips if section is already completed.
 */
export async function completeSection(sectionId) {
  const { data: section, error: sectionError } = await supabase
    .from('trail_sections')
    .select('id, camp_id, trek_id, user_id, section_number, status')
    .eq('id', sectionId)
    .single()

  if (sectionError) throw sectionError
  if (section.status === 'completed') return

  const { data: updated, error: updateError } = await supabase
    .from('trail_sections')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sectionId)
    .neq('status', 'completed')
    .select('id')

  if (updateError) throw updateError
  if (!updated || updated.length === 0) return // Already completed by concurrent call

  await awardElevation({
    userId: section.user_id,
    delta: getElevationDelta('lesson_completed'),
    sourceType: 'lesson_completed',
    sourceId: sectionId,
    trekId: section.trek_id,
  })

  // Unlock next section in this camp
  const { data: nextSection } = await supabase
    .from('trail_sections')
    .select('id')
    .eq('camp_id', section.camp_id)
    .eq('section_number', section.section_number + 1)
    .maybeSingle()

  if (nextSection) {
    await supabase
      .from('trail_sections')
      .update({ status: 'active' })
      .eq('id', nextSection.id)
      .eq('status', 'locked')
  }

  await checkCampComplete(section.camp_id)
}

/**
 * Checks if all sections in a camp are completed.
 * If so, marks camp complete, awards camp elevation, and unlocks next camp.
 * Idempotent - checks camp status before proceeding.
 */
export async function checkCampComplete(campId) {
  const { data: camp, error: campFetchError } = await supabase
    .from('camps')
    .select('id, trek_id, user_id, camp_number, status')
    .eq('id', campId)
    .single()

  if (campFetchError) throw campFetchError
  if (camp.status === 'completed') return false

  const { count: totalSections } = await supabase
    .from('trail_sections')
    .select('id', { count: 'exact', head: true })
    .eq('camp_id', campId)

  const { count: completedSections } = await supabase
    .from('trail_sections')
    .select('id', { count: 'exact', head: true })
    .eq('camp_id', campId)
    .eq('status', 'completed')

  if (completedSections < totalSections) return false

  const { data: updated, error: updateError } = await supabase
    .from('camps')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', campId)
    .neq('status', 'completed')
    .select('id')

  if (updateError) throw updateError
  if (!updated || updated.length === 0) return false

  // Increment completed_camps via RPC
  const { error: incrError } = await supabase.rpc('increment_completed_camps', {
    p_trek_id: camp.trek_id,
  })

  if (incrError) {
    // Fallback: direct read + update
    const { data: currentTrek } = await supabase
      .from('treks')
      .select('completed_camps')
      .eq('id', camp.trek_id)
      .single()

    if (currentTrek) {
      await supabase
        .from('treks')
        .update({ completed_camps: (currentTrek.completed_camps || 0) + 1 })
        .eq('id', camp.trek_id)
    }
  }

  await awardElevation({
    userId: camp.user_id,
    delta: getElevationDelta('camp_reached'),
    sourceType: 'camp_reached',
    sourceId: campId,
    trekId: camp.trek_id,
  })

  // Fire camp_reached event
  await fireLifecycleEvent(camp.user_id, camp.trek_id, 'camp_reached',
    `Camp reached`,
    `Camp ${camp.camp_number} complete.`
  )

  await unlockNextCamp(camp.trek_id, camp.camp_number)

  return true
}

/**
 * Fires an expedition event for trek lifecycle changes.
 */
async function fireLifecycleEvent(userId, trekId, eventType, title, body) {
  await supabase.from('expedition_events').insert({
    user_id: userId,
    trek_id: trekId,
    event_type: eventType,
    title,
    body,
  }).then(({ error }) => {
    if (error) console.warn('Failed to fire expedition event:', error.message)
  })
}
