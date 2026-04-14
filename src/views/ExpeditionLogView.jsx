import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useExpeditionEvents } from '../hooks/useExpeditionEvents'
import { useElevationLog } from '../hooks/useElevationLog'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import ElevationCounter from '../components/brand/ElevationCounter'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import PageTitle from '../components/ui/PageTitle'

const EVENT_ICONS = {
  trek_started: '>>',
  camp_reached: '^^',
  summit_attempted: '??',
  summit_completed: '**',
  weather: '~~',
  narrative: '--',
  morning_question: '>?',
}

const ELEVATION_ICONS = {
  lesson_completed: '+L',
  exercise_passed: '+E',
  camp_reached: '+C',
  summit_completed: '+S',
  journal_note: '+J',
  event_bonus: '+B',
}

function formatTimestamp(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function ExpeditionLogView() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { events, loading: eventsLoading } = useExpeditionEvents()
  const { entries: elevationEntries, loading: elevationLoading } = useElevationLog()
  const loading = eventsLoading || elevationLoading

  // Merge events and elevation entries into a unified chronological feed
  const feed = useMemo(() => {
    const items = []

    for (const event of (events || [])) {
      items.push({
        type: 'event',
        timestamp: event.fired_at,
        icon: EVENT_ICONS[event.event_type] || '--',
        title: event.title,
        body: event.body,
        delta: event.elevation_bonus || null,
      })
    }

    for (const entry of (elevationEntries || [])) {
      items.push({
        type: 'elevation',
        timestamp: entry.logged_at,
        icon: ELEVATION_ICONS[entry.source_type] || '+?',
        title: `${entry.source_type.replace(/_/g, ' ')}`,
        body: null,
        delta: entry.delta,
      })
    }

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return items
  }, [events, elevationEntries])

  return (
    <div className="min-h-screen bg-terminal-dark flex flex-col">
      <PageTitle title="Expedition Log" />
      <div className="bg-catalog-cream">
        <FourColorBar />
      </div>

      <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-phosphor-green/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="font-mono text-sm text-phosphor-green/60 hover:text-phosphor-green transition-colors"
          >
            &larr; Home
          </button>
          <WordMark size="sm" />
        </div>
        <ElevationCounter elevation={profile?.current_elevation || 0} />
      </header>

      <div className="text-center px-4 sm:px-6 pt-6 pb-3">
        <h1 className="font-mono text-phosphor-green text-lg phosphor-glow">Expedition Log</h1>
        <p className="font-mono text-phosphor-green/40 text-xs mt-1">
          {feed.length} entries recorded
        </p>
      </div>

      <main className="flex-1 px-4 sm:px-6 py-4 max-w-2xl mx-auto w-full overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center">
            <p className="font-mono text-phosphor-green/50 text-sm">Loading expedition log...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="py-8">
            <SherpaTerminal>
              {'>'} No entries yet. Start a trek and the log will fill itself.
            </SherpaTerminal>
          </div>
        ) : (
          <div className="space-y-1">
            {feed.map((item, i) => (
              <div
                key={`${item.timestamp}-${i}`}
                className="flex items-start gap-3 py-1.5 font-mono text-xs"
              >
                <span className="text-phosphor-green/30 w-28 flex-shrink-0 text-right">
                  {formatTimestamp(item.timestamp)}
                </span>
                <span className={`w-5 flex-shrink-0 text-center ${
                  item.type === 'event' ? 'text-alpine-gold' : 'text-phosphor-green/60'
                }`}>
                  {item.icon}
                </span>
                <span className="text-phosphor-green/80 flex-1 min-w-0">
                  {item.title}
                  {item.delta && (
                    <span className="text-phosphor-green ml-2 font-bold">
                      +{item.delta} ft
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
