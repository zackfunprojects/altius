import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveTrek } from '../hooks/useActiveTrek'
import { useSherpaChat } from '../hooks/useSherpaChat'
import FourColorBar from '../components/brand/FourColorBar'

export default function SherpaChat() {
  const navigate = useNavigate()
  const { trek } = useActiveTrek()
  const { messages, sendMessage, loading } = useSherpaChat({
    trekId: trek?.id,
    mode: 'general',
  })

  const [input, setInput] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const welcomeMessage = trek
    ? `> You're on the trail to ${trek.trek_name}. Ask me anything about your current climb.`
    : '> No active trek. I\'m here to review what you\'ve learned or help plan your next climb.'

  return (
    <div className="min-h-screen bg-terminal-dark flex flex-col crt-vignette">
      <FourColorBar />

      {/* Header */}
      <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-phosphor-green/15">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-trail-brown hover:text-phosphor-green transition-colors"
            aria-label="Back to dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-phosphor-green animate-pulse" />
            <span className="font-mono text-phosphor-green text-lg phosphor-glow">
              The Sherpa
            </span>
          </div>
        </div>
        {trek && (
          <span className="text-xs font-mono text-phosphor-green/40">
            {trek.trek_name}
          </span>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto crt-scanlines">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {/* Welcome message */}
          <div className="font-mono text-phosphor-green/50 text-sm">
            {welcomeMessage}
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
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
      </div>

      {/* Input */}
      <div className="border-t border-phosphor-green/15 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Speak with the Sherpa..."
            className="flex-1 bg-terminal-dark border border-phosphor-green/20 rounded-md px-4 py-2.5 font-mono text-sm text-phosphor-green placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-phosphor-green/15 text-phosphor-green rounded-md font-mono text-sm hover:bg-phosphor-green/25 transition-colors disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
