const sizeMap = {
  sm: 24,
  md: 48,
  lg: 72,
}

export default function MountainMark({ size = 'md', className = '' }) {
  const px = typeof size === 'number' ? size : (sizeMap[size] || 48)
  const showRidgeline = px >= 24

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Altius mountain mark"
      className={className}
    >
      <defs>
        <linearGradient id="mountain-sunset" x1="24" y1="6" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A3D7C" />
          <stop offset="35%" stopColor="#5C2D82" />
          <stop offset="65%" stopColor="#D9511C" />
          <stop offset="100%" stopColor="#D4960B" />
        </linearGradient>
      </defs>

      {/* Mountain silhouette - naturalistic ridge profile */}
      <path
        d="M24 6L20 14L17 12L12 20L9 18L4 32L2 44H46L44 32L40 22L37 24L32 16L29 18L26 12L24 6Z"
        fill="url(#mountain-sunset)"
      />

      {/* Ink ridgeline stroke */}
      {showRidgeline && (
        <path
          d="M24 6L20 14L17 12L12 20L9 18L4 32L2 44M24 6L26 12L29 18L32 16L37 24L40 22L44 32L46 44"
          fill="none"
          stroke="#1C1814"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.3"
        />
      )}

      {/* Snow patches near summit */}
      <path
        d="M22 10L24 6L26 10L24.5 9Z"
        fill="white"
        opacity="0.4"
      />
      <path
        d="M19 15L20 14L21 15.5Z"
        fill="white"
        opacity="0.3"
      />
    </svg>
  )
}
