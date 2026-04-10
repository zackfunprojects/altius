import { useEffect, useState } from 'react'

export default function ElevationCounter({ elevation = 0 }) {
  const [animate, setAnimate] = useState(false)
  const [prev, setPrev] = useState(elevation)

  useEffect(() => {
    if (elevation !== prev) {
      setAnimate(true)
      setPrev(elevation)
      const timer = setTimeout(() => setAnimate(false), 300)
      return () => clearTimeout(timer)
    }
  }, [elevation, prev])

  const formatted = elevation.toLocaleString()

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold text-phosphor-green text-sm ${animate ? 'elevation-animate' : ''}`}
    >
      <span className="text-xs">&#9650;</span>
      {formatted} ft
    </span>
  )
}
