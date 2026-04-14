import { useEffect } from 'react'
import { AnimatePresence, m as Motion } from 'framer-motion'
import TypewriterText from '../ui/TypewriterText'
import CRTBezel from '../brand/CRTBezel'

/**
 * Oregon Trail-style dialog for expedition events.
 * Shows one event at a time with typewriter text animation.
 */
export default function EventOverlay({ event, onDismiss }) {
  // Keyboard dismiss
  useEffect(() => {
    if (!event) return

    function handleKey(e) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [event, onDismiss])

  return (
    <AnimatePresence>
      {event && (
        <Motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onDismiss}
          />

          {/* Dialog */}
          <Motion.div
            className="relative max-w-md w-full"
            role="dialog"
            aria-modal="true"
            aria-label={event.title || 'Expedition event'}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CRTBezel>
              <div className="px-8 py-6">
                <h2 className="font-display text-lg text-catalog-cream mb-3 leading-snug">
                  {event.title}
                </h2>

                {event.body && (
                  <div className="font-mono text-sm text-catalog-cream/80 italic leading-relaxed mb-4">
                    <TypewriterText text={event.body} speed={25} />
                  </div>
                )}

                {event.elevation_bonus > 0 && (
                  <p className="font-mono text-base font-bold text-phosphor-green phosphor-glow mb-4">
                    &#9650; +{event.elevation_bonus} ft
                  </p>
                )}

                <button
                  onClick={onDismiss}
                  className="w-full py-2.5 font-ui font-medium text-sm text-catalog-cream bg-transparent border border-phosphor-green/30 rounded-md hover:bg-phosphor-green/10 transition-colors"
                >
                  Continue on the Trail
                </button>

                <p className="text-center font-mono text-xs text-catalog-cream/30 mt-3">
                  Press SPACE to continue
                </p>
              </div>
            </CRTBezel>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
