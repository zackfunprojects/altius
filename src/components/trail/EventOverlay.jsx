import { useEffect } from 'react'
import { AnimatePresence, m as Motion } from 'framer-motion'
import TypewriterText from '../ui/TypewriterText'

/**
 * Oregon Trail-style dialog for expedition events.
 * Shows one event at a time with typewriter text animation.
 */
export default function EventOverlay({ event, onDismiss }) {
  // Keyboard dismiss
  useEffect(() => {
    if (!event) return

    function handleKey(e) {
      if (e.key === ' ' || e.key === 'Enter') {
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
            className="trail-dialog relative px-8 py-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg font-bold mb-3 leading-snug">
              {event.title}
            </p>

            {event.body && (
              <div className="text-sm leading-relaxed mb-4 opacity-90">
                <TypewriterText text={event.body} speed={25} />
              </div>
            )}

            {event.elevation_bonus > 0 && (
              <p className="text-base font-bold mb-4">
                &#9650; +{event.elevation_bonus} ft
              </p>
            )}

            <p className="text-xs opacity-50 mt-4">
              Press SPACE to continue
            </p>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
