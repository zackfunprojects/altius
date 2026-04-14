import { useState, useCallback, lazy, Suspense } from 'react'
import { evaluateExercise } from '../../lib/sherpa'
import ExerciseStatusBar from './ExerciseStatusBar'
import FourColorBar from '../brand/FourColorBar'
import SherpaTerminal from '../brand/SherpaTerminal'
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
    <div className="bg-cream-light rounded-lg border border-trail-brown/15 overflow-hidden">
      {/* FourColorBar accent */}
      <FourColorBar height="h-[3px]" />

      <div className="p-5">
        {/* Header */}
        <p className="font-ui font-medium text-[9px] uppercase tracking-[0.12em] text-summit-cobalt mb-3">
          Practice Ledge
        </p>

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
          feedback.passed ? (
            <div className="mt-3 px-4 py-3 rounded-md bg-phosphor-green/10 text-sm font-body text-ink">
              <p>{feedback.feedback || 'Well done. Moving forward.'}</p>
            </div>
          ) : (
            <div className="mt-3">
              <SherpaTerminal>
                {feedback.feedback}
              </SherpaTerminal>
            </div>
          )
        )}

        {/* Submit / Retry */}
        <div className="mt-4">
          {status === 'failed' ? (
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 bg-signal-orange text-catalog-cream font-ui font-semibold rounded-lg text-sm hover:bg-signal-orange/90 transition-colors"
            >
              Try Again
            </button>
          ) : status !== 'passed' ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="px-5 py-2.5 bg-signal-orange text-catalog-cream font-ui font-semibold rounded-lg text-sm hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
            >
              {status === 'submitting' ? 'Evaluating...' : `Submit (+15 ft)`}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
