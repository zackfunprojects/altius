import { useState, useEffect, useRef } from 'react'
import { m as Motion, AnimatePresence } from 'framer-motion'

export default function TrailSketchBlock({ spec }) {
  const [revealedSteps, setRevealedSteps] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const timerRef = useRef(null)
  const steps = spec?.steps || []
  const allRevealed = revealedSteps >= steps.length

  // Auto-advance when autoPlay is enabled
  useEffect(() => {
    if (autoPlay && !allRevealed) {
      timerRef.current = setTimeout(() => {
        setRevealedSteps(prev => prev + 1)
      }, 2000)
      return () => clearTimeout(timerRef.current)
    }
    if (allRevealed) setAutoPlay(false)
  }, [autoPlay, revealedSteps, allRevealed])

  // Auto-reveal first step on mount
  useEffect(() => {
    if (steps.length > 0 && revealedSteps === 0) {
      setRevealedSteps(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-white rounded-lg border border-trail-brown/15 p-5">
      <div className="flex items-center justify-between mb-4">
        {spec?.title && (
          <h3 className="font-display text-lg text-ink">{spec.title}</h3>
        )}
        {steps.length > 1 && (
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="text-xs font-ui font-medium text-summit-cobalt hover:text-summit-cobalt/80 transition-colors ml-auto"
          >
            {autoPlay ? 'Pause' : allRevealed ? 'Done' : 'Auto-play'}
          </button>
        )}
      </div>

      <div className="space-y-0">
        <AnimatePresence>
          {steps.slice(0, revealedSteps).map((step, i) => (
            <Motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex items-start gap-3 relative"
            >
              {/* Connector line */}
              {i > 0 && (
                <Motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute left-[13px] -top-3 w-0.5 h-3 bg-summit-cobalt/20 origin-top"
                />
              )}

              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-summit-cobalt/10 text-summit-cobalt flex items-center justify-center text-xs font-ui font-semibold mt-1">
                {i + 1}
              </div>
              <div className="min-w-0 pb-3">
                <p className="font-ui font-medium text-sm text-ink">{step.label}</p>
                {step.description && (
                  <p className="font-body text-sm text-trail-brown mt-0.5">{step.description}</p>
                )}
                {step.narration && (
                  <div className="mt-2 bg-terminal-dark rounded px-3 py-2">
                    <p className="font-mono text-xs text-phosphor-green/80 italic">{step.narration}</p>
                  </div>
                )}
              </div>
            </Motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!allRevealed && !autoPlay && (
        <button
          onClick={() => setRevealedSteps(prev => prev + 1)}
          className="mt-2 text-xs font-ui font-medium text-summit-cobalt hover:text-summit-cobalt/80 transition-colors"
        >
          Reveal next step
        </button>
      )}
    </div>
  )
}
