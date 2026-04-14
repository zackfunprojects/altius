export default function FourColorBar({ height = 'h-1', className = '' }) {
  return (
    <div className={`flex ${height} w-full ${className}`}>
      <div className="flex-1 bg-summit-cobalt" />
      <div className="flex-1 bg-fitz-violet" />
      <div className="flex-1 bg-signal-orange" />
      <div className="flex-1 bg-alpine-gold" />
    </div>
  )
}
