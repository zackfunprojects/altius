import { useMemo, memo } from 'react'
import { generateMountainPath, generateSnowCapPath, computeCampPositions, generateTrailPath } from '../../lib/mountainPath'
import MountaineerSVG from './MountaineerSVG'
import WeatherLayer from './WeatherLayer'

const WIDTH = 1000
const HEIGHT = 600

// Sky color presets by weather condition
const SKY_GRADIENTS = {
  calm: ['#5a7a9a', '#3a5a7a', '#2a3a4a'],
  perfect: ['#87CEEB', '#5a9abf', '#2a5a8a'],
  deep_fog: ['#3a3a3a', '#2a2a2a', '#1a1a1a'],
  fog_lifting: ['#6a6a5a', '#5a5a4a', '#3a3a2a'],
  clouds_building: ['#3a4a5a', '#2a3a4a', '#1a2030'],
  clear: ['#6a9ac0', '#4a7ab0', '#2a4a6a'],
}

function getSkyStops(condition, palette) {
  const base = SKY_GRADIENTS[condition] || SKY_GRADIENTS.calm
  // Blend terrain palette into the sky for cohesion
  return [
    base[0],
    base[1],
    palette?.[3] || base[2],
  ]
}

/**
 * Layered SVG mountain scene driven by terrain params and weather state.
 */
const MountainScene = memo(function MountainScene({
  terrainParams,
  weatherState,
  camps = [],
  currentCampIndex = 0,
  badges = [],
}) {
  const peakStyle = terrainParams?.peakStyle || 'varied'
  const palette = terrainParams?.palette || ['#2C2418', '#8B7355', '#1A3D7C', '#0D0F14']
  const trailStyle = terrainParams?.trailStyle || 'winding'
  const condition = weatherState?.condition || 'calm'
  const snowOnPeaks = weatherState?.snowOnPeaks || false

  // Memoize heavy geometry calculations
  const mountainPaths = useMemo(() => [
    generateMountainPath(peakStyle, 0, WIDTH, HEIGHT),
    generateMountainPath(peakStyle, 1, WIDTH, HEIGHT),
    generateMountainPath(peakStyle, 2, WIDTH, HEIGHT),
  ], [peakStyle])

  const snowPath = useMemo(() => generateSnowCapPath(peakStyle, WIDTH), [peakStyle])

  const campPositions = useMemo(
    () => computeCampPositions(camps.length, trailStyle, WIDTH, HEIGHT),
    [camps.length, trailStyle]
  )

  const trailPathD = useMemo(
    () => generateTrailPath(campPositions),
    [campPositions]
  )

  const skyStops = getSkyStops(condition, palette)

  // Mountain layer colors: far uses palette[3], mid uses palette[1], near uses palette[0]
  const layerColors = [
    palette[3] || '#0D0F14',
    palette[1] || '#8B7355',
    palette[0] || '#2C2418',
  ]

  // Determine active camp position for mountaineer
  const activePos = campPositions[currentCampIndex] || campPositions[0]

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="trail-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyStops[0]} />
            <stop offset="50%" stopColor={skyStops[1]} />
            <stop offset="100%" stopColor={skyStops[2]} />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#trail-sky)" />

        {/* Far mountain range */}
        <path d={mountainPaths[0]} fill={layerColors[0]} opacity="0.6" />

        {/* Mid mountain */}
        <path d={mountainPaths[1]} fill={layerColors[1]} opacity="0.8" />

        {/* Foreground mountain */}
        <path d={mountainPaths[2]} fill={layerColors[2]} />

        {/* Snow caps */}
        {snowOnPeaks && snowPath && (
          <path d={snowPath} fill="rgba(255,255,255,0.85)" />
        )}

        {/* Trail path */}
        {trailPathD && (
          <path
            d={trailPathD}
            fill="none"
            stroke="#F4EDE0"
            strokeWidth="2"
            strokeDasharray="8 6"
            opacity="0.45"
          />
        )}

        {/* Camp markers */}
        {campPositions.map((pos, i) => {
          const camp = camps[i]
          if (!camp) return null

          const isCompleted = camp.status === 'completed'
          const isActive = i === currentCampIndex

          return (
            <g key={camp.id || i}>
              {/* Outer glow for active */}
              {isActive && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="12"
                  fill="none"
                  stroke="#1A3D7C"
                  strokeWidth="1.5"
                  opacity="0.3"
                  className="camp-active-pulse"
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 7 : isCompleted ? 6 : 5}
                fill={isCompleted ? '#4ADE80' : isActive ? '#1A3D7C' : 'rgba(139,115,85,0.3)'}
                stroke={isCompleted ? '#3ac770' : isActive ? '#15326a' : 'none'}
                strokeWidth="1.5"
              />
              {/* Camp label */}
              {(isActive || isCompleted) && (
                <text
                  x={pos.x}
                  y={pos.y - 14}
                  textAnchor="middle"
                  fill="#F4EDE0"
                  fontSize="11"
                  fontFamily="'Courier New', monospace"
                  opacity="0.7"
                >
                  {camp.camp_name?.length > 20 ? camp.camp_name.slice(0, 18) + '..' : camp.camp_name}
                </text>
              )}
            </g>
          )
        })}

        {/* Mountaineer at active camp */}
        {activePos && (
          <MountaineerSVG
            x={activePos.x}
            y={activePos.y}
            badges={badges}
            scale={1.2}
          />
        )}
      </svg>

      {/* Weather overlays (HTML divs for CSS gradient effects) */}
      <WeatherLayer weatherState={weatherState} />
    </div>
  )
})

export default MountainScene
