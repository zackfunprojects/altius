import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { interviewForSkill, generateTrek } from '../lib/sherpa'
import { activateTrek } from '../lib/trek'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import TypewriterText from '../components/ui/TypewriterText'
import TrekProposal from '../components/trek/TrekProposal'

const GENERATION_LINES = [
  'The Sherpa is reading the terrain...',
  'Your trail is taking shape...',
  'This mountain has never been climbed quite like this before.',
]

const MIN_GENERATION_MS = 4000

export default function OnboardingFlow() {
  const { user } = useAuth()
  const { updateProfile } = useProfile()
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
        if (prev < GENERATION_LINES.length - 1) return prev + 1
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
    try {
      await activateTrek(proposal.trek_id)

      await updateProfile({
        expedition_origin: expeditionOrigin.trim() || skillDescription.trim(),
      })

      navigate('/', { replace: true })
    } catch (err) {
      setGenerateError(err.message || 'Something went wrong. Please try again.')
      setActivating(false)
    }
  }, [proposal, expeditionOrigin, skillDescription, updateProfile, navigate])

  return (
    <div className="min-h-screen bg-terminal-dark flex flex-col crt-scanlines crt-vignette">
      {/* Step indicator */}
      <div className="px-4 sm:px-6 pt-6" role="status" aria-live="polite">
        <p className="font-mono text-trail-brown/50 text-xs" aria-label={`Step ${step} of 3`}>
          {step} / 3
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-xl">
          {/* Step 1: Arrival */}
          {step === 1 && (
            <div className="space-y-6" role="form" aria-label="Tell the Sherpa what you want to learn">
              <SherpaTerminal>
                <TypewriterText
                  text="I have been expecting someone. What skill are you here to learn? Tell me what you want to be able to do that you cannot do today."
                  speed={25}
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
                    placeholder="Make SaaS launch videos... Learn Python... Master negotiation..."
                    className="w-full h-24 px-4 py-3 bg-terminal-dark/80 border border-trail-brown/30 rounded-md font-body text-catalog-cream placeholder-trail-brown/40 focus:outline-none focus:ring-2 focus:ring-phosphor-green/50 resize-none"
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
                    className="w-full h-16 px-4 py-3 bg-terminal-dark/80 border border-trail-brown/20 rounded-md font-body text-sm text-catalog-cream placeholder-trail-brown/30 focus:outline-none focus:ring-2 focus:ring-phosphor-green/50 resize-none"
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
                    <p className="text-signal-orange" role="alert">
                      The trail is obscured. Please try again.
                    </p>
                  </SherpaTerminal>
                  <button
                    onClick={() => { setStep(1); setInterviewError(null) }}
                    className="text-sm font-ui text-trail-brown/60 hover:text-catalog-cream transition-colors focus:outline-none focus:underline"
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

                  {questions.map((q, i) => (
                    <div key={i} className="space-y-2">
                      <label
                        htmlFor={`answer-${i}`}
                        className="block bg-terminal-dark/60 rounded px-4 py-3 border-l-2 border-summit-cobalt"
                      >
                        <span className="font-mono text-phosphor-green/80 text-sm">
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
                        className="w-full px-4 py-2.5 bg-terminal-dark/80 border border-trail-brown/30 rounded-md font-body text-catalog-cream placeholder-trail-brown/40 focus:outline-none focus:ring-2 focus:ring-phosphor-green/50"
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
                <SherpaTerminal>
                  <div className="space-y-2" role="status" aria-live="polite">
                    {GENERATION_LINES.slice(0, generationLineIndex + 1).map(
                      (line, i) => (
                        <div key={i}>
                          {i === generationLineIndex ? (
                            <TypewriterText text={line} speed={30} />
                          ) : (
                            <span className="text-phosphor-green/50">{line}</span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </SherpaTerminal>
              )}

              {generationPhase === 'proposal' && proposal && (
                <div className="space-y-4">
                  <SherpaTerminal>
                    <p>
                      The trail is mapped. Here is your expedition.
                    </p>
                  </SherpaTerminal>

                  <TrekProposal
                    proposal={proposal}
                    onBegin={handleBeginTrek}
                    loading={activating}
                  />
                </div>
              )}

              {generateError && (
                <div className="space-y-4">
                  <SherpaTerminal>
                    <p className="text-signal-orange" role="alert">
                      The weather turned. Please try again.
                    </p>
                  </SherpaTerminal>
                  <button
                    onClick={() => {
                      setStep(2)
                      setGenerateError(null)
                      setGenerationPhase(null)
                    }}
                    className="text-sm font-ui text-trail-brown/60 hover:text-catalog-cream transition-colors focus:outline-none focus:underline"
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
