import { useState, useCallback } from 'react'

/**
 * Social sharing for summit cards.
 * Uses Web Share API where available, clipboard fallback otherwise.
 */
export default function ShareCard({ entry }) {
  const [copied, setCopied] = useState(false)

  const shareText = `I just summited "${entry.skill_name}" on Altius - ${entry.key_concepts?.length || 0} concepts mastered on Expedition Day ${entry.summit_date}. Everything worth knowing is uphill.`

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard also failed - ignore
    }
  }, [shareText])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Summit: ${entry.skill_name}`,
          text: shareText,
          url: 'https://altius.vercel.app',
        })
      } catch {
        // Share failed or cancelled - fall back to clipboard
        await copyToClipboard()
      }
    } else {
      await copyToClipboard()
    }
  }, [entry, shareText, copyToClipboard])

  return (
    <button
      onClick={handleShare}
      className="text-xs font-ui text-alpine-gold hover:text-alpine-gold/80 underline"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
