import { useState, useCallback } from 'react'
import { isRecordingSupported, startRecording, stopRecording, blobToBase64 } from '../../lib/voice'
import { voiceChat } from '../../lib/sherpa'

/**
 * Voice response exercise: record audio, transcribe, submit for evaluation.
 */
export default function VoiceResponseLedge({ spec, onSubmit }) {
  const [recording, setRecording] = useState(false)
  const [recorderRef, setRecorderRef] = useState(null)
  const [getBlobRef, setGetBlobRef] = useState(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)

  const supported = isRecordingSupported()

  const handleStartRecording = useCallback(async () => {
    setError(null)
    try {
      const { recorder, getBlob } = await startRecording()
      setRecorderRef(recorder)
      setGetBlobRef(() => getBlob)
      setRecording(true)
    } catch {
      setError('Could not access microphone. Please check permissions.')
    }
  }, [])

  const handleStopRecording = useCallback(async () => {
    if (!recorderRef || !getBlobRef) return
    setRecording(false)
    setTranscribing(true)
    setError(null)

    try {
      const blob = await stopRecording(recorderRef, getBlobRef)
      const base64 = await blobToBase64(blob)

      // Transcribe only - skip Claude response and TTS for exercise submissions
      const result = await voiceChat({ audioBase64: base64, transcribeOnly: true })
      setTranscript(result.transcript || '')
    } catch (err) {
      setError(err.message || 'Failed to transcribe. Please try again.')
    } finally {
      setTranscribing(false)
      setRecorderRef(null)
      setGetBlobRef(null)
    }
  }, [recorderRef, getBlobRef])

  const handleSubmit = useCallback(() => {
    if (!transcript.trim()) return
    onSubmit({ transcript, type: 'voice_response' })
  }, [transcript, onSubmit])

  if (!supported) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-6 border-2 border-dashed border-trail-brown/30 rounded-lg bg-catalog-cream/50">
        <p className="text-sm font-ui text-trail-brown/60 text-center">
          Voice recording is not supported in this browser.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Prompt */}
      {spec?.prompt && (
        <p className="font-body text-sm text-ink leading-relaxed">{spec.prompt}</p>
      )}

      {/* Recording controls */}
      <div className="flex flex-col items-center gap-4 py-6">
        {!transcript ? (
          <>
            <button
              onClick={recording ? handleStopRecording : handleStartRecording}
              disabled={transcribing}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                recording
                  ? 'bg-signal-orange text-white animate-pulse scale-110'
                  : transcribing
                    ? 'bg-trail-brown/20 text-trail-brown/40 cursor-not-allowed'
                    : 'bg-summit-cobalt text-white hover:bg-summit-cobalt/90'
              }`}
            >
              {recording ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C10.3431 2 9 3.34315 9 5V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V5C15 3.34315 13.6569 2 12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <p className="text-xs font-ui text-trail-brown/60">
              {recording ? 'Recording... Click to stop' : transcribing ? 'Transcribing...' : 'Click to record'}
            </p>
          </>
        ) : (
          /* Transcript review */
          <div className="w-full space-y-3">
            <p className="text-xs font-ui font-medium text-trail-brown/70 uppercase tracking-wider">
              Your response (transcribed)
            </p>
            <div className="p-4 bg-white rounded-lg border border-trail-brown/15">
              <p className="font-body text-sm text-ink leading-relaxed">{transcript}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTranscript('')}
                className="flex-1 py-2 border border-trail-brown/20 text-trail-brown font-ui text-sm rounded-lg hover:bg-trail-brown/5 transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-summit-cobalt text-white font-ui font-semibold text-sm rounded-lg hover:bg-summit-cobalt/90 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm font-ui text-signal-orange text-center">{error}</p>
      )}
    </div>
  )
}
