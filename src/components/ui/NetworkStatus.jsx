import { useState, useEffect } from 'react'

/**
 * Global offline banner. Shows when navigator.onLine is false.
 */
export default function NetworkStatus() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-signal-orange text-white text-center py-2 px-4 font-ui text-sm"
      role="alert"
      aria-live="assertive"
    >
      You are offline. Some features may not work until your connection is restored.
    </div>
  )
}
