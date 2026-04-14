import { useMemo, memo } from 'react'
import { computeCampPositions, generateTrailPath } from '../../lib/mountainPath'
import MountaineerSVG from './MountaineerSVG'
import WeatherLayer from './WeatherLayer'

const WIDTH = 1000
const HEIGHT = 625

// Sky color presets by weather condition
const SKY_PRESETS = {
  calm: { top: '#1A3D7C', mid: '#4a6a9a', bottom: '#D4960B' },
  perfect: { top: '#1A3D7C', mid: '#4a7ab0', bottom: '#D9511C' },
  deep_fog: { top: '#3a3a4a', mid: '#4a4a5a', bottom: '#6a6a7a' },
  fog_lifting: { top: '#4a5a6a', mid: '#6a7a6a', bottom: '#D4960B' },
  clouds_building: { top: '#2a3a5a', mid: '#3a4a6a', bottom: '#5a6a7a' },
  clear: { top: '#1A3D7C', mid: '#5a8ab0', bottom: '#D4960B' },
}

/**
 * Five-layer SVG mountain scene.
 * Layer 5 (back): Sky gradient
 * Layer 4: Far mountain range silhouette
 * Layer 3: Main mountain with brand sunset gradient
 * Layer 2: Trail path with camp markers
 * Layer 1 (front): Foreground terrain + fog
 */
const MountainScene = memo(function MountainScene({
  terrainParams,
  weatherState,
  camps = [],
  currentCampIndex = 0,
  badges = [],
}) {
  const condition = weatherState?.condition || 'calm'
  const snowOnPeaks = weatherState?.snowOnPeaks || false
  const trailStyle = terrainParams?.trailStyle || 'winding'

  const sky = SKY_PRESETS[condition] || SKY_PRESETS.calm

  const campPositions = useMemo(
    () => computeCampPositions(camps.length, trailStyle, WIDTH, HEIGHT),
    [camps.length, trailStyle]
  )

  const trailPathD = useMemo(
    () => generateTrailPath(campPositions),
    [campPositions]
  )

  const activePos = campPositions.length > 0
    ? (campPositions[currentCampIndex] || campPositions[0])
    : null

  // Completed trail segments (solid line up to current camp)
  const completedTrailD = useMemo(() => {
    if (!campPositions.length || currentCampIndex <= 0) return ''
    const pts = campPositions.slice(0, currentCampIndex + 1)
    return generateTrailPath(pts)
  }, [campPositions, currentCampIndex])

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.top} />
            <stop offset="60%" stopColor={sky.mid} />
            <stop offset="100%" stopColor={sky.bottom} />
          </linearGradient>

          {/* Brand sunset gradient for main mountain */}
          <linearGradient id="mountain-brand" x1="500" y1="100" x2="500" y2="520" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1A3D7C" />
            <stop offset="30%" stopColor="#5C2D82" />
            <stop offset="60%" stopColor="#D9511C" />
            <stop offset="100%" stopColor="#D4960B" />
          </linearGradient>

          {/* Foreground gradient */}
          <linearGradient id="foreground-grad" x1="0" y1="0.7" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C2418" />
            <stop offset="100%" stopColor="#1C1814" />
          </linearGradient>
        </defs>

        {/* ═══ LAYER 5: Sky ═══ */}
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#scene-sky)" />

        {/* ═══ LAYER 4: Far Mountain Range ═══ */}
        <path
          d="M0 380 Q80 330 160 350 Q240 310 320 340 Q400 280 480 320 Q560 290 640 310 Q720 270 800 300 Q880 260 960 290 L1000 310 L1000 480 L0 480 Z"
          fill="#1A3D7C"
          opacity="0.35"
        />

        {/* ═══ LAYER 3: Main Mountain with Brand Gradient ═══ */}
        <path
          d="M200 500 L320 320 L380 360 L440 240 L480 280 L520 160 L560 200 L600 140 L640 190 L680 160 L720 250 L760 220 L820 340 L860 300 L920 420 L1000 500 Z"
          fill="url(#mountain-brand)"
        />
        {/* Ridgeline stroke */}
        <path
          d="M200 500 L320 320 L380 360 L440 240 L480 280 L520 160 L560 200 L600 140 L640 190 L680 160 L720 250 L760 220 L820 340 L860 300 L920 420 L1000 500"
          fill="none"
          stroke="#1C1814"
          strokeWidth="1.5"
          opacity="0.2"
        />

        {/* Snow patches near summit */}
        {snowOnPeaks && (
          <>
            <path d="M590 155 L600 140 L610 150 L605 148 Z" fill="white" opacity="0.5" />
            <path d="M670 170 L680 160 L690 168 Z" fill="white" opacity="0.4" />
            <path d="M510 170 L520 160 L530 165 Z" fill="white" opacity="0.35" />
          </>
        )}

        {/* Secondary peak (left) with partial gradient */}
        <path
          d="M0 500 L60 400 L100 420 L140 340 L180 380 L220 300 L260 360 L300 420 L340 500 Z"
          fill="#1A3D7C"
          opacity="0.5"
        />

        {/* ═══ LAYER 2: Trail & Camps ═══ */}
        {/* Full trail path (dashed) */}
        {trailPathD && (
          <path
            d={trailPathD}
            fill="none"
            stroke="#8B7355"
            strokeWidth="2"
            strokeDasharray="8 6"
            opacity="0.4"
          />
        )}
        {/* Completed trail (solid cobalt) */}
        {completedTrailD && (
          <path
            d={completedTrailD}
            fill="none"
            stroke="#1A3D7C"
            strokeWidth="2.5"
            opacity="0.8"
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
              {isActive && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="14"
                  fill="none"
                  stroke="#D9511C"
                  strokeWidth="1.5"
                  opacity="0.4"
                  className="camp-active-pulse"
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 6 : isCompleted ? 5 : 5}
                fill={isCompleted ? '#1A3D7C' : isActive ? '#D9511C' : 'rgba(139,115,85,0.3)'}
                stroke={isCompleted ? '#15326a' : isActive ? '#c44818' : 'rgba(139,115,85,0.2)'}
                strokeWidth="1.5"
                strokeDasharray={!isCompleted && !isActive ? '2 2' : 'none'}
              />
              {isCompleted && (
                <path
                  d={`M${pos.x - 2.5} ${pos.y} L${pos.x - 0.5} ${pos.y + 2.5} L${pos.x + 3} ${pos.y - 2}`}
                  fill="none"
                  stroke="#F4EDE0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {(isActive || isCompleted) && (
                <text
                  x={pos.x}
                  y={pos.y - 14}
                  textAnchor="middle"
                  fill="#F4EDE0"
                  fontSize="10"
                  fontFamily="'Courier New', monospace"
                  opacity="0.65"
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

        {/* ═══ LAYER 1: Foreground Terrain ═══ */}
        <path
          d="M0 540 Q100 520 200 535 Q300 510 400 530 Q500 515 600 525 Q700 510 800 530 Q900 520 1000 535 L1000 625 L0 625 Z"
          fill="url(#foreground-grad)"
        />
        {/* Foreground rocks/vegetation details */}
        <ellipse cx="120" cy="560" rx="30" ry="12" fill="#2C2418" opacity="0.6" />
        <ellipse cx="380" cy="555" rx="25" ry="10" fill="#2C2418" opacity="0.5" />
        <ellipse cx="750" cy="558" rx="35" ry="14" fill="#2C2418" opacity="0.55" />
        <ellipse cx="900" cy="562" rx="20" ry="8" fill="#2C2418" opacity="0.45" />

        {/* Fog layer between foreground and mountain */}
        <rect x="0" y="490" width={WIDTH} height="60" fill="#F4EDE0" opacity="0.06">
          <animate attributeName="x" values="0;-40;0" dur="20s" repeatCount="indefinite" />
        </rect>
      </svg>

      {/* Weather overlays */}
      <WeatherLayer weatherState={weatherState} />
    </div>
  )
})

export default MountainScene
