import { useState, useCallback, useEffect } from 'react'
import { isRecordingSupported, startRecording, stopRecording, blobToBase64, playAudioBase64 } from '../../lib/voice'
import { voiceChat } from '../../lib/sherpa'

/**
 * Fireside Lessons - voice dialogue with the Sherpa.
 * Warm amber aesthetic (campfire feel), not CRT terminal.
 */
export default function FiresideMode({ open, onClose, trekId, sectionId }) {
  const [recording, setRecording] = useState(false)
  const [recorderRef, setRecorderRef] = useState(null)
  const [getBlobRef, setGetBlobRef] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  const supported = isRecordingSupported()

  // Cleanup recorder on close
  useEffect(() => {
    if (!open && recorderRef?.state === 'recording') {
      recorderRef.stop()
    }
  }, [open, recorderRef])

  const handleStartRecording = useCallback(async () => {
    setError(null)
    try {
      const { recorder, getBlob } = await startRecording()
      setRecorderRef(recorder)
      setGetBlobRef(() => getBlob)
      setRecording(true)
    } catch {
      setError('Could not access microphone.')
    }
  }, [])

  const handleStopAndSend = useCallback(async () => {
    if (!recorderRef || !getBlobRef) return
    setRecording(false)
    setProcessing(true)
    setError(null)

    try {
      const blob = await stopRecording(recorderRef, getBlobRef)
      const base64 = await blobToBase64(blob)

      const result = await voiceChat({
        trekId,
        sectionId,
        audioBase64: base64,
        conversationHistory: messages,
      })

      // Add messages to conversation
      const newMessages = [
        ...messages,
        { role: 'user', content: result.transcript },
        { role: 'assistant', content: result.response_text },
      ]
      setMessages(newMessages)

      // Play audio response if available
      if (result.audio_base64) {
        setPlaying(true)
        try {
          await playAudioBase64(result.audio_base64)
        } catch {
          // Silent failure on playback - text is still visible
        }
        setPlaying(false)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setProcessing(false)
      setRecorderRef(null)
      setGetBlobRef(null)
    }
  }, [recorderRef, getBlobRef, trekId, sectionId, messages])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark-earth">
      {/* Warm ambient gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(212,150,11,0.15) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <div className="relative px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-alpine-gold animate-pulse" />
          <span className="font-display text-alpine-gold text-sm">Fireside Lesson</span>
        </div>
        <button
          onClick={onClose}
          className="text-trail-brown hover:text-catalog-cream transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Conversation */}
      <div className="relative flex-1 overflow-y-auto px-4 sm:px-8 py-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 && !processing && (
          <div className="text-center py-12">
            <p className="font-body text-catalog-cream/40 text-sm italic">
              Speak to the Sherpa. They are listening.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
              <p className="text-xs font-ui text-trail-brown/50 mb-1">
                {msg.role === 'user' ? 'You' : 'The Sherpa'}
              </p>
              <p
                className={`inline-block max-w-[85%] text-sm leading-relaxed rounded-lg px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-summit-cobalt/20 text-catalog-cream font-body text-left'
                    : 'text-alpine-gold/90 font-body italic'
                }`}
              >
                {msg.content}
              </p>
            </div>
          ))}

          {processing && (
            <p className="font-body text-alpine-gold/50 text-sm italic animate-pulse">
              The Sherpa is thinking...
            </p>
          )}

          {playing && (
            <p className="font-body text-alpine-gold/50 text-xs">
              Speaking...
            </p>
          )}
        </div>
      </div>

      {/* Recording controls */}
      <div className="relative px-4 py-6 flex flex-col items-center gap-3">
        {!supported ? (
          <p className="font-ui text-trail-brown/50 text-sm">
            Voice not supported in this browser.
          </p>
        ) : (
          <>
            <button
              onClick={recording ? handleStopAndSend : handleStartRecording}
              disabled={processing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                recording
                  ? 'bg-signal-orange text-white scale-110 animate-pulse'
                  : processing
                    ? 'bg-trail-brown/30 text-trail-brown/50 cursor-not-allowed'
                    : 'bg-alpine-gold text-dark-earth hover:bg-alpine-gold/90'
              }`}
            >
              {recording ? (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <p className="font-ui text-catalog-cream/40 text-xs">
              {recording ? 'Click to send' : processing ? 'Processing...' : 'Click to speak'}
            </p>
          </>
        )}

        {error && (
          <p className="font-ui text-signal-orange text-xs">{error}</p>
        )}
      </div>
    </div>
  )
}
