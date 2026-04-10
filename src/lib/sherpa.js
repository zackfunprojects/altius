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

/**
 * Calls the lesson-generate Edge Function to create content for a trail section.
 *
 * @param {Object} params
 * @param {string} params.sectionId - The trail section ID
 * @returns {Promise<Object>} Lesson content JSONB with narrative array
 */
export async function generateLesson({ sectionId }) {
  const { data, error } = await supabase.functions.invoke('lesson-generate', {
    body: { section_id: sectionId },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/**
 * Calls the sherpa Edge Function for contextual chat during a lesson.
 *
 * @param {Object} params
 * @param {string} params.message - The user's question
 * @param {string} [params.sectionId] - Current section ID for context
 * @param {string} [params.trekId] - Current trek ID for context
 * @param {Array} [params.conversationHistory] - Prior messages in this conversation
 * @returns {Promise<string>} Sherpa's response text
 */
export async function askSherpa({ message, sectionId, trekId, conversationHistory }) {
  const { data, error } = await supabase.functions.invoke('sherpa', {
    body: {
      message,
      section_id: sectionId || null,
      trek_id: trekId || null,
      conversation_history: conversationHistory || [],
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data.response
}
