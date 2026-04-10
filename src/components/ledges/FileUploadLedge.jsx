export default function FileUploadLedge() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 border-2 border-dashed border-trail-brown/30 rounded-lg bg-catalog-cream/50">
      <svg className="w-10 h-10 text-trail-brown/40 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 16V4M12 4L8 8M12 4L16 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 16V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm font-ui text-trail-brown/60 text-center">
        File upload exercises will be available in a future update.
      </p>
    </div>
  )
}
