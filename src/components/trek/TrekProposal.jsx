import DifficultyBadge from '../brand/DifficultyBadge'

/**
 * Displays a generated trek proposal with camps, difficulty, duration, and summit challenge.
 * Used in the onboarding flow after trek generation.
 */
export default function TrekProposal({ proposal, onBegin, loading }) {
  if (!proposal) return null

  const { trek_name, difficulty, estimated_duration, summit_challenge, camps } = proposal

  return (
    <div className="bg-catalog-cream rounded-lg border border-trail-brown/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="font-display text-2xl text-ink mb-2">{trek_name}</h2>
        <div className="flex items-center gap-3">
          <DifficultyBadge difficulty={difficulty} />
          <span className="text-sm font-ui text-trail-brown">{estimated_duration}</span>
        </div>
      </div>

      {/* Trail Map - Camp List */}
      <div className="px-6 pb-4">
        <div className="relative pl-6">
          {/* Vertical trail line */}
          <div className="absolute left-2 top-1 bottom-1 w-px bg-trail-brown/30" />

          {(camps || []).map((camp, i) => (
            <div key={camp.camp_number} className="relative pb-4 last:pb-0">
              {/* Camp marker dot */}
              <div
                className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${
                  i === 0
                    ? 'bg-phosphor-green border-phosphor-green'
                    : 'bg-catalog-cream border-trail-brown/50'
                }`}
              />

              <div>
                <p className="font-ui font-medium text-sm text-ink">
                  {camp.camp_name}
                </p>
                {camp.learning_objectives?.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {camp.learning_objectives.map((obj, j) => (
                      <li
                        key={j}
                        className="text-xs font-body text-trail-brown pl-2 before:content-['-'] before:mr-1 before:text-trail-brown/50"
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
          <div className="relative pb-0">
            <div className="absolute -left-4 top-1 w-3 h-3 bg-alpine-gold border-2 border-alpine-gold rotate-45" />
            <p className="font-ui font-medium text-sm text-alpine-gold">
              The Summit
            </p>
          </div>
        </div>
      </div>

      {/* Summit Challenge */}
      {summit_challenge?.description && (
        <div className="px-6 pb-4">
          <div className="bg-terminal-dark/5 rounded p-3 border border-trail-brown/10">
            <p className="text-xs font-ui font-medium text-trail-brown/70 uppercase tracking-wider mb-1">
              Summit Challenge
            </p>
            <p className="text-sm font-body text-ink">
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
          className="w-full py-3 bg-signal-orange text-white font-ui font-semibold rounded-md hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Preparing the trail...' : 'Begin the Trek'}
        </button>
      </div>
    </div>
  )
}
