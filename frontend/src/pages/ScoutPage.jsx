import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import { Logo } from '../components/Logo.jsx'
import { AvatarBadge } from '../components/AvatarBadge.jsx'
import { recordEngagement } from '../lib/companionStorage.js'
import { recordActivity } from '../lib/activityStorage.js'

// Mocked, deliberately non-random-feeling guiding questions — Scout's whole
// point per the spec is Socratic (asks questions back, never answers
// directly). Cycling through a fixed set keeps that voice consistent without
// pretending there's a real model behind it.
const GUIDING_QUESTIONS = [
  "What's the first step you'd try, and why that one?",
  'What do you already know that might connect to this?',
  "If you had to guess, what's your best estimate before working it out?",
  'Where exactly did it stop making sense — right before that, what was clear?',
  "What would happen if you tried the opposite approach?",
]

const RECALL_QUEUE = ['Fractions', 'Linear equations', 'Word problems'] // mocked — no spaced-recall backend exists

const QUICK_ACTIONS = ['Give me a hint', 'Explain it differently', 'Check my work']

// Wireframe spec screen 05 ("Scout, the AI tutor"). POST /tutor/message
// doesn't exist on the backend (Sprint 3, Felix's task — needs the Claude
// API integration, not started). This mocks Scout's replies with a fixed
// rotation of guiding questions rather than calling an LLM directly from the
// browser, which would mean shipping an API key to client-side JS — wrong
// even for a prototype. Once a real /tutor/message endpoint exists, only
// handleSend below needs to change.
export function ScoutPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'scout',
      text: "Hi! I'm Scout. I won't just hand you answers — I'll help you figure it out. What are you working on?",
    },
  ])
  const [draft, setDraft] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef(null)

  // Auto-scroll to the newest message whenever one is added (or the typing
  // indicator appears) — bottom-anchored like Claude/ChatGPT.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isThinking])

  function sendMessage(text) {
    if (!text.trim()) return
    setMessages((current) => [...current, { role: 'user', text: text.trim() }])
    setIsThinking(true)
    recordEngagement() // "chatting with Scout" is one of the companion's growth triggers
    recordActivity({ type: 'scout', label: 'Your conversation with Scout', path: '/scout' })

    // Simulated "thinking" delay so the typing indicator has something to show —
    // there's no real request in flight here, see the file-level note above.
    setTimeout(() => {
      const reply = GUIDING_QUESTIONS[Math.floor(Math.random() * GUIDING_QUESTIONS.length)]
      setMessages((current) => [...current, { role: 'scout', text: reply }])
      setIsThinking(false)
    }, 900)
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft)
    setDraft('')
  }

  return (
    <div style={{ height: 'calc(100vh - 65px)', background: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '1.5rem 1.5rem 0' }}>
        <h1 style={{ fontSize: '1.1rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>Scout</h1>

        {/* Recall queue — chips, not cards, to stay "zero test energy" per the spec. */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {RECALL_QUEUE.map((topic) => (
            <span
              key={topic}
              style={{
                border: '1px solid var(--color-cream-dim)',
                background: 'var(--color-cream-dim)',
                color: 'var(--color-ink-muted)',
                borderRadius: 'var(--radius-pill)',
                padding: '0.3rem 0.85rem',
                fontSize: '0.8rem',
              }}
            >
              {topic}
            </span>
          ))}
        </div>

        {/* Message area: flex column with justify-content flex-end, so
            messages sit at the bottom and grow upward as the conversation
            builds, instead of starting at the top with dead space below. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingBottom: '1rem' }}>
            {messages.map((message, index) => (
              <ChatBubble key={index} role={message.role} text={message.text} studentName={user?.name} />
            ))}
            {isThinking && <ChatBubble role="scout" text="…" studentName={user?.name} />}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Quick-action chips: tapping sends it straight in as a message. */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.75rem 0' }}>
          {QUICK_ACTIONS.map((action) => (
            <button key={action} type="button" className="scout-quick-action" onClick={() => sendMessage(action)}>
              {action}
            </button>
          ))}
        </div>

        {/* Input bar, pinned at the bottom of the container. */}
        <form onSubmit={handleSubmit} className="scout-input-bar" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask Scout something…"
            className="scout-input"
          />
          <button type="submit" className="scout-send-button" aria-label="Send message" disabled={!draft.trim()}>
            <ArrowUp size={18} color="var(--color-text-on-dark)" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  )
}

function ChatBubble({ role, text, studentName }) {
  const isScout = role === 'scout'
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignSelf: isScout ? 'flex-start' : 'flex-end', flexDirection: isScout ? 'row' : 'row-reverse', maxWidth: '85%' }}>
      {isScout ? (
        <span
          style={{
            flexShrink: 0,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-cream-dim)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Logo size={16} color="var(--color-forest)" />
        </span>
      ) : (
        <AvatarBadge name={studentName} />
      )}
      <div
        style={{
          background: isScout ? 'var(--color-cream-dim)' : 'var(--color-forest)',
          color: isScout ? 'var(--color-ink)' : 'var(--color-text-on-dark)',
          padding: '0.6rem 1rem',
          // Asymmetric radius: the corner nearest the avatar (top, on the
          // avatar's side) is squared off, like a speech-bubble tail.
          borderRadius: isScout ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        }}
      >
        {text}
      </div>
    </div>
  )
}
