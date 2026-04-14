import { useMemo } from 'react'
import { useExpeditionEvents } from '../hooks/useExpeditionEvents'
import { useElevationLog } from '../hooks/useElevationLog'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import JournalPaper from '../components/brand/JournalPaper'
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

    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    return items
  }, [events, elevationEntries])

  return (
    <>
      <PageTitle title="Expedition Log" />

      <div className="text-center px-4 sm:px-6 pt-8 pb-4">
        <h1 className="font-display text-4xl text-ink">Expedition Log</h1>
        <p className="font-body text-trail-brown text-sm mt-2">
          {feed.length} entries recorded
        </p>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 max-w-2xl mx-auto w-full overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center">
            <p className="font-mono text-trail-brown text-sm italic">Loading expedition log...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="py-8">
            <SherpaTerminal>
              No entries yet. Start a trek and the log will fill itself.
            </SherpaTerminal>
          </div>
        ) : (
          <JournalPaper>
            <div className="space-y-3">
              {feed.map((item, i) => (
                <div
                  key={`${item.timestamp}-${i}`}
                  className="flex items-start gap-3 py-1"
                >
                  <span className="font-ui text-[10px] text-trail-brown/50 w-28 flex-shrink-0 text-right pt-0.5">
                    {formatTimestamp(item.timestamp)}
                  </span>
                  <span className={`font-mono text-xs w-5 flex-shrink-0 text-center pt-0.5 ${
                    item.type === 'event' ? 'text-alpine-gold' : 'text-summit-cobalt/60'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-body text-sm text-ink flex-1 min-w-0">
                    {item.title}
                    {item.delta && (
                      <span className="font-mono text-xs text-phosphor-green ml-2 font-bold">
                        +{item.delta} ft
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </JournalPaper>
        )}
      </div>
    </>
  )
}
