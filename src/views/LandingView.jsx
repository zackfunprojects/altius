import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActiveTrek } from '../hooks/useActiveTrek'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import ElevationCounter from '../components/brand/ElevationCounter'
import DifficultyBadge from '../components/brand/DifficultyBadge'
import SherpaTerminal from '../components/brand/SherpaTerminal'

export default function LandingView() {
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const { trek, camps, loading: trekLoading } = useActiveTrek()

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <FourColorBar />
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-trail-brown/20">
        <WordMark size="sm" />
        <div className="flex items-center gap-4">
          <ElevationCounter elevation={profile?.current_elevation || 0} />
          <button
            onClick={signOut}
            className="text-sm font-ui text-trail-brown hover:text-ink transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-lg">
          {trekLoading ? (
            <div className="text-center">
              <p className="font-mono text-trail-brown text-sm">Loading your trek...</p>
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

              {/* Sherpa message */}
              <SherpaTerminal>
                {'>'} The Learning View is coming next. Your trail is mapped and your first
                section is unlocked.
              </SherpaTerminal>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4">
                Welcome, Climber
              </h1>
              <p className="font-body text-lg text-trail-brown">
                No active trek. The mountain is waiting.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
