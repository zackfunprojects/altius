import { supabase } from './supabase'

/**
 * Calls the trek-interview Edge Function to generate prerequisite questions
 * for a given skill description.
 *
 * @param {string} skillDescription - What the user wants to learn
 * @returns {Promise<Array<{question: string, purpose: string}>>}
 */
export async function interviewForSkill(skillDescription) {
  const { data, error } = await supabase.functions.invoke('trek-interview', {
    body: { skill_description: skillDescription },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data.questions
}

/**
 * Calls the trek-generate Edge Function to create a complete trek structure.
 * The function creates trek, camp, and trail_section rows in the database.
 *
 * @param {Object} params
 * @param {string} params.skillDescription - What the user wants to learn
 * @param {Array<{question: string, answer: string}>} params.prerequisiteAnswers
 * @param {string} params.userId - The authenticated user's ID
 * @param {Object} [params.userContext] - Prior treks and notebook skills
 * @returns {Promise<Object>} Trek proposal data including trek_id
 */
export async function generateTrek({ skillDescription, prerequisiteAnswers, userId, userContext }) {
  const { data, error } = await supabase.functions.invoke('trek-generate', {
    body: {
      skill_description: skillDescription,
      prerequisite_answers: prerequisiteAnswers,
      user_id: userId,
      user_context: userContext || null,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}
