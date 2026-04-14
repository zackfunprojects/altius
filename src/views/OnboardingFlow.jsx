import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { interviewForSkill, generateTrek } from '../lib/sherpa'
import { activateTrek } from '../lib/trek'
import { createCheckoutSession } from '../lib/stripe'
import TypewriterText from '../components/ui/TypewriterText'
import TrekProposal from '../components/trek/TrekProposal'
import FourColorBar from '../components/brand/FourColorBar'
import MountainMark from '../components/brand/MountainMark'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import PageTitle from '../components/ui/PageTitle'

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
  const [generationPhase, setGenerationPhase] = useState(null)
  const [generationLineIndex, setGenerationLineIndex] = useState(0)
  const [proposal, setProposal] = useState(null)
  const [generateError, setGenerateError] = useState(null)
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState(null)

  useEffect(() => {
    return () => {
      if (lineTimerRef.current) clearInterval(lineTimerRef.current)
    }
  }, [])

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

  const handleBeginTrek = useCallback(async () => {
    if (!proposal?.trek_id) return
    setActivating(true)
    setActivateError(null)
    try {
      await activateTrek(proposal.trek_id)
      try {
        await updateProfile({
          expedition_origin: expeditionOrigin.trim() || skillDescription.trim(),
        })
      } catch {
        // Profile update is non-critical
      }
      window.location.href = '/'
    } catch (err) {
      setActivateError(err.message || 'Could not start the trek. Please try again.')
      setActivating(false)
    }
  }, [proposal, expeditionOrigin, skillDescription, updateProfile])

  return (
    <div className="min-h-screen bg-terminal-dark flex flex-col crt-scanlines crt-vignette">
      <PageTitle title="Onboarding" />
      <FourColorBar />

      {/* Step indicator + sign out */}
      <div className="px-4 sm:px-6 pt-6 flex items-center justify-between" role="status" aria-live="polite">
        <p className="font-mono text-phosphor-green/50 text-xs" aria-label={`Step ${step} of 3`}>
          {step} / 3
        </p>
        <button
          onClick={async () => { await signOut(); navigate('/auth') }}
          className="font-mono text-phosphor-green/40 text-xs hover:text-phosphor-green transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[560px]">

          {/* Mountain Mark above terminal */}
          <div className="flex justify-center mb-6">
            <div style={{ filter: 'drop-shadow(0 0 12px rgba(212,150,11,0.3))' }}>
              <MountainMark size="md" />
            </div>
          </div>

          {/* Step 1: Arrival */}
          {step === 1 && (
            <div className="space-y-6" role="form" aria-label="Tell the Sherpa what you want to learn">
              <SherpaTerminal>
                <TypewriterText
                  text="I am the Sherpa - your guide on this mountain. Tell me what you want to learn, and I will build you a personalized path to get there. Each path has camps (milestones) with sections (lessons). Complete them all to reach the summit. So - what skill are you here for?"
                  speed={20}
                />
              </SherpaTerminal>

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
                    className="w-full h-24 px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-phosphor-green/20 rounded-md font-mono text-sm text-catalog-cream placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/50 resize-none"
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
                    className="w-full h-16 px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-phosphor-green/20 rounded-md font-mono text-sm text-catalog-cream placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleSkillSubmit}
                  disabled={!skillDescription.trim()}
                  className="w-full py-3 bg-summit-cobalt text-catalog-cream font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                <SherpaTerminal>
                  <TypewriterText
                    text="The Sherpa is considering your path..."
                    speed={30}
                  />
                </SherpaTerminal>
              )}

              {interviewError && (
                <div className="space-y-4">
                  <SherpaTerminal>
                    <span className="text-signal-orange not-italic">{interviewError}</span>
                  </SherpaTerminal>
                  <button
                    onClick={() => { setStep(1); setInterviewError(null) }}
                    className="font-mono text-sm text-phosphor-green/50 hover:text-phosphor-green transition-colors"
                  >
                    Go back
                  </button>
                </div>
              )}

              {!interviewLoading && !interviewError && questions.length > 0 && (
                <div className="space-y-6">
                  <SherpaTerminal>
                    <TypewriterText
                      text="Before I map the trail, I need to know what you are already carrying."
                      speed={25}
                    />
                  </SherpaTerminal>

                  <p className="font-mono text-phosphor-green/40 text-xs text-center">
                    These questions help customize your trek. Answer honestly.
                  </p>

                  {questions.map((q, i) => (
                    <div key={i} className="space-y-2">
                      <label
                        htmlFor={`answer-${i}`}
                        className="block font-mono text-catalog-cream/80 text-sm"
                      >
                        {q.question}
                      </label>
                      <input
                        id={`answer-${i}`}
                        type="text"
                        value={answers[i] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                        }
                        placeholder="Your answer..."
                        className="w-full px-4 py-2.5 bg-[rgba(255,255,255,0.05)] border border-phosphor-green/20 rounded-md font-mono text-sm text-catalog-cream placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/50"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleInterviewSubmit}
                    className="w-full py-3 bg-summit-cobalt text-catalog-cream font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors"
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
                  <SherpaTerminal className="w-full">
                    {GENERATION_MESSAGES.slice(0, generationLineIndex + 1).map((msg, i) => (
                      <span key={i} className="block">
                        {'> '}{msg}
                      </span>
                    ))}
                  </SherpaTerminal>
                </div>
              )}

              {generationPhase === 'proposal' && proposal && (
                <div className="space-y-4">
                  <SherpaTerminal>
                    The trail is mapped. Here is your expedition.
                  </SherpaTerminal>

                  {activateError && (
                    <SherpaTerminal>
                      <span className="text-signal-orange not-italic">{activateError}</span>
                    </SherpaTerminal>
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
                  <SherpaTerminal>
                    <span className="text-signal-orange not-italic">
                      The weather turned. Please try again.
                    </span>
                  </SherpaTerminal>
                  <button
                    onClick={() => {
                      setStep(2)
                      setGenerateError(null)
                      setGenerationPhase(null)
                    }}
                    className="font-mono text-sm text-phosphor-green/50 hover:text-phosphor-green transition-colors"
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
