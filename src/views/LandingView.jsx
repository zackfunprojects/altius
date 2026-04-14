import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { getMorningQuestion } from '../lib/sherpa'
import { abandonTrek } from '../lib/trek'
import DifficultyBadge from '../components/brand/DifficultyBadge'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import MorningQuestion from '../components/MorningQuestion'
import NewTrekFlow from '../components/trek/NewTrekFlow'
import PageTitle from '../components/ui/PageTitle'

export default function LandingView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { trek, camps, loading: trekLoading, error: trekError, refetch: refetchTrek } = useActiveTrek()

  const [morningQuestion, setMorningQuestion] = useState(null)
  const [showMorningQuestion, setShowMorningQuestion] = useState(false)
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false)
  const [abandoning, setAbandoning] = useState(false)
  const [abandonError, setAbandonError] = useState(null)

  const handleAbandon = useCallback(async () => {
    if (!trek?.id || abandoning) return
    setAbandoning(true)
    setAbandonError(null)
    try {
      await abandonTrek(trek.id)
      window.location.reload()
    } catch (err) {
      setAbandonError(err.message || 'Failed to abandon trek. Please try again.')
      setAbandoning(false)
    }
  }, [trek, abandoning])

  // Check for morning question on mount
  useEffect(() => {
    if (!trek?.id || trekLoading) return

    const today = new Date().toLocaleDateString('en-CA')
    const lastDate = localStorage.getItem('altius_morning_q_date')
    if (lastDate === today) return

    let cancelled = false
    async function fetchQuestion() {
      try {
        const question = await getMorningQuestion({ trekId: trek.id })
        if (!cancelled && question) {
          setMorningQuestion(question)
          setShowMorningQuestion(true)
        }
      } catch {
        // Silently skip - don't block the app
      }
    }
    fetchQuestion()
    return () => { cancelled = true }
  }, [trek?.id, trekLoading])

  return (
    <>
      <PageTitle title="Home" />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[720px] space-y-10">
          {trekLoading ? (
            <div className="text-center">
              <p className="font-mono text-trail-brown text-sm italic">Loading your trek...</p>
            </div>
          ) : trekError ? (
            <div className="text-center space-y-4">
              <p className="font-body text-lg text-signal-orange">
                Could not load your trek.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-signal-orange text-catalog-cream font-ui font-semibold rounded-lg hover:bg-signal-orange/90 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : trek ? (
            <>
              {/* Trek Header */}
              <div className="text-center">
                <h1 className="font-display text-[32px] text-ink mb-3">
                  {trek.trek_name}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <DifficultyBadge difficulty={trek.difficulty} />
                  {trek.estimated_duration && (
                    <span className="font-body font-light text-sm text-trail-brown">
                      {trek.estimated_duration}
                    </span>
                  )}
                </div>
              </div>

              {/* Trail Progress Card */}
              <div className="bg-cream-light rounded-lg border border-trail-brown/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-ui font-medium text-[10px] uppercase tracking-[0.12em] text-trail-brown">
                    Trail Progress
                  </span>
                  <span className="font-ui font-medium text-[10px] uppercase tracking-[0.12em] text-trail-brown">
                    {trek.completed_camps || 0} / {trek.total_camps} Camps
                  </span>
                </div>
                <div className="relative pl-5">
                  {/* Vertical trail line */}
                  <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-trail-brown/20" />
                  <div
                    className="absolute left-[9px] top-1 w-0.5 bg-summit-cobalt transition-all"
                    style={{
                      height: camps?.length
                        ? `${((camps.filter(c => c.status === 'completed').length) / camps.length) * 100}%`
                        : '0%'
                    }}
                  />

                  <div className="space-y-6">
                    {(camps || []).map((camp) => (
                      <div key={camp.id} className="flex items-center gap-3 relative">
                        {/* Camp node */}
                        <div
                          className={`absolute -left-5 w-3 h-3 rounded-full border-2 flex-shrink-0 z-10 ${
                            camp.status === 'completed'
                              ? 'bg-summit-cobalt border-summit-cobalt'
                              : camp.status === 'active'
                                ? 'bg-signal-orange border-signal-orange camp-active-pulse'
                                : 'bg-transparent border-trail-brown/30 border-dashed'
                          }`}
                        >
                          {camp.status === 'completed' && (
                            <svg className="w-full h-full text-catalog-cream" viewBox="0 0 12 12">
                              <path d="M3 6L5.5 8.5L9 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        <span
                          className={`font-body text-base ${
                            camp.status === 'completed'
                              ? 'text-ink'
                              : camp.status === 'active'
                                ? 'text-ink font-medium'
                                : 'text-trail-brown/50'
                          }`}
                        >
                          {camp.camp_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sherpa Welcome Card */}
              <SherpaTerminal>
                Morning on the mountain. You left off at Camp {(trek.completed_camps || 0) + 1}. The trail is clear. Ready when you are.
              </SherpaTerminal>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary: Start Next Lesson */}
                <button
                  onClick={() => navigate('/learn')}
                  className="w-full h-14 bg-summit-cobalt text-catalog-cream font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors text-sm"
                >
                  <span className="block">Start Next Lesson</span>
                  <span className="block text-xs font-normal text-catalog-cream/70 mt-0.5">Continue where you left off</span>
                </button>

                {/* Secondary: View Trail */}
                <button
                  onClick={() => navigate('/trail')}
                  className="w-full h-14 bg-transparent border border-trail-brown/40 text-ink font-ui font-medium rounded-lg hover:bg-cream-light transition-colors text-sm"
                >
                  <span className="block">View Trail</span>
                  <span className="block text-xs font-normal text-trail-brown mt-0.5">See your full learning path</span>
                </button>

                {/* Tertiary: Talk to the Sherpa */}
                <button
                  onClick={() => navigate('/chat')}
                  className="w-full h-14 bg-transparent border border-alpine-gold/40 text-ink font-body italic rounded-lg hover:bg-cream-light transition-colors text-sm"
                >
                  <span className="block">Talk to the Sherpa</span>
                  <span className="block text-xs font-body font-light not-italic text-trail-brown mt-0.5">Ask questions or get help</span>
                </button>
              </div>

              {/* Footer links */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/notebook')}
                  className="font-body text-sm text-summit-cobalt hover:underline transition-colors"
                >
                  Trek Notebook
                </button>

                {!showAbandonConfirm ? (
                  <button
                    onClick={() => setShowAbandonConfirm(true)}
                    className="font-body font-light text-xs text-trail-brown/50 hover:text-signal-orange transition-colors"
                  >
                    Abandon this trek
                  </button>
                ) : (
                  <div className="p-3 border border-signal-orange/20 rounded-lg bg-signal-orange/5">
                    <p className="text-xs font-ui text-signal-orange mb-2">
                      Are you sure? This cannot be undone.
                    </p>
                    {abandonError && (
                      <p className="text-xs font-ui text-signal-orange mb-2">{abandonError}</p>
                    )}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setShowAbandonConfirm(false)}
                        className="px-3 py-1 text-xs font-ui text-trail-brown border border-trail-brown/20 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAbandon}
                        disabled={abandoning}
                        className="px-3 py-1 text-xs font-ui text-catalog-cream bg-signal-orange rounded disabled:opacity-50"
                      >
                        {abandoning ? 'Abandoning...' : 'Confirm Abandon'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <NewTrekFlow onComplete={refetchTrek} profile={profile} />
          )}
        </div>
      </div>

      {/* Morning Question Modal */}
      {showMorningQuestion && morningQuestion && (
        <MorningQuestion
          question={morningQuestion}
          trekId={trek?.id}
          userId={user?.id}
          onClose={() => setShowMorningQuestion(false)}
        />
      )}
    </>
  )
}
