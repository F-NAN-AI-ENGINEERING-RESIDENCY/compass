import { useState } from 'react'

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

// Wireframe spec screen 05 ("Scout, the AI tutor"). POST /tutor/message
// doesn't exist on the backend (Sprint 3, Felix's task — needs the Claude
// API integration, not started). This mocks Scout's replies with a fixed
// rotation of guiding questions rather than calling an LLM directly from the
// browser, which would mean shipping an API key to client-side JS — wrong
// even for a prototype. Once a real /tutor/message endpoint exists, only
// handleSend below needs to change.
export function ScoutPage() {
  const [messages, setMessages] = useState([
    { role: 'scout', text: "Hi! I'm Scout. What are you working on?" },
  ])
  const [draft, setDraft] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  function handleSend(event) {
    event.preventDefault()
    if (!draft.trim()) return
    const userMessage = { role: 'user', text: draft.trim() }
    setMessages((current) => [...current, userMessage])
    setDraft('')
    setIsThinking(true)

    // Simulated "thinking" delay so the typing indicator has something to show —
    // there's no real request in flight here, see the file-level note above.
    setTimeout(() => {
      const reply = GUIDING_QUESTIONS[Math.floor(Math.random() * GUIDING_QUESTIONS.length)]
      setMessages((current) => [...current, { role: 'scout', text: reply }])
      setIsThinking(false)
    }, 900)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-forest)', color: 'var(--color-text-on-dark)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem 1.5rem 0', maxWidth: '640px', margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '1rem' }}>Scout</h1>

        {/* Recall queue — chips, not cards, to stay "zero test energy" per the spec. */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {RECALL_QUEUE.map((topic) => (
            <span
              key={topic}
              style={{
                border: '1px solid var(--color-text-on-dark-muted)',
                borderRadius: 'var(--radius-pill)',
                padding: '0.3rem 0.85rem',
                fontSize: '0.8rem',
              }}
            >
              {topic}
            </span>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', marginBottom: '1rem' }}>
          {messages.map((message, index) => (
            <ChatBubble key={index} role={message.role} text={message.text} />
          ))}
          {isThinking && <ChatBubble role="scout" text="…" />}
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', paddingBottom: '1.5rem' }}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask Scout something…"
            className="text-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-pill btn-pill--primary">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

function ChatBubble({ role, text }) {
  const isScout = role === 'scout'
  return (
    <div
      style={{
        alignSelf: isScout ? 'flex-start' : 'flex-end',
        background: isScout ? 'rgba(255,255,255,0.12)' : 'var(--color-cream)',
        color: isScout ? 'var(--color-text-on-dark)' : 'var(--color-ink)',
        borderRadius: 'var(--radius-card)',
        padding: '0.6rem 1rem',
        maxWidth: '80%',
      }}
    >
      {text}
    </div>
  )
}
