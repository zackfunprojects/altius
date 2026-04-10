import { useState, useRef, useEffect, useCallback } from 'react'
import { advanceScenario } from '../../lib/sherpa'

export default function ConversationSimLedge({ spec, onResponseChange, disabled }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnCount, setTurnCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || disabled || isComplete) return

    setInput('')
    const userMsg = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const result = await advanceScenario({
        exerciseSpec: spec,
        conversationHistory: updatedMessages,
        userMessage: text,
      })

      const npcMsg = { role: 'assistant', content: result.npc_response }
      const finalMessages = [...updatedMessages, npcMsg]
      const newTurnCount = result.turn_number || turnCount + 1

      setMessages(finalMessages)
      setTurnCount(newTurnCount)

      if (result.is_complete || newTurnCount >= spec.max_turns) {
        setIsComplete(true)
        onResponseChange?.({
          conversation_history: finalMessages,
          is_complete: true,
        })
      } else {
        onResponseChange?.({
          conversation_history: finalMessages,
          is_complete: false,
        })
      }
    } catch {
      const errorMsg = {
        role: 'assistant',
        content: 'Connection lost. Try sending your message again.',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [input, loading, disabled, isComplete, messages, spec, turnCount, onResponseChange])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="rounded-lg border border-phosphor-green/15 bg-terminal-dark overflow-hidden crt-vignette">
      {/* Header */}
      <div className="px-4 py-3 border-b border-phosphor-green/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-phosphor-green animate-pulse" />
            <span className="font-mono text-phosphor-green text-sm phosphor-glow">
              {spec.npc_character || 'Simulation'}
            </span>
          </div>
          {spec.max_turns && (
            <span className="font-mono text-xs text-trail-brown/60">
              Turn {turnCount} of {spec.max_turns}
            </span>
          )}
        </div>
      </div>

      {/* Scenario + Objectives */}
      <div className="px-4 py-3 border-b border-phosphor-green/10 space-y-2">
        {spec.scenario && (
          <p className="font-mono text-xs text-phosphor-green/60 leading-relaxed">
            {spec.scenario}
          </p>
        )}
        {spec.user_role && (
          <p className="font-mono text-xs text-alpine-gold/70">
            Your role: {spec.user_role}
          </p>
        )}
        {spec.objectives?.length > 0 && (
          <ul className="space-y-1">
            {spec.objectives.map((obj, i) => (
              <li
                key={i}
                className="font-mono text-xs text-phosphor-green/50 flex items-start gap-1.5"
              >
                <span className="text-phosphor-green/30 mt-px">-</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 && !loading && (
          <p className="font-mono text-xs text-phosphor-green/30 text-center py-6">
            {'>'} Begin the conversation...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.role === 'user' ? 'flex justify-end' : ''}
          >
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
        {isComplete ? (
          <div className="text-center font-mono text-xs text-phosphor-green/60">
            Conversation complete. Awaiting evaluation.
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || loading}
              placeholder="Type your response..."
              className="flex-1 bg-terminal-dark border border-phosphor-green/20 rounded-md px-3 py-2 font-mono text-sm text-phosphor-green placeholder-phosphor-green/30 focus:outline-none focus:border-phosphor-green/40 disabled:opacity-40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || disabled}
              className="px-3 py-2 bg-phosphor-green/15 text-phosphor-green rounded-md font-mono text-sm hover:bg-phosphor-green/25 transition-colors disabled:opacity-30"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
