import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { askSherpa } from '../../lib/sherpa'

export default function SherpaAside({ open, onClose, section, trekId }) {
  // Key conversation history by section ID
  const [historyMap, setHistoryMap] = useState({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const activeSectionRef = useRef(section?.id)

  const sectionId = section?.id
  const messages = useMemo(() => (sectionId && historyMap[sectionId]) || [], [sectionId, historyMap])

  // Track active section for stale reply detection
  useEffect(() => {
    activeSectionRef.current = sectionId
  }, [sectionId])

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const setMessages = useCallback((updater) => {
    if (!sectionId) return
    setHistoryMap(prev => ({
      ...prev,
      [sectionId]: typeof updater === 'function' ? updater(prev[sectionId] || []) : updater,
    }))
  }, [sectionId])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !sectionId) return

    const requestSectionId = sectionId
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const response = await askSherpa({
        message: text,
        sectionId: requestSectionId,
        trekId,
        conversationHistory,
      })

      // Only append if we're still on the same section
      if (activeSectionRef.current === requestSectionId) {
        setHistoryMap(prev => ({
          ...prev,
          [requestSectionId]: [...(prev[requestSectionId] || []), { role: 'assistant', content: response }],
        }))
      }
    } catch {
      if (activeSectionRef.current === requestSectionId) {
        setHistoryMap(prev => ({
          ...prev,
          [requestSectionId]: [...(prev[requestSectionId] || []), { role: 'assistant', content: 'The mountain fog is thick. Try again in a moment.' }],
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [input, loading, sectionId, messages, trekId, setMessages])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-terminal-dark z-50 flex flex-col crt-vignette">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-phosphor-green/15">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-phosphor-green animate-pulse" />
            <span className="font-mono text-phosphor-green text-sm phosphor-glow">
              The Sherpa
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-trail-brown hover:text-phosphor-green transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="font-mono text-phosphor-green/40 text-xs">
                {'>'} Ask me anything about this section.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-summit-cobalt/20 text-catalog-cream font-body'
                    : 'font-mono text-phosphor-green/90 phosphor-glow'
                }`}
              >
                {msg.role === 'assistant' && (
                  <span className="text-phosphor-green/50">{'> '}</span>
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="font-mono text-phosphor-green/50 text-sm animate-pulse">
              {'>'} ...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-phosphor-green/15 px-4 py-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Sherpa..."
              className="flex-1 bg-terminal-dark border border-phosphor-green/20 rounded-md px-3 py-2 font-mono text-sm text-phosphor-green placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-3 py-2 bg-phosphor-green/15 text-phosphor-green rounded-md font-mono text-sm hover:bg-phosphor-green/25 transition-colors disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
