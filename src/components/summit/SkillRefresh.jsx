import { useState, useCallback } from 'react'
import { refreshSkill } from '../../lib/sherpa'
import SherpaTerminal from '../brand/SherpaTerminal'

/**
 * Skill Refresh: generates and displays quick review exercises for a completed trek.
 * Pro tier only.
 */
export default function SkillRefresh({ entry, onClose, subscriptionTier }) {
  const [loading, setLoading] = useState(false)
  const [exercises, setExercises] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState(null)

  const isPro = subscriptionTier === 'pro'

  const handleGenerate = useCallback(async () => {
    if (!entry?.id || loading) return
    setLoading(true)
    setError(null)

    try {
      const result = await refreshSkill({ notebookEntryId: entry.id })
      setExercises(result.exercises || [])
      setCurrentIndex(0)
      setAnswers({})
    } catch (err) {
      setError(err.message || 'Failed to generate review exercises.')
    } finally {
      setLoading(false)
    }
  }, [entry, loading])

  const currentExercise = exercises?.[currentIndex]

  const handleAnswer = useCallback((answer) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: answer }))
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < (exercises?.length || 0) - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, exercises])

  if (!isPro) {
    return (
      <div className="p-6 text-center">
        <SherpaTerminal>
          {'>'} Skill Refresh requires a Pro subscription.{'\n'}
          {'>'} Keep your skills sharp with spaced review exercises.
        </SherpaTerminal>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm font-ui text-trail-brown hover:text-ink transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  if (!exercises) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="font-body text-sm text-ink">
          Generate quick review exercises for <strong>{entry.skill_name}</strong> to test your recall.
        </p>
        {error && <p className="text-sm text-signal-orange">{error}</p>}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 bg-summit-cobalt text-white font-ui font-semibold text-sm rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Start Refresh'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-ui text-trail-brown hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (!currentExercise) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="font-display text-xl text-ink">Refresh Complete</p>
        <p className="font-body text-sm text-trail-brown">
          You reviewed {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} for {entry.skill_name}.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-phosphor-green text-terminal-dark font-ui font-bold text-sm rounded-lg hover:bg-phosphor-green/90 transition-colors"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-ui text-trail-brown/60">
          {currentIndex + 1} / {exercises.length}
        </p>
        <button onClick={onClose} className="text-xs font-ui text-trail-brown/50 hover:text-ink">
          Close
        </button>
      </div>

      {/* Exercise */}
      <p className="font-body text-sm text-ink leading-relaxed">
        {currentExercise.prompt}
      </p>

      {/* Simple answer UI based on type */}
      {currentExercise.type === 'multiple_choice' && currentExercise.spec?.options && (
        <div className="space-y-2">
          {currentExercise.spec.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-body transition-colors ${
                answers[currentIndex] === opt.id
                  ? opt.id === currentExercise.spec.correct_answer
                    ? 'border-phosphor-green bg-phosphor-green/10 text-ink'
                    : 'border-signal-orange bg-signal-orange/10 text-ink'
                  : 'border-trail-brown/15 hover:border-summit-cobalt/30'
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {currentExercise.type === 'short_answer' && (
        <div>
          <input
            value={answers[currentIndex] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-4 py-2.5 border border-trail-brown/20 rounded-lg font-body text-sm focus:outline-none focus:border-summit-cobalt/50"
          />
        </div>
      )}

      {/* Next button */}
      {answers[currentIndex] !== undefined &&
        (currentExercise.type !== 'short_answer' || answers[currentIndex]?.trim()) && (
        <button
          onClick={currentIndex < exercises.length - 1 ? handleNext : onClose}
          className="w-full py-2.5 bg-summit-cobalt text-white font-ui font-semibold text-sm rounded-lg hover:bg-summit-cobalt/90 transition-colors"
        >
          {currentIndex < exercises.length - 1 ? 'Next' : 'Finish'}
        </button>
      )}
    </div>
  )
}
