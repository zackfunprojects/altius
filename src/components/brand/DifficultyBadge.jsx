const config = {
  day_hike: {
    label: 'Day Hike',
    bg: 'bg-alpine-gold/15',
    text: 'text-alpine-gold',
    border: 'border-alpine-gold/30',
  },
  weekend_trek: {
    label: 'Weekend Trek',
    bg: 'bg-summit-cobalt/15',
    text: 'text-summit-cobalt',
    border: 'border-summit-cobalt/30',
  },
  expedition: {
    label: 'Expedition',
    bg: 'bg-signal-orange/15',
    text: 'text-signal-orange',
    border: 'border-signal-orange/30',
  },
  siege: {
    label: 'Siege',
    bg: 'bg-fitz-violet/15',
    text: 'text-fitz-violet',
    border: 'border-fitz-violet/30',
  },
}

export default function DifficultyBadge({ difficulty }) {
  const c = config[difficulty]
  if (!c) return null

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-ui font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  )
}
