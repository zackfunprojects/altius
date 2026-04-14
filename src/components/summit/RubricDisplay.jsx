/**
 * Displays summit challenge rubric dimensions.
 * Pre-submission: shows what will be evaluated (no scores).
 * Post-submission: shows dimension scores as horizontal bars.
 */
export default function RubricDisplay({ rubric = [], scores = null }) {
  const hasScores = scores && Array.isArray(scores) && scores.length > 0

  // Build a lookup from dimension name to score data
  const scoreMap = {}
  if (hasScores) {
    for (const s of scores) {
      scoreMap[s.dimension] = s
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-ui font-medium text-trail-brown/70 uppercase tracking-wider">
        Evaluation Rubric
      </p>
      {rubric.map((dim, i) => {
        const scoreData = scoreMap[dim.dimension]
        const score = scoreData?.score
        const feedback = scoreData?.feedback
        const passed = typeof score === 'number' && score >= 0.6

        return (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-ui font-medium text-ink">
                {dim.dimension}
              </span>
              {dim.weight && !hasScores && (
                <span className="text-xs font-mono text-trail-brown/50">
                  {Math.round(dim.weight * 100)}%
                </span>
              )}
              {typeof score === 'number' && (
                <span className={`text-sm font-mono font-bold ${passed ? 'text-phosphor-green' : 'text-signal-orange'}`}>
                  {Math.round(score * 100)}%
                </span>
              )}
            </div>

            {dim.criteria && !hasScores && (
              <p className="text-xs font-body text-trail-brown/60 leading-snug">
                {dim.criteria}
              </p>
            )}

            {typeof score === 'number' && (
              <div className="h-2 rounded-full bg-trail-brown/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-phosphor-green' : 'bg-signal-orange'}`}
                  style={{ width: `${Math.max(2, score * 100)}%` }}
                />
              </div>
            )}

            {feedback && (
              <p className="text-xs font-body text-trail-brown/70 leading-snug italic">
                {feedback}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
