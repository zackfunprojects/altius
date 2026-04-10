import { useState } from 'react'

export default function MultipleChoiceLedge({ spec, onResponseChange, disabled, result }) {
  const [selected, setSelected] = useState(null)

  if (!spec) return null

  const options = Array.isArray(spec.options) ? spec.options : []

  const handleSelect = (optionId) => {
    if (disabled) return
    setSelected(optionId)
    onResponseChange({ selected_option_id: optionId })
  }

  const getOptionStyle = (option) => {
    const optionId = option.id || option.text

    if (result) {
      const isCorrect = optionId === spec.correct_answer || option.is_correct
      const isSelected = optionId === selected

      if (isCorrect) {
        return 'bg-phosphor-green/10 border-phosphor-green text-ink'
      }
      if (isSelected && !result.passed) {
        return 'bg-signal-orange/10 border-signal-orange text-ink'
      }
      return 'border-trail-brown/20 text-trail-brown opacity-60'
    }

    if (optionId === selected) {
      return 'bg-summit-cobalt/10 border-summit-cobalt text-ink'
    }

    return 'border-trail-brown/20 hover:border-trail-brown/40 text-trail-brown'
  }

  return (
    <div>
      {spec.question && (
        <p className="font-body text-ink mb-3">{spec.question}</p>
      )}

      <div className="space-y-2">
        {options.map((option, i) => {
          const optionId = option.id || option.text || `option-${i}`
          const optionText = option.text || option

          return (
            <button
              key={optionId}
              onClick={() => handleSelect(optionId)}
              disabled={disabled}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-ui transition-colors ${getOptionStyle(option)}`}
            >
              {optionText}
            </button>
          )
        })}
      </div>

      {result && spec.explanation && (
        <p className="mt-3 text-sm font-body text-trail-brown italic">
          {spec.explanation}
        </p>
      )}
    </div>
  )
}
