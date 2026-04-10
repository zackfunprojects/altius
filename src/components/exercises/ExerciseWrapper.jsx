import { useState, useCallback, lazy, Suspense } from 'react'
import { evaluateExercise } from '../../lib/sherpa'
import ExerciseStatusBar from './ExerciseStatusBar'
import MultipleChoiceLedge from '../ledges/MultipleChoiceLedge'
import ShortAnswerLedge from '../ledges/ShortAnswerLedge'
import WritingEditorLedge from '../ledges/WritingEditorLedge'
import DragSequenceLedge from '../ledges/DragSequenceLedge'
import TimelineEditorLedge from '../ledges/TimelineEditorLedge'
import CanvasLayoutLedge from '../ledges/CanvasLayoutLedge'
import ConversationSimLedge from '../ledges/ConversationSimLedge'
import FileUploadLedge from '../ledges/FileUploadLedge'
import VoiceResponseLedge from '../ledges/VoiceResponseLedge'

const CodeEditorLedge = lazy(() => import('../ledges/CodeEditorLedge'))

export default function ExerciseWrapper({ spec, exerciseIndex, sectionId, trekId, onExerciseComplete, priorResponses }) {
  const priorPassed = Array.isArray(priorResponses) && priorResponses.some((r) => r.passed)
  const priorFeedback = priorPassed
    ? priorResponses.find((r) => r.passed)?.evaluation
    : null

  const [status, setStatus] = useState(priorPassed ? 'passed' : 'idle')
  const [feedback, setFeedback] = useState(priorFeedback || null)
  const [attempts, setAttempts] = useState(
    Array.isArray(priorResponses) ? priorResponses.length : 0
  )
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [userResponse, setUserResponse] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  const handleResponseChange = useCallback((response) => {
    setUserResponse(response)
  }, [])

  if (!spec) return null

  const exerciseType = spec.exercise_type

  const handleSubmit = async () => {
    if (!userResponse || status === 'submitting') return

    setStatus('submitting')

    try {
      const result = await evaluateExercise({
        exerciseSpec: spec,
        userResponse,
        attemptNumber: attempts + 1,
        exerciseIndex: exerciseIndex ?? 0,
        sectionId,
        trekId,
      })

      setFeedback(result)
      setAttempts((prev) => prev + 1)

      if (result.passed) {
        setStatus('passed')
        if (onExerciseComplete) {
          onExerciseComplete({ passed: true, attemptNumber: attempts + 1, exerciseIndex })
        }
      } else {
        setStatus('failed')
      }
    } catch (err) {
      console.error('Exercise evaluation failed:', err)
      setStatus('failed')
      setFeedback({
        passed: false,
        feedback: 'Something went wrong evaluating your response. Please try again.',
        hints_for_retry: [],
      })
    }
  }

  const handleRetry = () => {
    setUserResponse(null)
    setFeedback(null)
    setStatus('idle')
    setRetryKey(prev => prev + 1)
  }

  const handleRequestHint = () => {
    if (feedback?.hints_for_retry && hintsRevealed < feedback.hints_for_retry.length) {
      setHintsRevealed((prev) => prev + 1)
    }
  }

  const isSubmitDisabled =
    status === 'submitting' ||
    status === 'passed' ||
    !userResponse

  const totalHints = feedback?.hints_for_retry?.length || 0

  const renderLedge = () => {
    const ledgeDisabled = status === 'passed' || status === 'submitting'

    switch (exerciseType) {
      case 'multiple_choice':
        return (
          <MultipleChoiceLedge
            spec={spec}
            onResponseChange={handleResponseChange}
            disabled={ledgeDisabled}
            result={status === 'passed' || status === 'failed' ? feedback : null}
          />
        )
      case 'short_answer':
        return (
          <ShortAnswerLedge
            spec={spec}
            onResponseChange={handleResponseChange}
            disabled={ledgeDisabled}
          />
        )
      case 'writing_prompt':
        return (
          <WritingEditorLedge
            spec={spec}
            onResponseChange={handleResponseChange}
            disabled={ledgeDisabled}
          />
        )
      case 'drag_sequence':
        return (
          <DragSequenceLedge
            spec={spec}
            onResponseChange={handleResponseChange}
            disabled={ledgeDisabled}
          />
        )
      case 'code_editor':
        return (
          <Suspense fallback={
            <div className="py-6 text-center text-xs font-ui text-trail-brown">
              Loading editor...
            </div>
          }>
            <CodeEditorLedge
              spec={spec}
              onResponseChange={handleResponseChange}
              disabled={ledgeDisabled}
            />
          </Suspense>
        )
      case 'timeline_editor':
        return (
          <TimelineEditorLedge
            spec={spec}
            onResponseChange={handleResponseChange}
            disabled={ledgeDisabled}
          />
        )
      case 'canvas_layout':
        return (
          <CanvasLayoutLedge
            spec={spec}
            onResponseChange={handleResponseChange}
            disabled={ledgeDisabled}
          />
        )
      case 'conversation_sim':
        return (
          <ConversationSimLedge
            spec={spec}
            onResponseChange={handleResponseChange}
            disabled={ledgeDisabled}
          />
        )
      case 'file_upload':
        return <FileUploadLedge spec={spec} onResponseChange={handleResponseChange} disabled />
      case 'voice_response':
        return <VoiceResponseLedge spec={spec} onResponseChange={handleResponseChange} disabled />
      default:
        return (
          <p className="text-sm font-ui text-trail-brown italic">
            Unknown exercise type: {exerciseType}
          </p>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg border border-trail-brown/15 overflow-hidden">
      {/* Signal-orange accent bar */}
      <div className="flex">
        <div className="w-1 bg-signal-orange shrink-0" />

        <div className="flex-1 p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-signal-orange/15 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V6L8.5 7.5" stroke="#D9511C" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-ui font-medium text-signal-orange uppercase tracking-wider">
              Practice
            </span>
          </div>

          {/* Prompt / instructions */}
          {spec.prompt && (
            <p className="font-body text-ink mb-4">{spec.prompt}</p>
          )}

          {/* Ledge component */}
          <div className="mb-3">
            <div key={retryKey}>{renderLedge()}</div>
          </div>

          {/* Status bar */}
          <ExerciseStatusBar
            attempts={attempts + (status === 'idle' ? 1 : 0)}
            status={status}
            hintsRevealed={hintsRevealed}
            totalHints={totalHints}
            onRequestHint={handleRequestHint}
          />

          {/* Hints */}
          {hintsRevealed > 0 && feedback?.hints_for_retry && (
            <div className="mt-2 space-y-1.5">
              {feedback.hints_for_retry.slice(0, hintsRevealed).map((hint, i) => (
                <div
                  key={i}
                  className="px-3 py-2 bg-summit-cobalt/5 border border-summit-cobalt/15 rounded-md text-xs font-ui text-ink"
                >
                  <span className="font-medium text-summit-cobalt">Hint {i + 1}:</span>{' '}
                  {hint}
                </div>
              ))}
            </div>
          )}

          {/* Feedback */}
          {feedback && status !== 'idle' && (
            <div className={`mt-3 px-4 py-3 rounded-md text-sm font-body ${
              feedback.passed
                ? 'bg-phosphor-green/10 text-ink'
                : 'bg-terminal-dark'
            }`}>
              {feedback.passed ? (
                <p>{feedback.feedback || 'Well done. Moving forward.'}</p>
              ) : (
                <div className="font-mono text-phosphor-green text-xs leading-relaxed">
                  {feedback.feedback}
                </div>
              )}
            </div>
          )}

          {/* Submit / Retry */}
          <div className="mt-4">
            {status === 'failed' ? (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-signal-orange text-white font-ui font-medium rounded-md text-sm hover:bg-signal-orange/90 transition-colors"
              >
                Try Again
              </button>
            ) : status !== 'passed' ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="px-4 py-2 bg-signal-orange text-white font-ui font-medium rounded-md text-sm hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
              >
                {status === 'submitting' ? 'Evaluating...' : 'Submit'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
