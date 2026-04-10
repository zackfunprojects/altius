import { useState } from 'react'

export default function ShortAnswerLedge({ spec, onResponseChange, disabled }) {
  const [text, setText] = useState('')

  if (!spec) return null

  const minLength = spec.min_length || 0
  const maxLength = spec.max_length || 0
  const charCount = text.length

  const handleChange = (e) => {
    const value = maxLength ? e.target.value.slice(0, maxLength) : e.target.value
    setText(value)
    onResponseChange({ text: value })
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Your answer..."
        className="w-full h-24 px-3 py-2 font-body text-sm text-ink bg-catalog-cream border border-trail-brown/20 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-summit-cobalt/40"
      />

      <div className="flex items-center justify-between mt-1.5">
        {minLength > 0 && charCount < minLength && (
          <span className="text-xs font-ui text-trail-brown">
            Minimum {minLength} characters
          </span>
        )}

        {maxLength > 0 && (
          <span className={`text-xs font-ui ml-auto ${
            charCount >= maxLength ? 'text-signal-orange' : 'text-trail-brown'
          }`}>
            {charCount} / {maxLength}
          </span>
        )}
      </div>
    </div>
  )
}
