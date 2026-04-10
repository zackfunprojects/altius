import { useState, useCallback } from 'react'
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

  // Step 1 -> Step 2: fetch interview questions
  const handleSkillSubmit = useCallback(async () => {
    if (!skillDescription.trim()) return

    setInterviewError(null)
    setInterviewLoading(true)
    setStep(2)

    try {
      const result = await interviewForSkill(skillDescription.trim())
      setQuestions(result || [])
    } catch (err) {
      setInterviewError(err.message || 'Failed to generate questions')
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

    // Start generation and minimum timer in parallel
    const generationPromise = generateTrek({
      skillDescription: skillDescription.trim(),
      prerequisiteAnswers,
      userId: user.id,
      userContext: null, // First trek, no prior context
    })

    const timerPromise = new Promise((resolve) =>
      setTimeout(resolve, MIN_GENERATION_MS)
    )

    // Advance generation lines on a timer
    const lineTimer = setInterval(() => {
      setGenerationLineIndex((prev) => {
        if (prev < GENERATION_LINES.length - 1) return prev + 1
        clearInterval(lineTimer)
        return prev
      })
    }, 1200)

    try {
      const [result] = await Promise.all([generationPromise, timerPromise])
      clearInterval(lineTimer)
      setProposal(result)
      setGenerationPhase('proposal')
    } catch (err) {
      clearInterval(lineTimer)
      setGenerateError(err.message || 'Failed to generate trek')
      setGenerationPhase(null)
    }
  }, [questions, answers, skillDescription, user])

  // Activate the trek and complete onboarding
  const handleBeginTrek = useCallback(async () => {
    if (!proposal?.trek_id) return

    setActivating(true)
    try {
      await activateTrek(proposal.trek_id)

      // Save expedition_origin to profile (marks onboarding as complete)
      await updateProfile({
        expedition_origin: expeditionOrigin.trim() || skillDescription.trim(),
      })

      navigate('/', { replace: true })
    } catch (err) {
      setGenerateError(err.message || 'Failed to activate trek')
      setActivating(false)
    }
  }, [proposal, expeditionOrigin, skillDescription, updateProfile, navigate])

  return (
    <div className="min-h-screen bg-terminal-dark flex flex-col crt-scanlines crt-vignette">
      {/* Step indicator */}
      <div className="px-6 pt-6">
        <p className="font-mono text-trail-brown/50 text-xs">
          {step} / 3
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl">
          {/* Step 1: Arrival */}
          {step === 1 && (
            <div className="space-y-6">
              <SherpaTerminal>
                <TypewriterText
                  text="I have been expecting someone. What skill are you here to learn? Tell me what you want to be able to do that you cannot do today."
                  speed={25}
                />
              </SherpaTerminal>

              <div className="space-y-4">
                <textarea
                  value={skillDescription}
                  onChange={(e) => setSkillDescription(e.target.value)}
                  placeholder="Make SaaS launch videos... Learn Python... Master negotiation..."
                  className="w-full h-24 px-4 py-3 bg-terminal-dark/80 border border-trail-brown/30 rounded-md font-body text-catalog-cream placeholder-trail-brown/40 focus:outline-none focus:ring-1 focus:ring-phosphor-green/50 resize-none"
                />

                <textarea
                  value={expeditionOrigin}
                  onChange={(e) => setExpeditionOrigin(e.target.value)}
                  placeholder="Why does this matter to you? (optional)"
                  className="w-full h-16 px-4 py-3 bg-terminal-dark/80 border border-trail-brown/20 rounded-md font-body text-sm text-catalog-cream placeholder-trail-brown/30 focus:outline-none focus:ring-1 focus:ring-phosphor-green/50 resize-none"
                />

                <button
                  onClick={handleSkillSubmit}
                  disabled={!skillDescription.trim()}
                  className="w-full py-3 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Prerequisite Interview */}
          {step === 2 && (
            <div className="space-y-6">
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
                    <p className="text-signal-orange">
                      The trail is obscured. {interviewError}
                    </p>
                  </SherpaTerminal>
                  <button
                    onClick={() => { setStep(1); setInterviewError(null) }}
                    className="text-sm font-ui text-trail-brown/60 hover:text-catalog-cream transition-colors"
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
                      <div className="bg-terminal-dark/60 rounded px-4 py-3 border-l-2 border-summit-cobalt">
                        <p className="font-mono text-phosphor-green/80 text-sm">
                          {q.question}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={answers[i] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                        }
                        placeholder="Your answer..."
                        className="w-full px-4 py-2.5 bg-terminal-dark/80 border border-trail-brown/30 rounded-md font-body text-catalog-cream placeholder-trail-brown/40 focus:outline-none focus:ring-1 focus:ring-phosphor-green/50"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleInterviewSubmit}
                    className="w-full py-3 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors"
                  >
                    Map the Trail
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Trek Generation */}
          {step === 3 && (
            <div className="space-y-6">
              {generationPhase === 'generating' && (
                <SherpaTerminal>
                  <div className="space-y-2">
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
                    <p className="text-signal-orange">
                      The weather turned. {generateError}
                    </p>
                  </SherpaTerminal>
                  <button
                    onClick={() => {
                      setStep(2)
                      setGenerateError(null)
                      setGenerationPhase(null)
                    }}
                    className="text-sm font-ui text-trail-brown/60 hover:text-catalog-cream transition-colors"
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
