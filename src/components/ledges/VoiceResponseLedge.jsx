export default function VoiceResponseLedge() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 border-2 border-dashed border-trail-brown/30 rounded-lg bg-catalog-cream/50">
      <div className="w-12 h-12 rounded-full border-2 border-trail-brown/30 flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-trail-brown/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 19V22M12 22H9M12 22H15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-ui text-trail-brown/60 text-center">
        Voice response exercises will be available in a future update.
      </p>
    </div>
  )
}
