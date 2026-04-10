export default function SherpaTextBlock({ content }) {
  return (
    <div className="bg-terminal-dark rounded-lg p-5 border-l-3 border-summit-cobalt crt-scanlines overflow-hidden">
      <div className="font-mono text-phosphor-green/90 text-sm leading-relaxed whitespace-pre-wrap italic">
        {content}
      </div>
    </div>
  )
}
