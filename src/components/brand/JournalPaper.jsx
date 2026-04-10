export default function JournalPaper({ children, className = '' }) {
  return (
    <div className={`journal-paper rounded-lg p-6 border border-trail-brown/20 ${className}`}>
      <div className="font-body text-ink leading-relaxed">
        {children}
      </div>
    </div>
  )
}
