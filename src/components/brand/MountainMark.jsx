export default function MountainMark({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Altius mountain mark"
    >
      <defs>
        <linearGradient id="mountain-sunset" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D9511C" />
          <stop offset="50%" stopColor="#D4960B" />
          <stop offset="100%" stopColor="#1A3D7C" />
        </linearGradient>
      </defs>
      <path
        d="M24 4L4 44H44L24 4Z"
        fill="url(#mountain-sunset)"
      />
      <path
        d="M24 4L4 44H44L24 4Z"
        fill="none"
        stroke="#1C1814"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 32L22 24L26 28L32 20"
        stroke="#F4EDE0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  )
}
