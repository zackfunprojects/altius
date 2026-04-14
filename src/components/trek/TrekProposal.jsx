import DifficultyBadge from '../brand/DifficultyBadge'

/**
 * Displays a generated trek proposal with camps, difficulty, duration, and summit challenge.
 * Used in the onboarding flow after trek generation.
 */
export default function TrekProposal({ proposal, onBegin, loading }) {
  if (!proposal) return null

  const { trek_name, difficulty, estimated_duration, summit_challenge, camps } = proposal

  return (
    <div className="bg-catalog-cream rounded-xl border border-trail-brown/25 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-trail-brown/15">
        <h2 className="font-display text-3xl text-ink mb-3">{trek_name}</h2>
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={difficulty} />
          <span className="text-sm font-ui text-trail-brown/80">{estimated_duration}</span>
        </div>
      </div>

      {/* Trail Map - Camp List */}
      <div className="px-6 py-5">
        <div className="relative pl-8">
          {/* Vertical trail line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-trail-brown/20" />

          {(camps || []).map((camp, i) => (
            <div key={camp.camp_number} className="relative pb-6 last:pb-3">
              {/* Camp marker dot */}
              <div
                className={`absolute -left-[17px] top-1 w-4 h-4 rounded-full border-2 ${
                  i === 0
                    ? 'bg-phosphor-green border-phosphor-green'
                    : 'bg-white border-trail-brown/40'
                }`}
              />

              <div>
                <p className="font-ui font-semibold text-base text-ink leading-snug">
                  {camp.camp_name}
                </p>
                {camp.learning_objectives?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {camp.learning_objectives.map((obj, j) => (
                      <li
                        key={j}
                        className="text-sm font-body text-ink/80 pl-3 before:content-['-'] before:mr-2 before:text-ink/40"
                      >
                        {obj}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}

          {/* Summit marker */}
          <div className="relative">
            <div className="absolute -left-[17px] top-0.5 w-4 h-4 bg-alpine-gold border-2 border-alpine-gold rotate-45" />
            <p className="font-ui font-semibold text-base text-alpine-gold">
              The Summit
            </p>
          </div>
        </div>
      </div>

      {/* Summit Challenge */}
      {summit_challenge?.description && (
        <div className="px-6 pb-5">
          <div className="bg-ink/5 rounded-lg p-4 border border-ink/10">
            <p className="text-xs font-ui font-semibold text-ink/50 uppercase tracking-wider mb-2">
              Summit Challenge
            </p>
            <p className="text-sm font-body text-ink leading-relaxed">
              {summit_challenge.description}
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          onClick={onBegin}
          disabled={loading}
          className="w-full py-3.5 bg-signal-orange text-white text-lg font-ui font-semibold rounded-lg hover:bg-signal-orange/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-signal-orange/50"
        >
          {loading ? 'Preparing the trail...' : 'Begin the Trek'}
        </button>
      </div>
    </div>
  )
}
