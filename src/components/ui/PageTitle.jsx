import { useEffect } from 'react'

/**
 * Sets document.title when rendered. Use at the top of each view.
 */
export default function PageTitle({ title }) {
  useEffect(() => {
    document.title = title ? `${title} - Altius` : 'Altius - Everything Worth Knowing is Uphill'
  }, [title])

  return null
}
