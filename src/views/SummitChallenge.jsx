import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { useProfile } from '../hooks/useProfile'
import { evaluateSummit } from '../lib/sherpa'
import { completeTrek } from '../lib/trek'
import FourColorBar from '../components/brand/FourColorBar'
import WordMark from '../components/brand/WordMark'
import ElevationCounter from '../components/brand/ElevationCounter'
import SherpaTerminal from '../components/brand/SherpaTerminal'
import JournalPaper from '../components/brand/JournalPaper'
import DifficultyBadge from '../components/brand/DifficultyBadge'
import RubricDisplay from '../components/summit/RubricDisplay'
import PageTitle from '../components/ui/PageTitle'

export default function SummitChallenge() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { trek, camps, loading: trekLoading } = useActiveTrek()

  const [deliverableText, setDeliverableText] = useState('')
  const [deliverableUrl, setDeliverableUrl] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [evalError, setEvalError] = useState(null)
  const [result, setResult] = useState(null)
  const [recording, setRecording] = useState(false)

  const allCampsComplete = useMemo(() => {
    if (!camps?.length) return false
    return camps.every(c => c.status === 'completed')
  }, [camps])

  const summitChallenge = trek?.summit_challenge || {}
  const rubric = Array.isArray(summitChallenge.rubric) ? summitChallenge.rubric : []

  const handleSubmit = useCallback(async () => {
    if (!trek?.id || !deliverableText.trim() || evaluating) return
    setEvaluating(true)
    setEvalError(null)
    setResult(null)

    try {
      const evaluation = await evaluateSummit({
        trekId: trek.id,
        deliverableUrl: deliverableUrl.trim() || null,
        deliverableText: deliverableText.trim(),
      })
      setResult(evaluation)
    } catch (err) {
      setEvalError(err.message || 'Failed to evaluate. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }, [trek, deliverableText, deliverableUrl, evaluating])

  const handleRecord = useCallback(async () => {
    if (!trek?.id || recording) return
    setRecording(true)
    try {
      await completeTrek(trek.id)
      navigate('/notebook')
    } catch (err) {
      console.error('Failed to record summit:', err)
      setEvalError('Your summit was evaluated successfully, but recording failed. Please try the "Record" button again.')
      setRecording(false)
    }
  }, [trek, recording, navigate])

  const handleRetry = useCallback(() => {
    setResult(null)
    setEvalError(null)
  }, [])

  // Loading
  if (trekLoading) {
    return (
      <div className="min-h-screen bg-catalog-cream flex items-center justify-center">
        <p className="font-mono text-trail-brown text-sm">Loading summit...</p>
      </div>
    )
  }

  // Guard: no trek or camps not complete
  if (!trek || !allCampsComplete) {
    return (
      <div className="min-h-screen bg-catalog-cream flex flex-col">
        <FourColorBar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <SherpaTerminal>
              {trek
                ? '> You have not completed all camps yet. Return to the trail and finish the work.'
                : '> No active trek. The summit waits for those who climb.'}
            </SherpaTerminal>
            <button
              onClick={() => navigate(trek ? '/learn' : '/')}
              className="mt-6 px-6 py-2.5 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors text-sm"
            >
              {trek ? 'Return to Trail' : 'Go Home'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-catalog-cream flex flex-col">
      <PageTitle title="Summit Challenge" />
      <FourColorBar />

      {/* Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-trail-brown/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/learn')}
            className="text-sm font-ui text-trail-brown hover:text-ink transition-colors"
          >
            &larr; Back
          </button>
          <WordMark size="sm" />
        </div>
        <ElevationCounter elevation={profile?.current_elevation || 0} />
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Trek info */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-ink mb-2">Summit Challenge</h1>
          <p className="font-body text-lg text-trail-brown">{trek.trek_name}</p>
          <div className="mt-2">
            <DifficultyBadge difficulty={trek.difficulty} />
          </div>
        </div>

        {!result ? (
          /* Pre-submission: show challenge + input */
          <div className="space-y-6">
            {/* Challenge description */}
            <JournalPaper>
              <p className="text-xs font-ui font-medium text-trail-brown/70 uppercase tracking-wider mb-3">
                The Challenge
              </p>
              <p className="font-body text-base text-ink leading-relaxed">
                {summitChallenge.description || 'Demonstrate mastery of this skill.'}
              </p>
            </JournalPaper>

            {/* Rubric preview */}
            {rubric.length > 0 && (
              <JournalPaper>
                <RubricDisplay rubric={rubric} />
              </JournalPaper>
            )}

            {/* Deliverable input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-ui font-medium text-ink mb-1.5">
                  Describe what you built
                </label>
                <textarea
                  value={deliverableText}
                  onChange={(e) => setDeliverableText(e.target.value)}
                  placeholder="Describe your completed work in detail. What did you create? How does it meet the challenge requirements?"
                  rows={6}
                  maxLength={5000}
                  className="w-full px-4 py-3 border border-trail-brown/20 rounded-lg font-body text-sm text-ink bg-white focus:outline-none focus:border-summit-cobalt/50 focus:ring-1 focus:ring-summit-cobalt/20 resize-y"
                />
                <p className="text-xs text-trail-brown/50 mt-1 text-right">
                  {deliverableText.length}/5000
                </p>
              </div>

              <div>
                <label className="block text-sm font-ui font-medium text-ink mb-1.5">
                  Deliverable URL <span className="text-trail-brown/50">(optional)</span>
                </label>
                <input
                  type="url"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-trail-brown/20 rounded-lg font-mono text-sm text-ink bg-white focus:outline-none focus:border-summit-cobalt/50 focus:ring-1 focus:ring-summit-cobalt/20"
                />
              </div>
            </div>

            {/* Error */}
            {evalError && (
              <SherpaTerminal>
                {'>'} {evalError}
              </SherpaTerminal>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!deliverableText.trim() || evaluating}
              className="w-full py-3 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {evaluating ? 'The Sherpa is reviewing your work...' : 'Submit for Evaluation'}
            </button>

            {evaluating && (
              <SherpaTerminal>
                {'>'} Studying your submission against the rubric...
              </SherpaTerminal>
            )}
          </div>
        ) : (
          /* Post-submission: show results */
          <div className="space-y-6">
            {/* Overall score */}
            <div className="text-center">
              <p className={`font-display text-4xl mb-1 ${result.passed ? 'text-phosphor-green' : 'text-signal-orange'}`}>
                {Math.round(result.overall_score * 100)}%
              </p>
              <p className={`font-ui text-sm font-medium ${result.passed ? 'text-phosphor-green' : 'text-signal-orange'}`}>
                {result.passed ? 'Summit Reached' : 'Not Yet'}
              </p>
            </div>

            {/* Dimension scores */}
            {rubric.length > 0 && (
              <JournalPaper>
                <RubricDisplay rubric={rubric} scores={result.dimension_scores} />
              </JournalPaper>
            )}

            {/* Summit entry (Sherpa's reflection) */}
            {result.summit_entry && (
              <SherpaTerminal>
                {result.summit_entry}
              </SherpaTerminal>
            )}

            {/* Retry guidance */}
            {!result.passed && result.retry_guidance && (
              <JournalPaper>
                <p className="text-xs font-ui font-medium text-signal-orange uppercase tracking-wider mb-2">
                  What to improve
                </p>
                <p className="font-body text-sm text-ink leading-relaxed">
                  {result.retry_guidance}
                </p>
              </JournalPaper>
            )}

            {/* Error */}
            {evalError && (
              <SherpaTerminal>
                {'>'} {evalError}
              </SherpaTerminal>
            )}

            {/* Action buttons */}
            {result.passed ? (
              <button
                onClick={handleRecord}
                disabled={recording}
                className="w-full py-3 bg-phosphor-green text-terminal-dark font-ui font-bold rounded-lg hover:bg-phosphor-green/90 transition-colors disabled:opacity-50"
              >
                {recording ? 'Recording in Notebook...' : 'Record in Trek Notebook'}
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-summit-cobalt text-white font-ui font-semibold rounded-lg hover:bg-summit-cobalt/90 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
