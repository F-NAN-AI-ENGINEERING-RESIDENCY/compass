import { useEffect, useRef, useState } from 'react'
import { FileText, Paperclip, Send, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useAuth } from '../auth/AuthContext.jsx'
import { Logo } from '../components/Logo.jsx'
import { AvatarBadge } from '../components/AvatarBadge.jsx'
import { Chip } from '../components/Chip.jsx'
import { recordEngagement } from '../lib/companionStorage.js'
import { recordActivity } from '../lib/activityStorage.js'
import { sendTutorMessage } from '../api/tutor.js'
import { useSearchParams } from 'react-router-dom'

const RECALL_QUEUE = ['Fractions', 'Linear equations', 'Word problems'] // mocked — no spaced-recall backend exists

const QUICK_ACTIONS = ['Give me a hint', 'Explain it differently', 'Check my work']

// Cap on the auto-expanding textarea's growth — past this it scrolls
// internally instead of pushing the rest of the page down indefinitely.
const MAX_TEXTAREA_HEIGHT = 160

// Wireframe spec screen 05 ("Scout, the AI tutor"). POST /api/tutor/message
// is real and merged on main (Gemini-backed for now, see README's "Known
// deviations" — provider-agnostic, Anthropic later). Scout has no lesson
// context here — it's a standalone screen, not opened from within a specific
// lesson — so sendTutorMessage is called with lessonId omitted. Attachments
// are still local-only: there's no upload endpoint yet, so a photo/file is
// shown to the student as sent but never actually reaches the backend —
// only the typed message text does.
export function ScoutPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [messages, setMessages] = useState([
    {
      role: 'scout',
      text: "Hi! I'm Scout. I won't just hand you answers — I'll help you figure it out. What are you working on?",
    },
  ])
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const attachmentsRef = useRef(attachments)

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  // Revoke any not-yet-sent attachment previews when the page unmounts. Sent
  // messages carry their own copy of the attachment list (and object URLs),
  // so this only ever cleans up drafts that were selected but never sent.
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
      })
    }
  }, [])

  // Auto-scroll to the newest message whenever one is added (or the typing
  // indicator appears) — bottom-anchored like Claude/ChatGPT.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isThinking])

  // Auto-expand the textarea as the student types. Reset to 'auto' first so
  // shrinking (e.g. after deleting a line) is measured correctly instead of
  // only ever growing.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [draft])

  // Arriving from the post-lesson reflection's "work through X with Scout?"
  // handoff (LessonReflection.jsx navigates to /scout?topic=...) pre-fills
  // the draft with that context — it does NOT auto-send, so the student
  // still chooses when (and whether) to actually start that conversation.
  // Runs once on arrival only; not meant to react to later param changes.
  useEffect(() => {
    const topic = searchParams.get('topic')
    if (topic) setDraft(`I'm stuck on ${topic} — can you help me understand it?`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(text, messageAttachments = []) {
    const trimmed = text.trim()
    if (!trimmed && messageAttachments.length === 0) return
    setMessages((current) => [...current, { role: 'user', text: trimmed, attachments: messageAttachments }])
    setIsThinking(true)
    recordEngagement() // "chatting with Scout" is one of the companion's growth triggers
    recordActivity({ type: 'scout', label: 'Your conversation with Scout', path: '/scout' })

    try {
      const { reply } = await sendTutorMessage(trimmed)
      setMessages((current) => [...current, { role: 'scout', text: reply }])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'scout', text: "Sorry, I couldn't respond just now — please try again in a moment." },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft, attachments)
    setDraft('')
    setAttachments([])
  }

  // Enter sends, Shift+Enter inserts a newline — matches Claude/ChatGPT.
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  function handleFilesSelected(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }))
    setAttachments((current) => [...current, ...next])
    event.target.value = '' // lets the same file be re-selected later if removed
  }

  function removeAttachment(id) {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === id)
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return current.filter((attachment) => attachment.id !== id)
    })
  }

  const canSend = draft.trim().length > 0 || attachments.length > 0

  return (
    <div style={{ height: 'calc(100dvh - 65px)', background: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '1.5rem 1.5rem 0' }}>
        <h1 style={{ fontSize: '1.1rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>Scout</h1>

        {/* Recall queue — same Chip as the suggestion actions below, just
            non-interactive (no onClick), to stay "zero test energy" per the
            spec while still reading as one design system. */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {RECALL_QUEUE.map((topic) => (
            <Chip key={topic}>{topic}</Chip>
          ))}
        </div>

        {/* Message area: flex column with justify-content flex-end, so
            messages sit at the bottom and grow upward as the conversation
            builds, instead of starting at the top with dead space below. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingBottom: '1rem' }}>
            {messages.map((message, index) => (
              <ChatBubble key={index} role={message.role} text={message.text} attachments={message.attachments} studentName={user?.name} />
            ))}
            {isThinking && <ChatBubble role="scout" text="…" studentName={user?.name} />}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* Quick-action chips: tapping sends it straight in as a message. */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.75rem 0' }}>
          {QUICK_ACTIONS.map((action) => (
            <Chip key={action} onClick={() => sendMessage(action)}>
              {action}
            </Chip>
          ))}
        </div>

        {/* Input bar, pinned at the bottom of the container. */}
        <form onSubmit={handleSubmit} className="scout-input-bar" style={{ marginBottom: '1.5rem' }}>
          {attachments.length > 0 && (
            <div className="scout-attachment-row">
              {attachments.map((attachment) => (
                <AttachmentChip key={attachment.id} attachment={attachment} onRemove={() => removeAttachment(attachment.id)} />
              ))}
            </div>
          )}
          <div className="scout-input-row">
            <button
              type="button"
              className="scout-icon-button"
              aria-label="Attach a photo or file"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              multiple
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
            />
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Scout something…"
              className="scout-textarea"
            />
            <button type="submit" className="scout-icon-button scout-icon-button--send" aria-label="Send message" disabled={!canSend}>
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChatBubble({ role, text, attachments, studentName }) {
  const isScout = role === 'scout'
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignSelf: isScout ? 'flex-start' : 'flex-end', flexDirection: isScout ? 'row' : 'row-reverse', maxWidth: '85%' }}>
      {isScout ? (
        <span className="scout-avatar-badge">
          <Logo size={16} color="var(--color-forest)" />
        </span>
      ) : (
        <AvatarBadge name={studentName} />
      )}
      <div className={`scout-bubble ${isScout ? 'scout-bubble--scout' : 'scout-bubble--student'}`}>
        {attachments && attachments.length > 0 && (
          <div className="scout-attachment-row scout-attachment-row--in-bubble">
            {attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        {text && (isScout ? (
          // Gemini's replies routinely come back as markdown + LaTeX
          // (**bold**, > blockquotes, $\frac{a}{b}$, numbered lists) — render
          // it properly instead of dumping the raw syntax as text. Only
          // Scout's own messages go through this: the student's typed input
          // is never Scout's markdown, so it stays plain text below.
          <div className="scout-markdown">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {text}
            </ReactMarkdown>
          </div>
        ) : (
          <span>{text}</span>
        ))}
      </div>
    </div>
  )
}

// Small preview/pill for a selected photo or file — used both above the
// input bar (pre-send, with a remove "x") and inside a sent student bubble
// (post-send, read-only — onRemove is omitted so no "x" renders there).
function AttachmentChip({ attachment, onRemove }) {
  return (
    <span className="scout-attachment-chip">
      {attachment.previewUrl ? (
        <img src={attachment.previewUrl} alt={attachment.file.name} className="scout-attachment-thumb" />
      ) : (
        <FileText size={14} aria-hidden="true" />
      )}
      <span className="scout-attachment-name">{truncateName(attachment.file.name)}</span>
      {onRemove && (
        <button type="button" className="scout-attachment-remove" onClick={onRemove} aria-label={`Remove ${attachment.file.name}`}>
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

// "homework_page_2_final_REAL.pdf" -> "homework_page_2_….pdf" — keeps the
// extension visible (it's the useful part for "what kind of file is this")
// instead of truncating blindly from the end.
function truncateName(name, maxLength = 18) {
  if (name.length <= maxLength) return name
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot) : ''
  const base = name.slice(0, Math.max(1, maxLength - ext.length - 1))
  return `${base}…${ext}`
}
