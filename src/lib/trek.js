import { supabase } from './supabase'
import { awardElevation, getElevationDelta } from './elevation'
import { getExpeditionDay } from './expedition'

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
      trek_name: 'Untitled Trek', // Placeholder until AI generates
      difficulty: 'weekend_trek', // Placeholder until AI generates
      status: 'proposed',
      summit_challenge: {},       // Placeholder until AI generates
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Activates a proposed trek - sets status to 'active', unlocks base camp.
 */
export async function activateTrek(trekId) {
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
    await supabase
      .from('trail_sections')
      .update({ status: 'active' })
      .eq('camp_id', baseCamp.id)
      .eq('section_number', 1)
  }
}

/**
 * Pauses an active trek.
 */
export async function pauseTrek(trekId) {
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
  const { error } = await supabase
    .from('treks')
    .update({ status: 'active' })
    .eq('id', trekId)

  if (error) throw error
}

/**
 * Completes a trek - updates status, creates notebook entry, awards summit elevation.
 */
export async function completeTrek(trekId) {
  // Fetch the trek to get difficulty, summit entry, etc.
  const { data: trek, error: trekFetchError } = await supabase
    .from('treks')
    .select('*, user_id, difficulty, trek_name, skill_description, summit_entry, skill_badge, summit_deliverable_url')
    .eq('id', trekId)
    .single()

  if (trekFetchError) throw trekFetchError

  // Fetch the user profile for expedition day
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('created_at, total_treks_completed')
    .eq('id', trek.user_id)
    .single()

  if (profileError) throw profileError

  const expeditionDay = getExpeditionDay(profile.created_at)

  // Update trek status
  const { error: updateError } = await supabase
    .from('treks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', trekId)

  if (updateError) throw updateError

  // Create trek_notebook entry
  // Extract key concepts from camps' learning_objectives
  const { data: camps } = await supabase
    .from('camps')
    .select('learning_objectives')
    .eq('trek_id', trekId)
    .order('camp_number')

  const keyConcepts = (camps || []).flatMap(
    (c) => c.learning_objectives || []
  )

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

  // Increment total_treks_completed on profile
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      total_treks_completed: profile.total_treks_completed + 1,
    })
    .eq('id', trek.user_id)

  if (profileUpdateError) throw profileUpdateError

  // Award summit elevation
  const delta = getElevationDelta('summit_completed', { difficulty: trek.difficulty })
  await awardElevation({
    userId: trek.user_id,
    delta,
    sourceType: 'summit_completed',
    sourceId: trekId,
    trekId,
  })
}

/**
 * Abandons a trek. No penalty.
 */
export async function abandonTrek(trekId) {
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
 */
export async function unlockNextCamp(trekId, currentCampNumber) {
  const nextCampNumber = currentCampNumber + 1

  // Check if next camp exists
  const { data: nextCamp, error: fetchError } = await supabase
    .from('camps')
    .select('id')
    .eq('trek_id', trekId)
    .eq('camp_number', nextCampNumber)
    .single()

  if (fetchError) {
    // No next camp - this was the last camp before summit
    return null
  }

  // Unlock the camp
  const { error: updateError } = await supabase
    .from('camps')
    .update({ status: 'active' })
    .eq('id', nextCamp.id)

  if (updateError) throw updateError

  // Unlock first section of the new camp
  await supabase
    .from('trail_sections')
    .update({ status: 'active' })
    .eq('camp_id', nextCamp.id)
    .eq('section_number', 1)

  return nextCamp.id
}

/**
 * Completes a trail section. Awards elevation and checks if camp is complete.
 */
export async function completeSection(sectionId) {
  // Fetch section details
  const { data: section, error: sectionError } = await supabase
    .from('trail_sections')
    .select('id, camp_id, trek_id, user_id, section_number')
    .eq('id', sectionId)
    .single()

  if (sectionError) throw sectionError

  // Mark section complete
  const { error: updateError } = await supabase
    .from('trail_sections')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sectionId)

  if (updateError) throw updateError

  // Award lesson_completed elevation
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
    .single()

  if (nextSection) {
    await supabase
      .from('trail_sections')
      .update({ status: 'active' })
      .eq('id', nextSection.id)
  }

  // Check if camp is now complete
  await checkCampComplete(section.camp_id)
}

/**
 * Checks if all sections in a camp are completed.
 * If so, marks camp complete, awards camp elevation, and unlocks next camp.
 */
export async function checkCampComplete(campId) {
  // Count total sections and completed sections
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

  // All sections complete - mark camp complete
  const { data: camp, error: campError } = await supabase
    .from('camps')
    .select('id, trek_id, user_id, camp_number')
    .eq('id', campId)
    .single()

  if (campError) throw campError

  const { error: updateError } = await supabase
    .from('camps')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', campId)

  if (updateError) throw updateError

  // Update trek completed_camps count
  const { data: trek } = await supabase
    .from('treks')
    .select('completed_camps')
    .eq('id', camp.trek_id)
    .single()

  await supabase
    .from('treks')
    .update({ completed_camps: (trek?.completed_camps || 0) + 1 })
    .eq('id', camp.trek_id)

  // Award camp_reached elevation
  await awardElevation({
    userId: camp.user_id,
    delta: getElevationDelta('camp_reached'),
    sourceType: 'camp_reached',
    sourceId: campId,
    trekId: camp.trek_id,
  })

  // Unlock next camp
  await unlockNextCamp(camp.trek_id, camp.camp_number)

  return true
}
