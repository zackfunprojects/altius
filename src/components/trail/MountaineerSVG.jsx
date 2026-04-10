import { m as Motion } from 'framer-motion'

const BADGE_COLORS = [
  '#1A3D7C', // summit-cobalt
  '#5C2D82', // fitz-violet
  '#D9511C', // signal-orange
  '#D4960B', // alpine-gold
  '#4ADE80', // phosphor-green
  '#8B7355', // trail-brown
]

/**
 * 32x32 pixel-art mountaineer character rendered as SVG.
 * Skill badges from completed treks displayed alongside.
 */
export default function MountaineerSVG({ x = 0, y = 0, badges = [], scale = 1.5 }) {
  const size = 32 * scale

  return (
    <Motion.g
      animate={{ x, y: y - size }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
    >
      <Motion.g
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <g transform={`scale(${scale})`} shapeRendering="crispEdges">
          {/* Hat */}
          <rect x="11" y="2" width="10" height="3" fill="#D4960B" />
          <rect x="9" y="5" width="14" height="2" fill="#D4960B" />

          {/* Head */}
          <rect x="11" y="7" width="10" height="8" fill="#E8C89E" />
          {/* Eyes */}
          <rect x="13" y="10" width="2" height="2" fill="#1C1814" />
          <rect x="18" y="10" width="2" height="2" fill="#1C1814" />

          {/* Body / Jacket */}
          <rect x="9" y="15" width="14" height="8" fill="#D9511C" />
          {/* Jacket detail */}
          <rect x="15" y="15" width="2" height="8" fill="#C44818" />

          {/* Backpack */}
          <rect x="5" y="16" width="4" height="6" fill="#8B7355" />
          <rect x="6" y="17" width="2" height="4" fill="#7A6548" />

          {/* Arms */}
          <rect x="7" y="16" width="2" height="6" fill="#E8C89E" />
          <rect x="23" y="16" width="2" height="6" fill="#E8C89E" />

          {/* Legs */}
          <rect x="11" y="23" width="4" height="6" fill="#2C2418" />
          <rect x="17" y="23" width="4" height="6" fill="#2C2418" />

          {/* Boots */}
          <rect x="10" y="29" width="5" height="3" fill="#1C1814" />
          <rect x="17" y="29" width="5" height="3" fill="#1C1814" />

          {/* Hiking stick */}
          <rect x="25" y="12" width="2" height="18" fill="#8B7355" />
          <rect x="24" y="11" width="4" height="2" fill="#D4960B" />
        </g>

        {/* Skill badges */}
        {badges.slice(0, 6).map((badge, i) => {
          const col = Math.floor(i / 3)
          const row = i % 3
          const bx = -12 * scale + col * 8 * scale
          const by = 4 * scale + row * 8 * scale
          const color = badge?.color || BADGE_COLORS[i % BADGE_COLORS.length]

          return (
            <g key={i}>
              <circle
                cx={bx}
                cy={by}
                r={3 * scale}
                fill={color}
                stroke="#1C1814"
                strokeWidth={0.5 * scale}
              />
              {badge?.icon === 'camera' && (
                <rect x={bx - 1.5 * scale} y={by - 1 * scale} width={3 * scale} height={2 * scale} fill="#F4EDE0" rx={0.5} />
              )}
            </g>
          )
        })}
      </Motion.g>
    </Motion.g>
  )
}
