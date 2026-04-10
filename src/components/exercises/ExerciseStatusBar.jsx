export default function ExerciseStatusBar({ attempts, status, hintsRevealed, totalHints, onRequestHint }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {/* Attempt counter */}
        <span className="text-xs font-ui text-trail-brown">
          Attempt {attempts || 1}
        </span>

        {/* Status indicator */}
        {status === 'submitting' && (
          <div className="flex items-center gap-1.5 text-xs font-ui text-trail-brown">
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Evaluating...</span>
          </div>
        )}

        {status === 'passed' && (
          <div className="flex items-center gap-1.5 text-xs font-ui text-phosphor-green">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Passed</span>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex items-center gap-1.5 text-xs font-ui text-alpine-gold">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M8 4V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="12" r="1" fill="currentColor" />
            </svg>
            <span>Try again</span>
          </div>
        )}
      </div>

      {/* Hint button - visible after 2+ attempts when hints are available */}
      {attempts >= 2 && totalHints > 0 && status === 'failed' && (
        <button
          onClick={onRequestHint}
          disabled={hintsRevealed >= totalHints}
          className="text-xs font-ui font-medium text-summit-cobalt hover:text-summit-cobalt/80 transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          {hintsRevealed >= totalHints
            ? `All hints revealed (${totalHints})`
            : `Request a Hint (${hintsRevealed + 1}/${totalHints})`
          }
        </button>
      )}
    </div>
  )
}
