export default function CRTBezel({ children, className = '' }) {
  return (
    <div
      className={`rounded-xl p-3 sm:p-4 ${className}`}
      style={{
        background: 'linear-gradient(180deg, #2C2418 0%, #1C1814 100%)',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      <div className="bg-terminal-dark rounded-lg overflow-hidden relative crt-scanlines crt-vignette">
        {children}
      </div>
    </div>
  )
}
