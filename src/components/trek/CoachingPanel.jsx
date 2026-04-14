import { useState, useCallback } from 'react'
import { analyzeScreen } from '../../lib/sherpa'

/**
 * Over-the-Shoulder coaching panel.
 * Captures screenshots via getDisplayMedia, sends to AI for analysis.
 * Pro tier only.
 */
export default function CoachingPanel({ open, onClose, trekId, subscriptionTier }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [toolName, setToolName] = useState('')
  const [currentTask, setCurrentTask] = useState('')
  const [error, setError] = useState(null)

  const isPro = subscriptionTier === 'pro'

  const captureAndAnalyze = useCallback(async () => {
    if (!trekId || analyzing) return
    setAnalyzing(true)
    setError(null)

    try {
      // Capture screen
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })

      const track = stream.getVideoTracks()[0]

      // Use video element as fallback for browsers without ImageCapture (Firefox)
      let base64
      if (typeof ImageCapture !== 'undefined') {
        const imageCapture = new ImageCapture(track)
        const bitmap = await imageCapture.grabFrame()
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(bitmap, 0, 0)
        base64 = canvas.toDataURL('image/png').split(',')[1]
      } else {
        // Fallback: draw video frame to canvas
        const video = document.createElement('video')
        video.srcObject = stream
        video.muted = true
        await video.play()
        await new Promise((r) => setTimeout(r, 200)) // Let frame render
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        base64 = canvas.toDataURL('image/png').split(',')[1]
        video.pause()
        video.srcObject = null
      }

      // Stop screen capture
      stream.getTracks().forEach((t) => t.stop())

      // Send for analysis
      const analysis = await analyzeScreen({
        trekId,
        screenshotBase64: base64,
        toolName: toolName.trim() || null,
        currentTask: currentTask.trim() || null,
      })

      setResult(analysis)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing was cancelled.')
      } else {
        setError(err.message || 'Failed to analyze screen.')
      }
    } finally {
      setAnalyzing(false)
    }
  }, [trekId, analyzing, toolName, currentTask])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-terminal-dark z-50 flex flex-col crt-vignette">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-phosphor-green/15">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-signal-orange" />
            <span className="font-mono text-phosphor-green text-sm phosphor-glow">
              Over-the-Shoulder
            </span>
          </div>
          <button onClick={onClose} className="text-trail-brown hover:text-phosphor-green transition-colors">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!isPro ? (
            /* Pro gate */
            <div className="text-center py-8">
              <p className="font-mono text-phosphor-green/60 text-sm mb-4">
                {'>'} Over-the-Shoulder coaching requires a Pro subscription.
              </p>
              <p className="font-mono text-phosphor-green/40 text-xs">
                The Sherpa watches your screen in real time and coaches live.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Context inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-phosphor-green/50 mb-1">
                    Tool being used (optional)
                  </label>
                  <input
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    placeholder="e.g., Figma, VS Code, Premiere"
                    className="w-full bg-terminal-dark border border-phosphor-green/20 rounded px-3 py-1.5 font-mono text-xs text-phosphor-green placeholder-phosphor-green/25 focus:outline-none focus:border-phosphor-green/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-phosphor-green/50 mb-1">
                    What are you working on? (optional)
                  </label>
                  <input
                    value={currentTask}
                    onChange={(e) => setCurrentTask(e.target.value)}
                    placeholder="e.g., designing the navbar layout"
                    className="w-full bg-terminal-dark border border-phosphor-green/20 rounded px-3 py-1.5 font-mono text-xs text-phosphor-green placeholder-phosphor-green/25 focus:outline-none focus:border-phosphor-green/40"
                  />
                </div>
              </div>

              {/* Capture button */}
              <button
                onClick={captureAndAnalyze}
                disabled={analyzing}
                className="w-full py-2.5 bg-phosphor-green/15 text-phosphor-green font-mono text-sm rounded-lg border border-phosphor-green/30 hover:bg-phosphor-green/25 transition-colors disabled:opacity-50"
              >
                {analyzing ? 'Analyzing screen...' : 'Share Screen for Coaching'}
              </button>

              {/* Error */}
              {error && (
                <p className="font-mono text-signal-orange text-xs">{error}</p>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-4 pt-2">
                  {/* Analysis */}
                  <div>
                    <p className="text-xs font-mono text-phosphor-green/50 mb-1">{'>'} Analysis</p>
                    <p className="font-mono text-phosphor-green/90 text-sm phosphor-glow leading-relaxed">
                      {result.analysis}
                    </p>
                  </div>

                  {/* Coaching points */}
                  {result.coaching_points?.length > 0 && (
                    <div>
                      <p className="text-xs font-mono text-phosphor-green/50 mb-2">{'>'} Coaching</p>
                      <ul className="space-y-2">
                        {result.coaching_points.map((point, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-mono text-alpine-gold text-xs mt-0.5 flex-shrink-0">
                              {i + 1}.
                            </span>
                            <span className="font-mono text-phosphor-green/80 text-xs leading-relaxed">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next step */}
                  {result.suggestion && (
                    <div className="border-t border-phosphor-green/10 pt-3">
                      <p className="text-xs font-mono text-phosphor-green/50 mb-1">{'>'} Next step</p>
                      <p className="font-mono text-phosphor-green text-sm phosphor-glow">
                        {result.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!result && !analyzing && (
                <p className="font-mono text-phosphor-green/30 text-xs text-center py-4">
                  {'>'} Share your screen and the Sherpa will coach you in real time.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
