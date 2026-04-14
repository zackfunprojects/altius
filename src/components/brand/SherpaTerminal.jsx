export default function SherpaTerminal({ children, label = 'THE SHERPA', className = '' }) {
  return (
    <div className={`bg-terminal-dark rounded-lg p-5 border border-phosphor-green/15 crt-scanlines crt-vignette overflow-hidden ${className}`}>
      {label && (
        <p className="font-ui font-semibold text-[9px] uppercase tracking-[0.12em] text-phosphor-green phosphor-glow mb-3">
          {label}
        </p>
      )}
      <div className="font-mono text-catalog-cream/80 italic text-sm leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  )
}
