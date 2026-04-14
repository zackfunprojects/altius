import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { interviewForSkill, generateTrek } from '../lib/sherpa'
import { activateTrek } from '../lib/trek'
import { createCheckoutSession } from '../lib/stripe'
import TypewriterText from '../components/ui/TypewriterText'
import TrekProposal from '../components/trek/TrekProposal'
import PageTitle from '../components/ui/PageTitle'

function SherpaSpeech({ children }) {
  return (
    <div className="bg-white rounded-lg border border-summit-cobalt/15 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-summit-cobalt text-lg leading-none mt-0.5">&#9650;</span>
        <div className="font-body text-ink text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

const GENERATION_MESSAGES = [
  'Reading the terrain...',
  'Mapping the camps...',
  'Choosing the best route...',
  'Scouting the trail ahead...',
  'Setting the pace...',
  'Almost there...',
]

const MIN_GENERATION_MS = 4000

export default function OnboardingFlow() {
  const { user, signOut } = useAuth()
  const { profile, updateProfile } = useProfile()
  const navigate = useNavigate()
  const lineTimerRef = useRef(null)

  const [step, setStep] = useState(1)

  // Step 1 state
  const [skillDescription, setSkillDescription] = useState('')
  const [expeditionOrigin, setExpeditionOrigin] = useState('')

  // Step 2 state
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewError, setInterviewError] = useState(null)

  // Step 3 state
  const [generationPhase, setGenerationPhase] = useState(null) // 'generating' | 'proposal'
  const [generationLineIndex, setGenerationLineIndex] = useState(0)
  const [proposal, setProposal] = useState(null)
  const [generateError, setGenerateError] = useState(null)
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState(null)

  // Cleanup line timer on unmount
  useEffect(() => {
    return () => {
      if (lineTimerRef.current) clearInterval(lineTimerRef.current)
    }
  }, [])

  // Step 1 -> Step 2: fetch interview questions
  const handleSkillSubmit = useCallback(async () => {
    if (!skillDescription.trim()) return

    setInterviewError(null)
    setInterviewLoading(true)
    setStep(2)

    try {
      const result = await interviewForSkill(skillDescription.trim())
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('No questions received. Please try again.')
      }
      setQuestions(result)
    } catch (err) {
      setInterviewError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setInterviewLoading(false)
    }
  }, [skillDescription])

  // Step 2 -> Step 3: generate the trek
  const handleInterviewSubmit = useCallback(async () => {
    setGenerateError(null)
    setStep(3)
    setGenerationPhase('generating')
    setGenerationLineIndex(0)

    const prerequisiteAnswers = questions.map((q, i) => ({
      question: q.question,
      answer: answers[i] || '',
    }))

    const generationPromise = generateTrek({
      skillDescription: skillDescription.trim(),
      prerequisiteAnswers,
      userId: user.id,
      userContext: null,
    })

    const timerPromise = new Promise((resolve) =>
      setTimeout(resolve, MIN_GENERATION_MS)
    )

    // Advance generation lines on a timer (stored in ref for cleanup)
    lineTimerRef.current = setInterval(() => {
      setGenerationLineIndex((prev) => {
        if (prev < GENERATION_MESSAGES.length - 1) return prev + 1
        if (lineTimerRef.current) clearInterval(lineTimerRef.current)
        lineTimerRef.current = null
        return prev
      })
    }, 1200)

    try {
      const [result] = await Promise.all([generationPromise, timerPromise])
      if (lineTimerRef.current) {
        clearInterval(lineTimerRef.current)
        lineTimerRef.current = null
      }
      setProposal(result)
      setGenerationPhase('proposal')
    } catch (err) {
      if (lineTimerRef.current) {
        clearInterval(lineTimerRef.current)
        lineTimerRef.current = null
      }
      setGenerateError(err.message || 'Something went wrong. Please try again.')
      setGenerationPhase(null)
    }
  }, [questions, answers, skillDescription, user])

  // Activate the trek and complete onboarding
  const handleBeginTrek = useCallback(async () => {
    if (!proposal?.trek_id) return

    setActivating(true)
    setActivateError(null)
    try {
      await activateTrek(proposal.trek_id)

      // Set expedition_origin (first-time onboarding only - returning users use NewTrekFlow)
      try {
        await updateProfile({
          expedition_origin: expeditionOrigin.trim() || skillDescription.trim(),
        })
      } catch {
        // Profile update is non-critical
      }

      // Use window.location for a clean navigation to avoid stale state
      window.location.href = '/'
    } catch (err) {
      setActivateError(err.message || 'Could not start the trek. Please try again.')
      setActivating(false)
    }
  }, [proposal, expeditionOrigin, skillDescription, updateProfile, navigate])

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <PageTitle title="Onboarding" />
      {/* Step indicator + sign out */}
      <div className="px-4 sm:px-6 pt-6 flex items-center justify-between" role="status" aria-live="polite">
        <p className="font-mono text-trail-brown text-xs" aria-label={`Step ${step} of 3`}>
          {step} / 3
        </p>
        <button
          onClick={async () => { await signOut(); navigate('/auth') }}
          className="font-mono text-trail-brown text-xs hover:text-ink transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-xl">
          {/* Step 1: Arrival */}
          {step === 1 && (
            <div className="space-y-6" role="form" aria-label="Tell the Sherpa what you want to learn">
              <SherpaSpeech>
                <TypewriterText
                  text="I am the Sherpa - your guide on this mountain. Tell me what you want to learn, and I will build you a personalized path to get there. Each path has camps (milestones) with sections (lessons). Complete them all to reach the summit. So - what skill are you here for?"
                  speed={20}
                />
              </SherpaSpeech>

              <div className="space-y-4">
                <div>
                  <label htmlFor="skill-input" className="sr-only">
                    What skill do you want to learn?
                  </label>
                  <textarea
                    id="skill-input"
                    value={skillDescription}
                    onChange={(e) => setSkillDescription(e.target.value)}
                    maxLength={500}
                    placeholder="Be specific: 'Learn to edit SaaS product videos' works better than 'Learn video'"
                    className="w-full h-24 px-4 py-3 bg-white border border-trail-brown/30 rounded-md font-body text-ink placeholder-trail-brown/50 focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50 resize-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="origin-input" className="sr-only">
                    Why does this matter to you?
                  </label>
                  <textarea
                    id="origin-input"
                    value={expeditionOrigin}
                    onChange={(e) => setExpeditionOrigin(e.target.value)}
                    maxLength={500}
                    placeholder="Why does this matter to you? (optional)"
                    className="w-full h-16 px-4 py-3 bg-white border border-trail-brown/30 rounded-md font-body text-sm text-ink placeholder-trail-brown/50 focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleSkillSubmit}
                  disabled={!skillDescription.trim()}
                  className="w-full py-3 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-signal-orange/50 focus:ring-offset-2 focus:ring-offset-terminal-dark"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Prerequisite Interview */}
          {step === 2 && (
            <div className="space-y-6" role="form" aria-label="Prerequisite interview">
              {interviewLoading && (
                <SherpaSpeech>
                  <TypewriterText
                    text="The Sherpa is considering your path..."
                    speed={30}
                  />
                </SherpaSpeech>
              )}

              {interviewError && (
                <div className="space-y-4">
                  <SherpaSpeech>
                    <p className="text-signal-orange" role="alert">
                      {interviewError}
                    </p>
                  </SherpaSpeech>
                  <button
                    onClick={() => { setStep(1); setInterviewError(null) }}
                    className="text-sm font-ui text-trail-brown hover:text-ink transition-colors focus:outline-none focus:underline"
                  >
                    Go back
                  </button>
                </div>
              )}

              {!interviewLoading && !interviewError && questions.length > 0 && (
                <div className="space-y-6">
                  <SherpaSpeech>
                    <TypewriterText
                      text="Before I map the trail, I need to know what you are already carrying."
                      speed={25}
                    />
                  </SherpaSpeech>

                  <p className="font-body text-sm text-trail-brown text-center">
                    These questions help customize your trek to your current level. Answer honestly - there are no wrong answers.
                  </p>

                  {questions.map((q, i) => (
                    <div key={i} className="space-y-2">
                      <label
                        htmlFor={`answer-${i}`}
                        className="block bg-white rounded px-4 py-3 border-l-2 border-summit-cobalt"
                      >
                        <span className="font-body text-ink text-sm">
                          {q.question}
                        </span>
                      </label>
                      <input
                        id={`answer-${i}`}
                        type="text"
                        value={answers[i] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                        }
                        placeholder="Your answer..."
                        className="w-full px-4 py-2.5 bg-white border border-trail-brown/30 rounded-md font-body text-ink placeholder-trail-brown/50 focus:outline-none focus:ring-2 focus:ring-summit-cobalt/50"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleInterviewSubmit}
                    className="w-full py-3 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors focus:outline-none focus:ring-2 focus:ring-signal-orange/50 focus:ring-offset-2 focus:ring-offset-terminal-dark"
                  >
                    Map the Trail
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Trek Generation */}
          {step === 3 && (
            <div className="space-y-6" aria-label="Trek generation">
              {generationPhase === 'generating' && (
                <div className="flex flex-col items-center py-12" role="status" aria-live="polite">
                  {/* Animated mountain building */}
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

                  {/* Cycling message */}
                  <p className="font-body text-ink text-base mb-2">
                    Building your trek
                  </p>
                  <p className="font-body text-trail-brown text-sm">
                    {GENERATION_MESSAGES[generationLineIndex % GENERATION_MESSAGES.length]}
                  </p>
                </div>
              )}

              {generationPhase === 'proposal' && proposal && (
                <div className="space-y-4">
                  <SherpaSpeech>
                    <p>
                      The trail is mapped. Here is your expedition.
                    </p>
                  </SherpaSpeech>

                  {activateError && (
                    <SherpaSpeech>
                      <p className="text-signal-orange" role="alert">{activateError}</p>
                    </SherpaSpeech>
                  )}

                  <TrekProposal
                    proposal={proposal}
                    onBegin={handleBeginTrek}
                    onUpgrade={async () => {
                      setActivateError(null)
                      try {
                        const url = await createCheckoutSession()
                        if (url) {
                          window.location.href = url
                        } else {
                          setActivateError('No checkout URL returned. Please try again.')
                        }
                      } catch (err) {
                        setActivateError(err.message || 'Could not start checkout. Please try again.')
                      }
                    }}
                    onRescope={() => {
                      // Re-generate with day_hike constraint
                      setGenerationPhase('generating')
                      setGenerationLineIndex(0)
                      setProposal(null)
                      setActivateError(null)
                      const prereqs = questions.map((q, i) => ({
                        question: q.question,
                        answer: answers[i] || '',
                      }))
                      generateTrek({
                        skillDescription: skillDescription.trim(),
                        prerequisiteAnswers: prereqs,
                        userId: user.id,
                        userContext: { difficulty_constraint: 'day_hike' },
                      }).then((result) => {
                        setProposal(result)
                        setGenerationPhase('proposal')
                      }).catch((err) => {
                        setGenerateError(err.message || 'Failed to re-scope.')
                        setGenerationPhase(null)
                      })
                    }}
                    loading={activating}
                    isFreeUser={profile?.subscription_tier !== 'pro'}
                  />
                </div>
              )}

              {generateError && (
                <div className="space-y-4">
                  <SherpaSpeech>
                    <p className="text-signal-orange" role="alert">
                      The weather turned. Please try again.
                    </p>
                  </SherpaSpeech>
                  <button
                    onClick={() => {
                      setStep(2)
                      setGenerateError(null)
                      setGenerationPhase(null)
                    }}
                    className="text-sm font-ui text-trail-brown hover:text-ink transition-colors focus:outline-none focus:underline"
                  >
                    Go back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
