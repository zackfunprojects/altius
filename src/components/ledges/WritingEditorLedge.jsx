import { useState } from 'react'

export default function WritingEditorLedge({ spec, onResponseChange, disabled }) {
  const [text, setText] = useState('')

  if (!spec) return null

  const constraints = spec.constraints || {}
  const minWords = constraints.min_words || 0
  const maxWords = constraints.max_words || 0

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const handleChange = (e) => {
    setText(e.target.value)
    onResponseChange({ text: e.target.value })
  }

  return (
    <div>
      <div className="journal-paper rounded-lg border border-trail-brown/20 overflow-hidden">
        <textarea
          value={text}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Write your response..."
          className="w-full h-40 px-5 py-4 font-body text-ink bg-transparent border-none resize-none focus:outline-none leading-relaxed"
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        {minWords > 0 && (
          <span className={`text-xs font-ui ${
            wordCount < minWords ? 'text-trail-brown' : 'text-phosphor-green'
          }`}>
            {wordCount} / {minWords} words minimum
          </span>
        )}

        {maxWords > 0 && (
          <span className={`text-xs font-ui ml-auto ${
            wordCount > maxWords ? 'text-signal-orange' : 'text-trail-brown'
          }`}>
            {wordCount} / {maxWords} words
          </span>
        )}

        {!minWords && !maxWords && (
          <span className="text-xs font-ui text-trail-brown">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        )}
      </div>
    </div>
  )
}
