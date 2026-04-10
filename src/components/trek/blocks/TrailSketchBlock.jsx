import { useState } from 'react'

export default function TrailSketchBlock({ spec }) {
  const [revealedSteps, setRevealedSteps] = useState(1)
  const steps = spec?.steps || []
  const allRevealed = revealedSteps >= steps.length

  return (
    <div className="bg-white rounded-lg border border-trail-brown/15 p-5">
      {spec?.title && (
        <h3 className="font-display text-lg text-ink mb-4">{spec.title}</h3>
      )}
      <div className="space-y-3">
        {steps.slice(0, revealedSteps).map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 animate-in fade-in duration-300"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-summit-cobalt/10 text-summit-cobalt flex items-center justify-center text-xs font-ui font-semibold mt-0.5">
              {i + 1}
            </div>
            <div className="min-w-0">
              <p className="font-ui font-medium text-sm text-ink">{step.label}</p>
              {step.description && (
                <p className="font-body text-sm text-trail-brown mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {!allRevealed && (
        <button
          onClick={() => setRevealedSteps(prev => prev + 1)}
          className="mt-4 text-xs font-ui font-medium text-summit-cobalt hover:text-summit-cobalt/80 transition-colors"
        >
          Reveal next step
        </button>
      )}
    </div>
  )
}
