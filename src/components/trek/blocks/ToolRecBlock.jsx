export default function ToolRecBlock({ spec }) {
  if (!spec) return null

  return (
    <div className="bg-white rounded-lg border border-trail-brown/15 p-4 flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-md bg-alpine-gold/10 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L3 5V11L8 14L13 11V5L8 2Z" stroke="#D4960B" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M8 14V8" stroke="#D4960B" strokeWidth="1.2"/>
          <path d="M13 5L8 8L3 5" stroke="#D4960B" strokeWidth="1.2"/>
        </svg>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-ui font-medium text-sm text-ink">{spec.name}</p>
          <span
            className={`text-xs font-ui px-1.5 py-0.5 rounded ${
              spec.free
                ? 'bg-phosphor-green/10 text-phosphor-green'
                : 'bg-alpine-gold/10 text-alpine-gold'
            }`}
          >
            {spec.free ? 'Free' : 'Paid'}
          </span>
        </div>
        {spec.description && (
          <p className="font-body text-sm text-trail-brown mt-1">{spec.description}</p>
        )}
        {spec.url && (
          <a
            href={spec.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-ui text-summit-cobalt hover:underline mt-1 inline-block"
          >
            Learn more
          </a>
        )}
      </div>
    </div>
  )
}
