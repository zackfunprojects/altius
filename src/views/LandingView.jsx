import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { getMorningQuestion } from '../lib/sherpa'
import { abandonTrek } from '../lib/trek'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import ElevationCounter from '../components/brand/ElevationCounter'
import DifficultyBadge from '../components/brand/DifficultyBadge'
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
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(() => {
    return !localStorage.getItem('altius_first_time_dismissed')
  })
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
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <PageTitle title="Home" />
      <FourColorBar />
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-trail-brown/20">
        <WordMark size="sm" />
        <div className="flex items-center gap-4">
          <ElevationCounter elevation={profile?.current_elevation || 0} />
          <button
            onClick={() => navigate('/settings')}
            className="text-trail-brown/60 hover:text-ink transition-colors"
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="9" r="3" />
              <path d="M9 1.5V3M9 15V16.5M1.5 9H3M15 9H16.5M3.1 3.1L4.2 4.2M13.8 13.8L14.9 14.9M3.1 14.9L4.2 13.8M13.8 4.2L14.9 3.1" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-lg">
          {trekLoading ? (
            <div className="text-center">
              <p className="font-mono text-trail-brown text-sm">Loading your trek...</p>
            </div>
          ) : trekError ? (
            <div className="text-center space-y-4">
              <p className="font-body text-lg text-signal-orange">
                Could not load your trek.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : trek ? (
            <div className="space-y-6">
              {/* Active trek display */}
              <div className="text-center">
                <h1 className="font-display text-3xl sm:text-4xl text-ink mb-2">
                  {trek.trek_name}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <DifficultyBadge difficulty={trek.difficulty} />
                  <span className="text-sm font-ui text-trail-brown">
                    {trek.estimated_duration}
                  </span>
                </div>
              </div>

              {/* Camp progress */}
              <div className="bg-white/50 rounded-lg border border-trail-brown/15 p-4">
                <p className="text-xs font-ui font-medium text-trail-brown/70 uppercase tracking-wider mb-3">
                  Trail Progress - {trek.completed_camps || 0} / {trek.total_camps} camps
                </p>
                <div className="space-y-2">
                  {(camps || []).map((camp) => (
                    <div key={camp.id} className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          camp.status === 'completed'
                            ? 'bg-phosphor-green'
                            : camp.status === 'active'
                              ? 'bg-summit-cobalt'
                              : 'bg-trail-brown/20'
                        }`}
                      />
                      <span
                        className={`text-sm font-body ${
                          camp.status === 'completed'
                            ? 'text-trail-brown/60 line-through'
                            : camp.status === 'active'
                              ? 'text-ink font-medium'
                              : 'text-trail-brown/40'
                        }`}
                      >
                        {camp.camp_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* First-time guide */}
              {showFirstTimeGuide && (
                <div className="p-4 bg-summit-cobalt/10 border border-summit-cobalt/20 rounded-lg relative">
                  <button
                    onClick={() => { setShowFirstTimeGuide(false); localStorage.setItem('altius_first_time_dismissed', 'true') }}
                    className="absolute top-2 right-2 text-trail-brown/40 hover:text-ink text-xs"
                  >
                    Dismiss
                  </button>
                  <p className="text-sm font-ui text-ink font-medium mb-1">Ready to start climbing?</p>
                  <p className="text-xs font-body text-trail-brown/70 leading-relaxed pr-8">
                    Click "Start next lesson" to begin learning. Your elevation goes up as you complete lessons and exercises. The Sherpa is always available if you get stuck.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/learn')}
                  className="w-full py-3 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors"
                >
                  <span className="block">Start next lesson</span>
                  <span className="block text-xs font-normal text-white/60 mt-0.5">Continue where you left off</span>
                </button>
                <button
                  onClick={() => navigate('/trail')}
                  className="w-full py-3 bg-terminal-dark text-phosphor-green font-mono rounded-lg border border-phosphor-green/20 hover:border-phosphor-green/40 transition-colors"
                >
                  <span className="block">View Trail</span>
                  <span className="block text-xs font-normal text-phosphor-green/50 mt-0.5">See your full learning path</span>
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  className="w-full py-3 border border-phosphor-green/30 text-phosphor-green bg-terminal-dark font-mono rounded-lg hover:bg-terminal-dark/90 hover:border-phosphor-green/50 transition-colors"
                >
                  <span className="block">Talk to the Sherpa</span>
                  <span className="block text-xs font-normal text-phosphor-green/50 mt-0.5">Ask questions or get help</span>
                </button>
              </div>

              {/* Abandon trek */}
              <div className="text-center">
                {!showAbandonConfirm ? (
                  <button
                    onClick={() => setShowAbandonConfirm(true)}
                    className="text-xs font-ui text-trail-brown/40 hover:text-signal-orange transition-colors"
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
                        className="px-3 py-1 text-xs font-ui text-white bg-signal-orange rounded disabled:opacity-50"
                      >
                        {abandoning ? 'Abandoning...' : 'Confirm Abandon'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <NewTrekFlow onComplete={refetchTrek} profile={profile} />
          )}
          {/* Trek Notebook link - always visible */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/notebook')}
              className="text-sm font-ui text-trail-brown/60 hover:text-ink transition-colors underline underline-offset-2"
            >
              Trek Notebook
            </button>
          </div>
        </div>
      </main>

      {/* Morning Question Modal */}
      {showMorningQuestion && morningQuestion && (
        <MorningQuestion
          question={morningQuestion}
          trekId={trek?.id}
          userId={user?.id}
          onClose={() => setShowMorningQuestion(false)}
        />
      )}
    </div>
  )
}
