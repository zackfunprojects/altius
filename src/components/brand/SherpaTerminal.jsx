export default function SherpaTerminal({ children }) {
  return (
    <div className="bg-terminal-dark rounded-lg p-5 crt-scanlines crt-vignette overflow-hidden">
      <div className="font-mono text-phosphor-green phosphor-glow text-sm leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  )
}
