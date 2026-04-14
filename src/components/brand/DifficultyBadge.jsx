const labels = {
  day_hike: 'Day Hike',
  weekend_trek: 'Weekend Trek',
  expedition: 'Epic Expedition',
  siege: 'Summit Siege',
}

export default function DifficultyBadge({ difficulty }) {
  const label = labels[difficulty]
  if (!label) return null

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-body font-light uppercase tracking-[0.08em] border border-signal-orange text-signal-orange">
      {label}
    </span>
  )
}
