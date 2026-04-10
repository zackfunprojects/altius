import { useState, useCallback, useRef, useMemo } from 'react'
import { askSherpa } from '../lib/sherpa'

/**
 * Shared chat logic for Sherpa conversations.
 * mode 'section': keyed by sectionId (for SherpaAside contextual chat)
 * mode 'general': single flat message array (for full SherpaChat view)
 */
export function useSherpaChat({ trekId, sectionId, mode = 'section' }) {
  const [historyMap, setHistoryMap] = useState({})
  const [generalMessages, setGeneralMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const activeKeyRef = useRef(mode === 'section' ? sectionId : trekId)

  // Track active key for stale reply detection
  const activeKey = mode === 'section' ? sectionId : (trekId || 'global')
  activeKeyRef.current = activeKey

  const messages = useMemo(() => {
    if (mode === 'general') return generalMessages
    return (activeKey && historyMap[activeKey]) || []
  }, [mode, generalMessages, activeKey, historyMap])

  const appendMessage = useCallback((key, msg) => {
    if (mode === 'general') {
      setGeneralMessages(prev => [...prev, msg])
    } else {
      setHistoryMap(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), msg],
      }))
    }
  }, [mode])

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return false

    const requestKey = activeKeyRef.current
    appendMessage(requestKey, { role: 'user', content: text.trim() })
    setLoading(true)

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await askSherpa({
        message: text.trim(),
        sectionId: mode === 'section' ? sectionId : null,
        trekId,
        conversationHistory,
        mode,
      })

      // Only append if we're still on the same context
      if (activeKeyRef.current === requestKey) {
        appendMessage(requestKey, { role: 'assistant', content: response })
      }
    } catch {
      if (activeKeyRef.current === requestKey) {
        appendMessage(requestKey, {
          role: 'assistant',
          content: 'The mountain fog is thick. Try again in a moment.',
        })
      }
    } finally {
      setLoading(false)
    }
  }, [loading, messages, sectionId, trekId, mode, appendMessage])

  const clearHistory = useCallback(() => {
    if (mode === 'general') {
      setGeneralMessages([])
    } else if (activeKey) {
      setHistoryMap(prev => {
        const next = { ...prev }
        delete next[activeKey]
        return next
      })
    }
  }, [mode, activeKey])

  return { messages, sendMessage, loading, clearHistory }
}
