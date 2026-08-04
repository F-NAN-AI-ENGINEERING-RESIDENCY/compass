import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import DailyIframe from '@daily-co/daily-js'
import { Check, MessageSquare } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getLesson, getVideoToken } from '../api/lessons.js'
import { createSignal } from '../api/signals.js'
import { LessonReflection } from '../components/LessonReflection.jsx'
import { ChatPanel } from '../components/ChatPanel.jsx'
import { lessonSocketUrl } from '../lib/lessonSocket.js'
import { keepDailyFrameSized } from '../lib/dailyCallFrame.js'
// Deliberately NOT importing getDashboard/resolveSignal from api/signals.js.
// Those return/mutate confusion signals with student identity attached —
// correct for the teacher's dashboard, unsafe here. See the ANONYMITY
// BOUNDARY comment in api/signals.js before adding any import to this file.

// Wireframe spec screen 09 ("Student in-call"). Three things live on this
// page now:
//   - the "I'm lost" control (idle -> sending -> idle) plus a private
//     confirmation toast, per Sprint 2's actual requirements ("one tap, no
//     confirmation needed" + "brief private confirmation that signal was
//     sent"). POST /api/lessons/:id/signals is real and merged — tapping
//     this button shows up live on the teacher's dashboard
//     (TeacherLessonDashboardPage), aggregated there without naming the
//     student to classmates.
//   - the real video call itself: Daily's embedded call frame, joined via
//     GET /api/lessons/:id/video-token once the lesson goes live.
//   - lesson-status gating: the video call and the "I'm lost" control both
//     only render once the lesson is actually live (loading/waiting/ended
//     states are handled below instead).
//
// ANONYMITY BOUNDARY: this component must show a student ONLY their own
// signal confirmation, never any information about other students' signals
// (not a name, not an anonymized count, not an indicator of any kind). The
// entire value of "I'm lost" is that classmates can't tell who asked for
// help — and even a de-identified count can de-anonymize a student in a
// small class by process of elimination. Do not add a "N classmates are
// confused" indicator or similar to this page or any component it renders.
//
// No lesson title is shown here — LessonResponse has no `title` field at
// all (even though the Lesson model stores one; see the note in
// api/lessons.js), so there's nothing real to display without a backend
// schema change.
export function StudentLessonPage() {
  const { lessonId } = useParams()
  const { user } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [isLoadingLesson, setIsLoadingLesson] = useState(true)
  const [loadError, setLoadError] = useState(null)
  // 'idle' -> 'sending' -> 'idle' (the toast below carries the "sent" confirmation)
  const [signalState, setSignalState] = useState('idle')
  const [error, setError] = useState(null)
  const [videoError, setVideoError] = useState(null)

  const videoContainerRef = useRef(null)
  const callFrameRef = useRef(null)
  const stopResizeSyncRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getLesson(lessonId)
      .then((data) => {
        if (!cancelled) setLesson(data)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLesson(false)
      })
    return () => {
      cancelled = true
    }
  }, [lessonId])

  // Joins the real Daily call once the lesson is live, and tears the frame
  // down the moment it stops being live (lesson ends) or this page unmounts
  // — destroy() implicitly leaves the call too, so no separate leave() call
  // is needed here.
  useEffect(() => {
    if (lesson?.status !== 'live' || !videoContainerRef.current) return

    let cancelled = false
    setVideoError(null)

    getVideoToken(lessonId)
      .then(({ roomUrl, token }) => {
        if (cancelled) return
        const callFrame = DailyIframe.createFrame(videoContainerRef.current, {
          // display: 'block' matters here — an <iframe> defaults to
          // inline-level rendering, and a height:100% on an inline-level
          // replaced element is inconsistent across browsers (Daily's own
          // docs call this out). Without it, the call frame can end up
          // sized to a small intrinsic height instead of filling this
          // container, which is exactly the "thin letterboxed strip" bug.
          iframeStyle: { width: '100%', height: '100%', border: '0', display: 'block' },
          showLeaveButton: false, // leaving is tied to the lesson's own lifecycle, not a standalone control here
        })
        callFrameRef.current = callFrame
        // Works around a separate, deeper Daily bug than the display:block
        // one above: even with a correctly-sized iframe box, Daily's own
        // internal video-tile layout can still render at a stale, undersized
        // height (confirmed live — the iframe's own chrome spans full width
        // fine, but the actual video tiles sit in a thin strip with black
        // bars above/below). See lib/dailyCallFrame.js for the full story —
        // this measures our real container and re-sizes the iframe with it.
        stopResizeSyncRef.current = keepDailyFrameSized(videoContainerRef.current)
        // userName pre-fills Daily's prejoin screen with the student's real
        // name so they don't have to type it in — we already know who they
        // are, no reason to ask.
        callFrame.join({ url: roomUrl, token, userName: user?.name }).catch((err) => {
          if (!cancelled) setVideoError(err.message)
        })
      })
      .catch((err) => {
        if (!cancelled) setVideoError(err.message)
      })

    return () => {
      cancelled = true
      stopResizeSyncRef.current?.()
      stopResizeSyncRef.current = null
      callFrameRef.current?.destroy()
      callFrameRef.current = null
    }
  }, [lesson?.status, lessonId, user?.name])

  // Chat panel, docked on the right (Zoom/Meet-style), toggled via the
  // control bar below.
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [isSocketOpen, setIsSocketOpen] = useState(false)
  const socketRef = useRef(null)

  // Opens the lesson's real WebSocket once it's live, same lifecycle as the
  // video-join effect above.
  //
  // NOT WIRED SERVER-SIDE YET: app/websockets/dashboard_ws.py's message loop
  // only recognizes {"type": "ping"} today — everything else it receives,
  // including the {"type": "chat", ...} frames sent below, is silently
  // dropped with no rebroadcast to other connected clients. This effect and
  // ChatPanel are written to handle incoming {type: "chat"} messages the
  // moment the backend adds that support (mirroring how it already
  // broadcasts signal/lesson events via app/websockets/broadcaster.py) —
  // until then, a sent message only ever reaches the sender's own browser,
  // via the local-echo in handleSendChatMessage below.
  useEffect(() => {
    if (lesson?.status !== 'live') return

    const socket = new WebSocket(lessonSocketUrl(lessonId))
    socketRef.current = socket

    socket.onopen = () => setIsSocketOpen(true)
    socket.onclose = () => setIsSocketOpen(false)
    socket.onerror = () => setIsSocketOpen(false)
    socket.onmessage = (event) => {
      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        return // not JSON — ignore rather than crash on a stray frame
      }
      if (message.type === 'chat') {
        setChatMessages((current) => [...current, message.data])
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
      setIsSocketOpen(false)
    }
  }, [lesson?.status, lessonId])

  function handleSendChatMessage(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderName: user?.name || 'You',
      text: trimmed,
      sentAt: new Date().toISOString(),
    }
    // Local-echo immediately — see the NOT WIRED SERVER-SIDE note above.
    // Without this, the sender wouldn't see their own message appear at all,
    // since the server doesn't send it back yet.
    setChatMessages((current) => [...current, message])
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'chat', data: message }))
    }
  }

  // PRIVACY NOTE: this confirmation toast lives only in this component — the
  // student's own lesson view. It must never be added to
  // TeacherLessonDashboardPage or any other shared/projected view. The whole
  // point of the "I'm lost" signal is that a classmate (or the teacher, in
  // the sense of "which student") never sees who sent it; the teacher's
  // dashboard already surfaces signals in aggregate elsewhere. This toast is
  // purely local, private feedback to the sender that their tap went through.
  const [showConfirmation, setShowConfirmation] = useState(false)
  const dismissTimerRef = useRef(null)

  // Clear any pending auto-dismiss timer on unmount, so it never fires a
  // setState against an unmounted component (a memory-leak warning waiting
  // to happen if the student navigates away mid-toast).
  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current)
  }, [])

  async function handleImLost() {
    setError(null)
    setSignalState('sending')
    try {
      await createSignal(lessonId) // POST /api/lessons/:id/signals
      setSignalState('idle')

      // Only show the confirmation on a successful send — a failed send
      // falls into the catch block below and surfaces the existing error
      // state instead, never this toast.
      //
      // Clear any timer from a previous signal first: if the student sends
      // a second "I'm lost" later in the same lesson before the first
      // toast's timer fired, this restarts the auto-dismiss clock cleanly
      // instead of the old timer cutting the new toast short.
      clearTimeout(dismissTimerRef.current)
      setShowConfirmation(true)
      dismissTimerRef.current = setTimeout(() => setShowConfirmation(false), 3500)
    } catch (err) {
      setError(err.message) // e.g. "Lesson ... is not live" (409) or "You are not enrolled" (403)
      setSignalState('idle')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#111' }}>
      {/* Body: main stage + (optional) chat sidebar, side by side —
          Zoom/Meet-style. flex: 1/minHeight: 0 here so this row fills
          everything above the control bar; the control bar itself sits
          outside this row so it spans the full width underneath both. */}
      <div className="lesson-body">
        {/* Main stage: real Daily call frame once live, placeholder text
            otherwise. minHeight: 0 overrides a flex item's default
            min-height: auto, which otherwise lets content refuse to shrink
            below its intrinsic size inside a flex-grow parent — a classic
            reason a flex: 1 child doesn't actually fill the available height.
            The video container below sets its own explicit width/height:
            100%, so it still fills this box regardless of the
            alignItems/justifyContent centering used for the (unsized)
            loading/waiting/error text states. */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLoadingLesson ? (
            <p style={{ color: 'var(--color-text-on-dark-muted)' }}>Loading lesson…</p>
          ) : loadError ? (
            <p style={{ color: 'var(--color-text-on-dark-muted)' }}>Couldn't load this lesson ({loadError})</p>
          ) : lesson.status === 'ended' ? (
            <LessonReflection lessonId={lessonId} />
          ) : lesson.status !== 'live' ? (
            <p style={{ color: 'var(--color-text-on-dark-muted)' }}>
              Waiting for your teacher to start the lesson…
            </p>
          ) : videoError ? (
            <p style={{ color: 'var(--color-text-on-dark-muted)' }}>Couldn't join the call ({videoError})</p>
          ) : null}
          {/* Always rendered (not conditionally mounted) once we know the lesson
              is live, so videoContainerRef.current exists by the time the join
              effect runs — hidden via display none rather than unmounted while
              a videoError is showing instead, so a retry wouldn't need a fresh ref. */}
          {lesson?.status === 'live' && (
            <div
              ref={videoContainerRef}
              style={{ width: '100%', height: '100%', display: videoError ? 'none' : 'block' }}
            />
          )}
        </div>

        {isChatOpen && lesson?.status === 'live' && (
          <ChatPanel
            messages={chatMessages}
            isConnected={isSocketOpen}
            onSend={handleSendChatMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      {/* Private confirmation toast. Always rendered (not conditionally
          mounted) so the opacity/transform transition below can actually
          animate in both directions — toggling the class, not the element,
          is what makes the fade in AND out. `pointer-events: none` at rest
          keeps it from ever intercepting a click while invisible. Deliberately
          NOT nested inside the `lesson?.status === 'live'` gate below — it
          must always be mounted regardless of lesson status for the
          animation to work correctly in both directions. */}
      <div
        role="status"
        aria-live="polite"
        className={`signal-confirmation-toast${showConfirmation ? ' signal-confirmation-toast--visible' : ''}`}
      >
        <Check size={16} aria-hidden="true" />
        <span>Your teacher knows. Sit tight.</span>
      </div>

      {/* Control bar, docked at the bottom per the spec — only shown once the
          lesson is actually live, since signaling doesn't make sense before
          or after that (and the backend would 409 on the attempt anyway). */}
      {lesson?.status === 'live' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1.5rem',
            background: 'var(--color-forest)',
          }}
        >
          {error && <p className="error-text" style={{ position: 'absolute', bottom: '5rem' }}>{error}</p>}
          <button
            className="btn-pill"
            onClick={handleImLost}
            disabled={signalState === 'sending'}
            style={{
              background: 'var(--color-cream)',
              color: 'var(--color-ink)',
              fontWeight: 700,
              padding: '1rem 2rem',
            }}
          >
            {signalState === 'idle' && "I'm lost"}
            {signalState === 'sending' && 'Sending…'}
          </button>
          {/* Daily's own call frame already renders its own mute/camera
              controls inside the video iframe (Prebuilt UI, not something we
              draw ourselves) — chat is the one custom control that belongs
              in this bar alongside "I'm lost". */}
          <button
            type="button"
            className="btn-pill lesson-chat-toggle"
            onClick={() => setIsChatOpen((current) => !current)}
            aria-pressed={isChatOpen}
          >
            <MessageSquare size={18} aria-hidden="true" />
            Chat
          </button>
        </div>
      )}
    </div>
  )
}
