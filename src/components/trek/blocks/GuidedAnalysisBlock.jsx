import { useState } from 'react'

export default function GuidedAnalysisBlock({ spec }) {
  const [expandedExample, setExpandedExample] = useState(0)
  const examples = spec?.examples || []

  if (!examples.length) return null

  return (
    <div className="bg-white rounded-lg border border-trail-brown/15 p-5">
      {spec?.title && (
        <h3 className="font-display text-lg text-ink mb-4">{spec.title}</h3>
      )}
      <div className="space-y-3">
        {examples.map((example, i) => (
          <div
            key={i}
            className="border border-trail-brown/10 rounded-md overflow-hidden"
          >
            <button
              onClick={() => setExpandedExample(expandedExample === i ? -1 : i)}
              aria-expanded={expandedExample === i}
              aria-controls={`guided-example-${i}`}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-catalog-cream/50 transition-colors"
            >
              <span className="font-ui font-medium text-sm text-ink">
                {example.title}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`text-trail-brown transition-transform ${expandedExample === i ? 'rotate-180' : ''}`}
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {expandedExample === i && (
              <div id={`guided-example-${i}`} className="px-4 pb-4 space-y-3">
                {example.description && (
                  <p className="font-body text-sm text-trail-brown">
                    {example.description}
                  </p>
                )}
                {example.analysis_prompts?.length > 0 && (
                  <div className="bg-fitz-violet/5 rounded-md p-3 space-y-2">
                    <p className="text-xs font-ui font-medium text-fitz-violet uppercase tracking-wider">
                      Analysis Prompts
                    </p>
                    {example.analysis_prompts.map((prompt, j) => (
                      <p key={j} className="font-body text-sm text-ink italic">
                        {prompt}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
