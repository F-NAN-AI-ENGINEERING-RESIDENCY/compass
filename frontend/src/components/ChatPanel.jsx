import { useEffect, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'

// Docked chat sidebar for a live lesson (StudentLessonPage.jsx and
// TeacherInCallPage.jsx) — Zoom/Meet-style: broadcast to everyone by
// default, or pick one specific person from the "To" dropdown for a private
// message. Actual delivery is Daily's own sendAppMessage()/'app-message' API
// (see hooks/useDailyChat.js) — real, not mocked, no backend involved.
export function ChatPanel({ messages, participants, selfSessionId, isReady, onSend, onClose }) {
  const [draft, setDraft] = useState('')
  const [recipientId, setRecipientId] = useState('') // '' = everyone
  const scrollRef = useRef(null)

  // Auto-scroll to the newest message, same bottom-anchored pattern as
  // Scout's chat thread (ScoutPage.jsx).
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  // Other people in the call, for the "message privately" dropdown — self
  // is excluded, since messaging yourself isn't a thing.
  const otherParticipants = Object.values(participants).filter(
    (participant) => participant.session_id !== selfSessionId,
  )

  function handleSubmit(event) {
    event.preventDefault()
    if (!draft.trim()) return
    const recipient = otherParticipants.find((participant) => participant.session_id === recipientId)
    onSend(draft, recipientId || null, recipient?.user_name)
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

      {otherParticipants.length > 0 && (
        <div className="lesson-chat-recipient-row">
          <label htmlFor="lesson-chat-recipient">To</label>
          <select
            id="lesson-chat-recipient"
            value={recipientId}
            onChange={(event) => setRecipientId(event.target.value)}
            className="lesson-chat-recipient-select"
          >
            <option value="">Everyone</option>
            {otherParticipants.map((participant) => (
              <option key={participant.session_id} value={participant.session_id}>
                {participant.user_name || 'Someone'} (private)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="lesson-chat-messages">
        {messages.length === 0 ? (
          <p className="lesson-chat-empty">No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="lesson-chat-message">
              <div className="lesson-chat-message-meta">
                <span className="lesson-chat-message-sender">{message.senderName}</span>
                {message.toSessionId && (
                  <span className="lesson-chat-message-private">
                    {message.fromId === 'local' ? `to ${message.toName || 'them'} · private` : 'private'}
                  </span>
                )}
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
          placeholder={!isReady ? 'Connecting…' : recipientId ? 'Message privately…' : 'Message everyone…'}
          disabled={!isReady}
          className="lesson-chat-input"
        />
        <button type="submit" className="lesson-chat-send" disabled={!isReady || !draft.trim()} aria-label="Send message">
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
