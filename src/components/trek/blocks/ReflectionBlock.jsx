import { useState } from 'react'

export default function ReflectionBlock({ prompt, onReflectionSubmit }) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleSubmit = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      if (onReflectionSubmit) await onReflectionSubmit(text.trim())
      setSubmitted(true)
    } catch {
      setSaveError('Failed to save reflection. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="journal-paper rounded-lg p-5 border border-trail-brown/20">
      <p className="text-xs font-ui font-medium text-trail-brown/60 uppercase tracking-wider mb-2">
        Trail Reflection
      </p>
      <p className="font-body text-ink italic mb-4">{prompt}</p>
      {submitted ? (
        <div className="bg-catalog-cream rounded-md p-3">
          <p className="font-body text-sm text-trail-brown">{text}</p>
          <p className="text-xs font-ui text-phosphor-green mt-2">Saved to your journal.</p>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Take a moment to think..."
            className="w-full h-24 px-3 py-2 font-body text-sm text-ink bg-white border border-trail-brown/15 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-summit-cobalt/40"
          />
          {saveError && (
            <p className="text-xs font-ui text-signal-orange mt-1">{saveError}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || saving}
            className="mt-2 px-3 py-1.5 text-xs font-ui font-medium bg-summit-cobalt text-white rounded-md hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Reflection'}
          </button>
        </>
      )}
    </div>
  )
}
