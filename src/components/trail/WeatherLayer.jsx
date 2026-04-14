import { m as Motion } from 'framer-motion'

const TRANSITION = { duration: 2, ease: 'easeInOut' }

/**
 * Atmospheric weather effects overlaying the mountain scene.
 * All visuals driven by calculateWeatherState() output.
 */
export default function WeatherLayer({ weatherState }) {
  if (!weatherState) return null

  const { fog, warmLight } = weatherState

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Fog band - low */}
      <Motion.div
        className="absolute left-0 right-0"
        style={{ top: '60%', height: '25%' }}
        animate={{ opacity: fog * 0.7 }}
        transition={TRANSITION}
      >
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.8) 60%, transparent 100%)',
          }}
        />
      </Motion.div>

      {/* Fog band - mid */}
      <Motion.div
        className="absolute left-0 right-0"
        style={{ top: '42%', height: '20%' }}
        animate={{ opacity: fog * 0.5 }}
        transition={TRANSITION}
      >
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          }}
        />
      </Motion.div>

      {/* Fog band - high (only in heavy fog) */}
      <Motion.div
        className="absolute left-0 right-0"
        style={{ top: '25%', height: '18%' }}
        animate={{ opacity: Math.max(0, fog - 0.5) * 0.6 }}
        transition={TRANSITION}
      >
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(200,200,210,0.3) 50%, transparent 100%)',
          }}
        />
      </Motion.div>

      {/* Warm amber light overlay */}
      <Motion.div
        className="absolute inset-0"
        animate={{ opacity: warmLight ? 0.15 : 0 }}
        transition={TRANSITION}
      >
        <div
          className="w-full h-full"
          style={{
            background: 'radial-gradient(ellipse at 30% 40%, rgba(212, 150, 11, 0.4) 0%, transparent 70%)',
          }}
        />
      </Motion.div>
    </div>
  )
}
