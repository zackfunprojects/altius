import { useState, useCallback, useRef, useEffect } from 'react'
import { interviewForSkill, generateTrek } from '../../lib/sherpa'
import { activateTrek } from '../../lib/trek'
import { createCheckoutSession } from '../../lib/stripe'
import { useAuth } from '../../context/AuthContext'
import TrekProposal from './TrekProposal'
import TypewriterText from '../ui/TypewriterText'

const GENERATION_MESSAGES = [
  'Reading the terrain...',
  'Mapping the camps...',
  'Choosing the best route...',
  'Scouting the trail ahead...',
  'Setting the pace...',
  'Almost there...',
]

/**
 * Inline trek creation flow for the dashboard.
 * Handles: skill input -> interview -> generation -> proposal -> activation.
 * Never navigates away from the dashboard.
 */
export default function NewTrekFlow({ onComplete, profile }) {
  const { user } = useAuth()
  const lineTimerRef = useRef(null)

  // Phase control
  const [phase, setPhase] = useState(null) // null | 'input' | 'interview' | 'generating' | 'proposal'

  // Step 1: skill input
  const [skill, setSkill] = useState('')

  // Step 2: interview
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewError, setInterviewError] = useState(null)

  // Step 3: generation + proposal
  const [generationLineIndex, setGenerationLineIndex] = useState(0)
  const [proposal, setProposal] = useState(null)
  const [generateError, setGenerateError] = useState(null)
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState(null)

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (lineTimerRef.current) clearInterval(lineTimerRef.current)
    }
  }, [])

  // Step 1 -> 2: get interview questions
  const handleSkillSubmit = useCallback(async () => {
    if (!skill.trim() || interviewLoading) return
    setInterviewError(null)
    setInterviewLoading(true)

    try {
      const result = await interviewForSkill(skill.trim())
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('No questions received.')
      }
      setQuestions(result)
      setPhase('interview')
    } catch (err) {
      setInterviewError(err.message || 'Something went wrong.')
    } finally {
      setInterviewLoading(false)
    }
  }, [skill, interviewLoading])

  // Step 2 -> 3: generate trek
  const handleGenerate = useCallback(async (userContext) => {
    setGenerateError(null)
    setPhase('generating')
    setGenerationLineIndex(0)

    const prereqs = questions.map((q, i) => ({
      question: q.question,
      answer: answers[i] || '',
    }))

    // Cycle loading messages
    lineTimerRef.current = setInterval(() => {
      setGenerationLineIndex(prev => {
        if (prev < GENERATION_MESSAGES.length - 1) return prev + 1
        if (lineTimerRef.current) clearInterval(lineTimerRef.current)
        return prev
      })
    }, 1200)

    try {
      const result = await generateTrek({
        skillDescription: skill.trim(),
        prerequisiteAnswers: prereqs,
        userId: user.id,
        userContext: userContext || null,
      })
      if (lineTimerRef.current) {
        clearInterval(lineTimerRef.current)
        lineTimerRef.current = null
      }
      setProposal(result)
      setPhase('proposal')
    } catch (err) {
      if (lineTimerRef.current) {
        clearInterval(lineTimerRef.current)
        lineTimerRef.current = null
      }
      setGenerateError(err.message || 'Trek generation failed.')
      setPhase('interview')
    }
  }, [questions, answers, skill, user])

  // Activate trek
  const handleBegin = useCallback(async () => {
    if (!proposal?.trek_id || activating) return
    setActivating(true)
    setActivateError(null)

    try {
      await activateTrek(proposal.trek_id)
      onComplete()
    } catch (err) {
      setActivateError(err.message || 'Could not start the trek.')
      setActivating(false)
    }
  }, [proposal, activating, onComplete])

  const isFreeUser = profile?.subscription_tier !== 'pro'

  // Phase: not started
  if (phase === null) {
    return (
      <div className="text-center space-y-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4">
            {profile?.total_treks_completed > 0 ? 'What will you learn next?' : 'Welcome, Climber'}
          </h1>
          <p className="font-body text-lg text-trail-brown">
            {profile?.total_treks_completed > 0
              ? 'Pick your next skill and the Sherpa will map the trail.'
              : 'Tell the Sherpa what you want to learn.'}
          </p>
        </div>
        <button
          onClick={() => setPhase('input')}
          className="w-full py-3 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors"
        >
          <span className="block">Start a New Trek</span>
          <span className="block text-xs font-normal text-white/60 mt-0.5">Tell the Sherpa what you want to learn</span>
        </button>
      </div>
    )
  }

  // Phase: skill input
  if (phase === 'input') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-2xl text-ink mb-2">What do you want to learn?</h2>
          <p className="font-body text-sm text-trail-brown">Be specific - "Learn to edit SaaS product videos" works better than "Learn video."</p>
        </div>

        <textarea
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="e.g., Master Figma for UI design"
          maxLength={500}
          className="w-full h-24 px-4 py-3 bg-white border border-trail-brown/30 rounded-lg font-body text-ink placeholder-trail-brown/50 focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50 resize-none"
          autoFocus
        />

        {interviewError && (
          <p className="text-sm font-ui text-signal-orange">{interviewError}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setPhase(null)}
            className="px-4 py-2.5 text-sm font-ui text-trail-brown border border-trail-brown/20 rounded-lg hover:bg-trail-brown/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSkillSubmit}
            disabled={!skill.trim() || interviewLoading}
            className="flex-1 py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
          >
            {interviewLoading ? 'Thinking...' : 'Continue'}
          </button>
        </div>
      </div>
    )
  }

  // Phase: interview questions
  if (phase === 'interview') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-2xl text-ink mb-2">A few questions first</h2>
          <p className="font-body text-sm text-trail-brown">
            These help customize your trek to your current level. No wrong answers.
          </p>
        </div>

        {generateError && (
          <p className="text-sm font-ui text-signal-orange">{generateError}</p>
        )}

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i}>
              <label className="block font-body text-sm text-ink mb-1.5">{q.question}</label>
              <input
                type="text"
                value={answers[i] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                placeholder="Your answer..."
                className="w-full px-4 py-2.5 bg-white border border-trail-brown/30 rounded-lg font-body text-sm text-ink placeholder-trail-brown/50 focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPhase('input')}
            className="px-4 py-2.5 text-sm font-ui text-trail-brown border border-trail-brown/20 rounded-lg hover:bg-trail-brown/5 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => handleGenerate()}
            className="flex-1 py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors"
          >
            Build my trek
          </button>
        </div>
      </div>
    )
  }

  // Phase: generating
  if (phase === 'generating') {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="relative w-24 h-24 mb-6">
          <svg viewBox="0 0 96 96" className="w-full h-full">
            <path
              d="M48 12L12 84H84L48 12Z"
              fill="none"
              stroke="#1A3D7C"
              strokeWidth="2"
              strokeDasharray="200"
              strokeDashoffset="200"
              className="animate-[draw_2s_ease-in-out_infinite]"
            />
            <path
              d="M32 56L44 40L52 48L64 32"
              fill="none"
              stroke="#D9511C"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
              strokeDasharray="80"
              strokeDashoffset="80"
              className="animate-[draw_2.5s_ease-in-out_0.5s_infinite]"
            />
          </svg>
        </div>
        <p className="font-body text-ink text-base mb-2">Building your trek</p>
        <p className="font-body text-trail-brown text-sm">
          {GENERATION_MESSAGES[generationLineIndex % GENERATION_MESSAGES.length]}
        </p>
      </div>
    )
  }

  // Phase: proposal
  if (phase === 'proposal' && proposal) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-summit-cobalt/15 p-4">
          <p className="font-body text-ink text-sm">
            <TypewriterText text="The trail is mapped. Here is your expedition." speed={20} />
          </p>
        </div>

        {activateError && (
          <div className="bg-white rounded-lg border border-signal-orange/20 p-4">
            <p className="font-ui text-sm text-signal-orange">{activateError}</p>
          </div>
        )}

        <TrekProposal
          proposal={proposal}
          onBegin={handleBegin}
          onUpgrade={async () => {
            try {
              const url = await createCheckoutSession()
              if (url) window.location.href = url
            } catch {
              setActivateError('Could not start checkout.')
            }
          }}
          onRescope={() => handleGenerate({ difficulty_constraint: 'day_hike' })}
          loading={activating}
          isFreeUser={isFreeUser}
        />

        <button
          onClick={() => { setPhase('input'); setProposal(null); setActivateError(null) }}
          className="w-full py-2 text-sm font-ui text-trail-brown hover:text-ink transition-colors"
        >
          Start over with a different skill
        </button>
      </div>
    )
  }

  return null
}
