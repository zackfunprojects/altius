import { useEffect, useState } from 'react'

/**
 * Renders text letter by letter with a typewriter animation.
 * Uses the Sherpa's Courier New / phosphor-green styling by default.
 */
export default function TypewriterText({
  text,
  speed = 30,
  className = '',
  onComplete,
}) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)

    if (!text) return

    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse">_</span>}
    </span>
  )
}
