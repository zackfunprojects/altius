import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { useElevationLog } from '../hooks/useElevationLog'
import { useTrekNotebook } from '../hooks/useTrekNotebook'
import { useExpeditionEvents } from '../hooks/useExpeditionEvents'
import { calculateWeatherState } from '../lib/weather'
import { computeTerrainParams } from '../lib/terrain'
import { getExpeditionDay } from '../lib/expedition'
import ElevationCounter from '../components/brand/ElevationCounter'
import MountainScene from '../components/trail/MountainScene'
import EventOverlay from '../components/trail/EventOverlay'

const DISMISSED_KEY = 'altius_dismissed_events'

function getDismissedIds(userId) {
  try {
    const raw = localStorage.getItem(`${DISMISSED_KEY}_${userId}`)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissedIds(userId, ids) {
  localStorage.setItem(`${DISMISSED_KEY}_${userId}`, JSON.stringify([...ids]))
}

export default function TrailView() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { trek, camps, loading: trekLoading } = useActiveTrek()
  const { entries: elevationLog } = useElevationLog()
  const { entries: notebookEntries } = useTrekNotebook()
  const { events } = useExpeditionEvents(trek?.id)

  const [dismissedIds, setDismissedIds] = useState(() => getDismissedIds(user?.id))

  // Derived state
  const terrainParams = useMemo(
    () => trek ? computeTerrainParams(trek.skill_description, trek.trek_name) : null,
    [trek]
  )

  const weatherState = useMemo(
    () => calculateWeatherState(elevationLog),
    [elevationLog]
  )

  const expeditionDay = useMemo(
    () => getExpeditionDay(profile?.created_at),
    [profile?.created_at]
  )

  // Badges from completed treks (first 6 with skill_badge)
  const badges = useMemo(
    () => notebookEntries
      .filter(e => e.skill_badge)
      .slice(0, 6)
      .map(e => e.skill_badge),
    [notebookEntries]
  )

  // Current camp index (first active, or last completed)
  const currentCampIndex = useMemo(() => {
    if (!camps?.length) return 0
    const activeIdx = camps.findIndex(c => c.status === 'active')
    if (activeIdx >= 0) return activeIdx
    // If all completed, position at last camp
    const lastCompleted = camps.reduce((acc, c, i) => c.status === 'completed' ? i : acc, 0)
    return lastCompleted
  }, [camps])

  // Event queue - undismissed events
  const pendingEvent = useMemo(() => {
    if (!trek?.id || !events?.length) return null
    return events.find(e => !dismissedIds.has(e.id)) || null
  }, [trek?.id, events, dismissedIds])

  const dismissEvent = useCallback(() => {
    if (!pendingEvent || !user?.id) return
    const next = new Set(dismissedIds)
    next.add(pendingEvent.id)
    setDismissedIds(next)
    saveDismissedIds(user.id, next)
  }, [pendingEvent, user, dismissedIds])

  // Loading state
  if (trekLoading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-phosphor-green phosphor-glow text-lg">
          Scanning the ridge...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-terminal-dark flex flex-col">
      {/* Nav bar */}
      <nav className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-sm text-phosphor-green/60 hover:text-phosphor-green transition-colors"
        >
          &larr; Base Camp
        </button>
        <div className="text-center flex-1 min-w-0 px-4">
          {trek && (
            <p className="font-mono text-sm text-phosphor-green/80 truncate phosphor-glow">
              {trek.trek_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-trail-brown/60">
            Day {expeditionDay}
          </span>
          <ElevationCounter elevation={profile?.current_elevation || 0} />
        </div>
      </nav>

      {/* CRT Bezel */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-2 sm:py-4">
        <div className="crt-bezel w-full max-w-4xl">
          <div className="crt-screen crt-scanlines crt-vignette aspect-[16/10] relative">
            {trek && terrainParams ? (
              <MountainScene
                terrainParams={terrainParams}
                weatherState={weatherState}
                camps={camps || []}
                currentCampIndex={currentCampIndex}
                badges={badges}
              />
            ) : (
              /* Empty state - no active trek */
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="font-mono text-phosphor-green phosphor-glow text-lg mb-4">
                    The mountain waits.
                  </p>
                  <p className="font-mono text-phosphor-green/60 text-sm leading-relaxed max-w-sm">
                    No active trek. Tell the Sherpa what you want to learn, and the trail will appear.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Action footer */}
      <footer className="px-4 sm:px-6 py-4 flex items-center justify-center gap-4 max-w-4xl mx-auto w-full">
        {trek && (
          <button
            onClick={() => navigate('/learn')}
            className="flex-1 max-w-xs py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors text-sm"
          >
            Continue Trek
          </button>
        )}
        <button
          onClick={() => navigate('/chat')}
          className="flex-1 max-w-xs py-2.5 border border-phosphor-green/30 text-phosphor-green bg-terminal-dark font-mono rounded-lg hover:border-phosphor-green/50 transition-colors text-sm"
        >
          Talk to the Sherpa
        </button>
        <button
          onClick={() => navigate('/notebook')}
          className="flex-shrink-0 py-2.5 px-4 text-phosphor-green/50 font-mono text-sm hover:text-phosphor-green transition-colors"
        >
          Notebook
        </button>
      </footer>

      {/* Event overlay */}
      <EventOverlay event={pendingEvent} onDismiss={dismissEvent} />
    </div>
  )
}
