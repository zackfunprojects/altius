import { useState } from 'react'

export default function ParallelRouteBlock({ spec }) {
  const [userText, setUserText] = useState('')
  const [revealed, setRevealed] = useState(false)

  if (!spec) return null

  const handleReveal = () => {
    if (!userText.trim()) return
    setRevealed(true)
  }

  return (
    <div className="bg-white rounded-lg border border-fitz-violet/20 overflow-hidden">
      {/* Brief */}
      <div className="bg-fitz-violet/5 px-5 py-3 border-b border-fitz-violet/10">
        <p className="text-xs font-ui font-medium text-fitz-violet uppercase tracking-wider mb-1">
          Parallel Route
        </p>
        <p className="font-body text-ink">{spec.brief || spec.user_prompt}</p>
      </div>

      {revealed ? (
        /* Side-by-side comparison */
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-trail-brown/10">
          <div className="p-4">
            <p className="text-xs font-ui font-medium text-trail-brown mb-2">Your approach</p>
            <p className="font-body text-sm text-ink whitespace-pre-wrap">{userText}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-ui font-medium text-fitz-violet mb-2">The Sherpa's approach</p>
            <p className="font-body text-sm text-ink whitespace-pre-wrap">
              {spec.sherpa_version || 'The Sherpa took a different path here.'}
            </p>
          </div>
        </div>
      ) : (
        /* User writing area */
        <div className="p-5">
          <textarea
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="Write your approach..."
            className="w-full h-28 px-3 py-2 font-body text-sm text-ink bg-catalog-cream border border-trail-brown/15 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-fitz-violet/40"
          />
          <button
            onClick={handleReveal}
            disabled={!userText.trim()}
            className="mt-2 px-4 py-1.5 text-sm font-ui font-medium bg-fitz-violet text-white rounded-md hover:bg-fitz-violet/90 transition-colors disabled:opacity-50"
          >
            Compare with the Sherpa
          </button>
        </div>
      )}

      {/* Comparison notes */}
      {revealed && spec.comparison_dimensions && (
        <div className="px-5 pb-4">
          <div className="bg-fitz-violet/5 rounded-md p-3">
            <p className="text-xs font-ui font-medium text-fitz-violet mb-1">Points of comparison</p>
            <ul className="space-y-1">
              {(Array.isArray(spec.comparison_dimensions) ? spec.comparison_dimensions : []).map((dim, i) => (
                <li key={i} className="text-xs font-body text-trail-brown">- {dim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
