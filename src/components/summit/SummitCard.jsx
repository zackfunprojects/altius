import JournalPaper from '../brand/JournalPaper'
import DifficultyBadge from '../brand/DifficultyBadge'

const BADGE_COLORS = {
  default: '#1A3D7C',
}

/**
 * Vintage expedition postcard displaying a completed trek from the notebook.
 */
export default function SummitCard({ entry, index = 0, onRefresh }) {
  const badgeColor = entry.skill_badge?.color || BADGE_COLORS.default
  const badgeLabel = entry.skill_badge?.label || entry.skill_name
  // Alternate slight rotation for postcard feel
  const rotation = index % 2 === 0 ? 'rotate-[0.5deg]' : 'rotate-[-0.5deg]'

  return (
    <div className={`${rotation} hover:rotate-0 transition-transform duration-200`}>
      <JournalPaper className="relative overflow-hidden">
        {/* Stamp-like badge in top-right corner */}
        <div
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center border-2 opacity-80"
          style={{ borderColor: badgeColor, backgroundColor: `${badgeColor}15` }}
        >
          <span className="text-xs font-mono font-bold" style={{ color: badgeColor }}>
            {entry.skill_badge?.icon?.charAt(0)?.toUpperCase() || 'S'}
          </span>
        </div>

        {/* Skill name */}
        <h3 className="font-display text-xl text-ink mb-1 pr-14">
          {badgeLabel}
        </h3>

        {/* Metadata line */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono text-trail-brown/60">
            Day {entry.summit_date}
          </span>
          {entry.trek_id && (
            <DifficultyBadge difficulty={entry.difficulty || 'day_hike'} />
          )}
        </div>

        {/* Summit entry (Sherpa's reflection) */}
        <p className="font-body text-sm text-ink/80 leading-relaxed mb-4 italic">
          {entry.summit_entry}
        </p>

        {/* Key concepts */}
        {entry.key_concepts?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {entry.key_concepts.slice(0, 8).map((concept, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 text-xs font-ui text-trail-brown/70 bg-trail-brown/8 rounded-full border border-trail-brown/10"
              >
                {concept}
              </span>
            ))}
            {entry.key_concepts.length > 8 && (
              <span className="text-xs font-ui text-trail-brown/40">
                +{entry.key_concepts.length - 8} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          {entry.summit_deliverable_url && (
            <a
              href={entry.summit_deliverable_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-ui text-summit-cobalt hover:text-summit-cobalt/80 underline"
            >
              View deliverable
            </a>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs font-ui text-fitz-violet hover:text-fitz-violet/80 underline"
            >
              Skill Refresh
            </button>
          )}
        </div>
      </JournalPaper>
    </div>
  )
}
