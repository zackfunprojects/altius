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
 * @param {string} [params.mode] - 'section' (default) or 'general' for full chat
 * @returns {Promise<string>} Sherpa's response text
 */
export async function askSherpa({ message, sectionId, trekId, conversationHistory, mode }) {
  const { data, error } = await supabase.functions.invoke('sherpa', {
    body: {
      message,
      section_id: sectionId || null,
      trek_id: trekId || null,
      conversation_history: conversationHistory || [],
      mode: mode || 'section',
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data.response
}

/**
 * Calls the exercise-evaluate Edge Function to evaluate an exercise submission.
 *
 * @param {Object} params
 * @param {Object} params.exerciseSpec - The exercise specification (type, prompt, rubric, etc.)
 * @param {*} params.userResponse - The user's response to the exercise
 * @param {number} [params.attemptNumber] - Which attempt this is (1-based)
 * @param {number} [params.exerciseIndex] - Index of the exercise within the section
 * @param {string} params.sectionId - The trail section ID
 * @param {string} [params.trekId] - The trek ID
 * @returns {Promise<Object>} Evaluation result with passed, score, feedback, dimension_scores, hints_for_retry
 */
export async function evaluateExercise({ exerciseSpec, userResponse, attemptNumber, exerciseIndex, sectionId, trekId }) {
  const { data, error } = await supabase.functions.invoke('exercise-evaluate', {
    body: {
      exercise_spec: exerciseSpec,
      user_response: userResponse,
      attempt_number: attemptNumber || 1,
      exercise_index: exerciseIndex ?? 0,
      section_id: sectionId,
      trek_id: trekId || null,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/**
 * Calls the scenario-advance Edge Function to get the next NPC response
 * in a conversation simulator exercise.
 *
 * @param {Object} params
 * @param {Object} params.exerciseSpec - The scenario spec (npc_character, scenario, max_turns, etc.)
 * @param {Array} params.conversationHistory - Prior messages in the conversation
 * @param {string} params.userMessage - The user's latest message
 * @returns {Promise<Object>} { npc_response, turn_number, is_complete }
 */
export async function advanceScenario({ exerciseSpec, conversationHistory, userMessage }) {
  const { data, error } = await supabase.functions.invoke('scenario-advance', {
    body: {
      exercise_spec: exerciseSpec,
      conversation_history: conversationHistory || [],
      user_message: userMessage,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/**
 * Calls the morning-question Edge Function to generate a daily question.
 *
 * @param {Object} params
 * @param {string} params.trekId - The active trek ID
 * @returns {Promise<string>} The morning question text
 */
export async function getMorningQuestion({ trekId }) {
  const { data, error } = await supabase.functions.invoke('morning-question', {
    body: { trek_id: trekId },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data.question
}
