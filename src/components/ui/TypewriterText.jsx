import { useEffect, useState, useRef } from 'react'

/**
 * Renders text letter by letter with a typewriter animation.
 */
export default function TypewriterText({
  text,
  speed = 30,
  className = '',
  onComplete,
}) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)

  // Keep ref current without re-triggering effect
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

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
        onCompleteRef.current?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse">_</span>}
    </span>
  )
}
