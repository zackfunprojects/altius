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
/**
 * Calls the summit-evaluate Edge Function to evaluate a summit challenge submission.
 *
 * @param {Object} params
 * @param {string} params.trekId - The trek ID
 * @param {string} [params.deliverableUrl] - URL to the user's deliverable
 * @param {string} params.deliverableText - Description of what the user built
 * @returns {Promise<Object>} Evaluation with passed, overall_score, dimension_scores, summit_entry, retry_guidance
 */
export async function evaluateSummit({ trekId, deliverableUrl, deliverableText }) {
  const { data, error } = await supabase.functions.invoke('summit-evaluate', {
    body: {
      trek_id: trekId,
      deliverable_url: deliverableUrl || null,
      deliverable_text: deliverableText,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/**
 * Calls the screen-analyze Edge Function for Over-the-Shoulder coaching.
 *
 * @param {Object} params
 * @param {string} params.trekId - The trek ID
 * @param {string} params.screenshotBase64 - Base64 screenshot PNG
 * @param {string} [params.toolName] - Name of the tool being used
 * @param {string} [params.currentTask] - What the user is working on
 * @returns {Promise<Object>} { analysis, coaching_points, suggestion }
 */
export async function analyzeScreen({ trekId, screenshotBase64, toolName, currentTask }) {
  const { data, error } = await supabase.functions.invoke('screen-analyze', {
    body: {
      trek_id: trekId,
      screenshot_base64: screenshotBase64,
      tool_name: toolName || null,
      current_task: currentTask || null,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/**
 * Calls the sherpa-voice Edge Function for voice dialogue.
 *
 * @param {Object} params
 * @param {string} [params.trekId] - The trek ID
 * @param {string} [params.sectionId] - Current section ID
 * @param {string} params.audioBase64 - Base64 audio recording
 * @param {Array} [params.conversationHistory] - Prior messages
 * @returns {Promise<Object>} { transcript, response_text, audio_base64 }
 */
export async function voiceChat({ trekId, sectionId, audioBase64, conversationHistory, transcribeOnly }) {
  const { data, error } = await supabase.functions.invoke('sherpa-voice', {
    body: {
      trek_id: trekId || null,
      section_id: sectionId || null,
      audio_base64: audioBase64,
      conversation_history: conversationHistory || [],
      transcribe_only: transcribeOnly || false,
    },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

/**
 * Calls the skill-refresh Edge Function to generate review exercises.
 *
 * @param {Object} params
 * @param {string} params.notebookEntryId - The notebook entry ID
 * @returns {Promise<Object>} { exercises: Array }
 */
export async function refreshSkill({ notebookEntryId }) {
  const { data, error } = await supabase.functions.invoke('skill-refresh', {
    body: { notebook_entry_id: notebookEntryId },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

export async function getMorningQuestion({ trekId }) {
  const { data, error } = await supabase.functions.invoke('morning-question', {
    body: { trek_id: trekId },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data.question
}
