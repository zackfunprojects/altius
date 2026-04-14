import { useState } from 'react'

export default function ExerciseBlock({ spec, onExerciseComplete }) {
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(null)

  if (!spec) return null

  const isMultipleChoice = spec.exercise_type === 'multiple_choice'
  const isShortAnswer = spec.exercise_type === 'short_answer'
  const isWritingPrompt = spec.exercise_type === 'writing_prompt'
  const options = Array.isArray(spec.options) ? spec.options : []

  const handleSubmit = () => {
    if (isMultipleChoice && selectedOption !== null) {
      const isCorrect = options[selectedOption] === spec.correct_answer
      setCorrect(isCorrect)
      setSubmitted(true)
      if (isCorrect && onExerciseComplete) onExerciseComplete()
    } else if ((isShortAnswer || isWritingPrompt) && answer.trim()) {
      // For Phase 4, short answer and writing prompts are auto-passed
      // Full AI evaluation comes in Phase 6
      setCorrect(true)
      setSubmitted(true)
      if (onExerciseComplete) onExerciseComplete()
    }
  }

  return (
    <div className="bg-cream-light rounded-lg border border-trail-brown/15 overflow-hidden">
      <div className="flex h-[3px]"><div className="flex-1 bg-summit-cobalt" /><div className="flex-1 bg-fitz-violet" /><div className="flex-1 bg-signal-orange" /><div className="flex-1 bg-alpine-gold" /></div>
      <div className="p-5">
      <p className="font-ui font-medium text-[9px] uppercase tracking-[0.12em] text-summit-cobalt mb-3">
        Practice Ledge
      </p>

      <p className="font-body text-ink mb-4">{spec.prompt}</p>

      {isMultipleChoice && options.length > 0 && (
        <div className="space-y-2 mb-4">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => !submitted && setSelectedOption(i)}
              disabled={submitted}
              className={`w-full text-left px-4 py-2.5 rounded-md border text-sm font-ui transition-colors ${
                submitted && options[i] === spec.correct_answer
                  ? 'bg-phosphor-green/10 border-phosphor-green text-ink'
                  : submitted && selectedOption === i && !correct
                    ? 'bg-signal-orange/10 border-signal-orange text-ink'
                    : selectedOption === i
                      ? 'bg-summit-cobalt/10 border-summit-cobalt text-ink'
                      : 'border-trail-brown/20 hover:border-trail-brown/40 text-trail-brown'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {(isShortAnswer || isWritingPrompt) && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={submitted}
          placeholder={isWritingPrompt ? 'Write your response...' : 'Your answer...'}
          className={`w-full px-3 py-2 font-body text-sm text-ink bg-catalog-cream border border-trail-brown/20 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-summit-cobalt/40 mb-4 ${
            isWritingPrompt ? 'h-32' : 'h-20'
          }`}
        />
      )}

      {submitted ? (
        <div className={`px-4 py-3 rounded-md text-sm font-body ${
          correct
            ? 'bg-phosphor-green/10 text-ink'
            : 'bg-signal-orange/10 text-ink'
        }`}>
          {correct ? (
            <p>Well done. Moving forward.</p>
          ) : (
            <>
              <p className="mb-1">Not quite. Try considering the problem differently.</p>
              {spec.rubric && (
                <p className="text-xs text-trail-brown mt-2 italic">{spec.rubric}</p>
              )}
              <button
                onClick={() => {
                  setSubmitted(false)
                  setCorrect(null)
                  setSelectedOption(null)
                  setAnswer('')
                }}
                className="mt-2 text-xs font-ui font-medium text-signal-orange hover:text-signal-orange/80 transition-colors"
              >
                Try again
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={isMultipleChoice ? selectedOption === null : !answer.trim()}
          className="px-5 py-2.5 bg-signal-orange text-catalog-cream font-ui font-semibold rounded-lg text-sm hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
        >
          Submit (+15 ft)
        </button>
      )}
      </div>
    </div>
  )
}
