import { useState } from 'react'
import { useTrekJournal } from '../hooks/useTrekJournal'
import { useExpeditionEvents } from '../hooks/useExpeditionEvents'
import { awardElevation, getElevationDelta } from '../lib/elevation'

export default function MorningQuestion({ question, trekId, userId, onClose }) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { addNote } = useTrekJournal(trekId)
  const { fireEvent } = useExpeditionEvents(trekId)

  const handleAnswer = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true)

    try {
      // Save to journal
      await addNote({
        body: `Morning question: ${question}\n\nMy answer: ${answer.trim()}`,
      })

      // Fire expedition event
      await fireEvent({
        eventType: 'morning_question',
        title: 'Morning question answered',
        body: question,
        elevationBonus: 2,
      })

      // Award elevation
      await awardElevation({
        userId,
        delta: getElevationDelta('event_bonus', { delta: 2 }),
        sourceType: 'event_bonus',
        sourceId: null,
        trekId,
      })
    } catch (err) {
      console.error('Failed to save morning question answer:', err)
    }

    // Mark as answered for today
    localStorage.setItem('altius_morning_q_date', new Date().toISOString().slice(0, 10))
    onClose()
  }

  const handleDismiss = () => {
    localStorage.setItem('altius_morning_q_date', new Date().toISOString().slice(0, 10))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-terminal-dark crt-vignette crt-scanlines flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Greeting */}
        <div className="mb-6">
          <p className="font-mono text-phosphor-green/50 text-sm phosphor-glow mb-2">
            {'>'} Morning on the mountain.
          </p>
          <p className="font-mono text-phosphor-green/60 text-sm phosphor-glow">
            {'>'} A question from the trail:
          </p>
        </div>

        {/* Question */}
        <div className="mb-6 bg-terminal-dark border border-phosphor-green/20 rounded-lg p-5">
          <p className="font-mono text-phosphor-green text-base phosphor-glow leading-relaxed">
            {question}
          </p>
        </div>

        {/* Answer area */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Take a moment to reflect..."
          className="w-full h-28 bg-terminal-dark border border-phosphor-green/20 rounded-md px-4 py-3 font-mono text-sm text-phosphor-green placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/40 resize-none mb-4"
          autoFocus
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-sm font-mono text-trail-brown hover:text-trail-brown/80 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleAnswer}
            disabled={!answer.trim() || submitting}
            className="px-5 py-2 bg-phosphor-green/15 text-phosphor-green rounded-md font-mono text-sm hover:bg-phosphor-green/25 transition-colors disabled:opacity-30"
          >
            {submitting ? 'Saving...' : 'Answer (+2 ft)'}
          </button>
        </div>
      </div>
    </div>
  )
}
