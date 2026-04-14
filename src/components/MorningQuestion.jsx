import { useState } from 'react'
import { useTrekJournal } from '../hooks/useTrekJournal'
import { useExpeditionEvents } from '../hooks/useExpeditionEvents'
import { awardElevation, getElevationDelta } from '../lib/elevation'
import SherpaTerminal from './brand/SherpaTerminal'

export default function MorningQuestion({ question, trekId, userId, onClose }) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { addNote } = useTrekJournal(trekId)
  const { fireEvent } = useExpeditionEvents(trekId)

  const handleAnswer = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true)

    try {
      await addNote({
        body: `Morning question: ${question}\n\nMy answer: ${answer.trim()}`,
      })

      await fireEvent({
        eventType: 'morning_question',
        title: 'Morning question answered',
        body: question,
        elevationBonus: 2,
      })

      await awardElevation({
        userId,
        delta: getElevationDelta('event_bonus', { delta: 2 }),
        sourceType: 'event_bonus',
        sourceId: null,
        trekId,
      })
      localStorage.setItem('altius_morning_q_date', new Date().toLocaleDateString('en-CA'))
      onClose()
    } catch (err) {
      console.error('Failed to save morning question answer:', err)
      setSubmitting(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('altius_morning_q_date', new Date().toLocaleDateString('en-CA'))
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Morning question from the Sherpa" className="fixed inset-0 z-50 bg-terminal-dark crt-vignette crt-scanlines flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <SherpaTerminal label="THE SHERPA ASKS">
          <span className="text-xl not-italic block mb-4 leading-relaxed">
            {question}
          </span>
        </SherpaTerminal>

        {/* Answer area */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Take a moment to reflect..."
          className="w-full h-28 mt-4 bg-[rgba(255,255,255,0.05)] border border-phosphor-green/20 rounded-md px-4 py-3 font-mono text-sm text-catalog-cream placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/50 resize-none"
          autoFocus
        />

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleDismiss}
            className="font-ui text-sm text-trail-brown hover:text-catalog-cream/60 transition-colors"
          >
            Begin the day's climb
          </button>
          <button
            onClick={handleAnswer}
            disabled={!answer.trim() || submitting}
            className="px-5 py-2 border border-phosphor-green/30 text-phosphor-green rounded-md font-mono text-sm hover:bg-phosphor-green/10 transition-colors disabled:opacity-30"
          >
            {submitting ? 'Saving...' : 'Answer (+2 ft)'}
          </button>
        </div>
      </div>
    </div>
  )
}
