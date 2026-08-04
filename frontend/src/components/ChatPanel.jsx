import { useEffect, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'

// Docked chat sidebar for the student's live-lesson view (StudentLessonPage.jsx).
//
// NOT WIRED SERVER-SIDE YET: messages send over the lesson's real WebSocket
// (see lib/lessonSocket.js), but app/websockets/dashboard_ws.py's message
// loop only recognizes one incoming type today — {"type": "ping"} — and
// silently drops anything else, with no relay to other connected clients.
// So right now a sent message only ever appears in the SENDER's own panel
// (via the local-echo in StudentLessonPage's handleSendChatMessage), never
// on a classmate's or the teacher's screen. This component itself needs NO
// changes once that's added: it already renders whatever `messages` it's
// given, and StudentLessonPage already listens for incoming {type: 'chat'}
// frames — the only missing piece is the server rebroadcasting them.
export function ChatPanel({ messages, isConnected, onSend, onClose }) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  // Auto-scroll to the newest message, same bottom-anchored pattern as
  // Scout's chat thread (ScoutPage.jsx).
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  function handleSubmit(event) {
    event.preventDefault()
    if (!draft.trim()) return
    onSend(draft)
    setDraft('')
  }

  return (
    <div className="lesson-chat-panel">
      <div className="lesson-chat-header">
        <span>Chat</span>
        <button type="button" className="lesson-chat-close" onClick={onClose} aria-label="Close chat">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="lesson-chat-messages">
        {messages.length === 0 ? (
          <p className="lesson-chat-empty">No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="lesson-chat-message">
              <div className="lesson-chat-message-meta">
                <span className="lesson-chat-message-sender">{message.senderName}</span>
                <span className="lesson-chat-message-time">{formatTime(message.sentAt)}</span>
              </div>
              <p className="lesson-chat-message-text">{message.text}</p>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="lesson-chat-input-row">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={isConnected ? 'Message the class…' : 'Connecting…'}
          disabled={!isConnected}
          className="lesson-chat-input"
        />
        <button
          type="submit"
          className="lesson-chat-send"
          disabled={!isConnected || !draft.trim()}
          aria-label="Send message"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
