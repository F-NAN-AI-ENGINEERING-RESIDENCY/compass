import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DailyIframe from '@daily-co/daily-js'
import { MessageSquare } from 'lucide-react'
import { getDashboard } from '../api/signals.js'
import { getVideoToken } from '../api/lessons.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { keepDailyFrameSized } from '../lib/dailyCallFrame.js'
import { useDailyChat } from '../hooks/useDailyChat.js'
import { ChatPanel } from '../components/ChatPanel.jsx'

// Wireframe spec screen 11 ("Teacher in-call") — "sharing slides with the
// class pulse docked live (same data as 1j)." The main stage is a real Daily
// call frame now (joined via GET /api/lessons/:id/video-token, same as
// StudentLessonPage) — this page is only ever reached via the "present"
// route after a teacher has already started the lesson, so no separate
// live-status check is done here; a 409 (lesson not live) just surfaces as
// videoError below. The docked pulse widget is explicitly the same data as
// the live dashboard (TeacherLessonDashboardPage) — real, not mocked,
// reusing the same GET /api/lessons/:id/dashboard call.
export function TeacherInCallPage() {
  const { lessonId } = useParams()
  const { user } = useAuth()
  const [openCount, setOpenCount] = useState(null)
  const [error, setError] = useState(null)
  const [videoError, setVideoError] = useState(null)

  const videoContainerRef = useRef(null)
  const callFrameRef = useRef(null)
  const stopResizeSyncRef = useRef(null)
  // Also held in state (not just the ref above) so useDailyChat's effect
  // re-runs once the call frame actually exists — refs don't trigger
  // re-renders, so a hook keyed off one would never see it appear.
  const [callFrame, setCallFrame] = useState(null)

  // Joins the real Daily call on mount, tears the frame down on unmount —
  // destroy() implicitly leaves the call too, so no separate leave() call.
  useEffect(() => {
    if (!videoContainerRef.current) return

    let cancelled = false
    getVideoToken(lessonId)
      .then(({ roomUrl, token }) => {
        if (cancelled) return
        const frame = DailyIframe.createFrame(videoContainerRef.current, {
          // display: 'block' matters here — an <iframe> defaults to
          // inline-level rendering, and a height:100% on an inline-level
          // replaced element is inconsistent across browsers (Daily's own
          // docs call this out). Without it, the call frame can end up
          // sized to a small intrinsic height instead of filling this
          // container, which is exactly the "thin letterboxed strip" bug.
          iframeStyle: { width: '100%', height: '100%', border: '0', display: 'block' },
          showLeaveButton: false, // leaving is tied to the lesson's own lifecycle, not a standalone control here
        })
        callFrameRef.current = frame
        // Works around a separate, deeper Daily bug than the display:block
        // one above: even with a correctly-sized iframe box, Daily's own
        // internal video-tile layout can still render at a stale, undersized
        // height (confirmed live — the iframe's own chrome spans full width
        // fine, but the actual video tiles sit in a thin strip with black
        // bars above/below). See lib/dailyCallFrame.js for the full story —
        // this measures our real container and re-sizes the iframe with it.
        stopResizeSyncRef.current = keepDailyFrameSized(videoContainerRef.current)
        frame.join({ url: roomUrl, token, userName: user?.name }).catch((err) => {
          if (!cancelled) setVideoError(err.message)
        })
        setCallFrame(frame) // triggers useDailyChat's effect to attach its listeners
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
      setCallFrame(null)
    }
  }, [lessonId, user?.name])

  useEffect(() => {
    let cancelled = false
    getDashboard(lessonId)
      .then((data) => {
        if (!cancelled) setOpenCount(data.openSignalCount)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    const intervalId = setInterval(() => {
      getDashboard(lessonId)
        .then((data) => !cancelled && setOpenCount(data.openSignalCount))
        .catch(() => {}) // a transient poll failure isn't worth surfacing here; the full dashboard link covers real errors
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [lessonId])

  // Chat panel — same Daily sendAppMessage()/'app-message' transport as
  // StudentLessonPage.jsx (see hooks/useDailyChat.js), so the teacher and
  // students share one real chat, broadcast or private, with no backend
  // involved.
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { messages: chatMessages, participants, sendMessage: sendChatMessage, isReady: isChatReady } = useDailyChat(callFrame, user?.name)

  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column' }}>
      {/* Body: main stage + (optional) chat + the docked pulse widget, side
          by side. flex: 1/minHeight: 0 so this row fills everything above
          the control bar. */}
      <div className="lesson-body">
        {/* Main stage: real Daily call frame, placeholder text only on error.
            minHeight: 0 overrides a flex item's default min-height: auto,
            which otherwise lets content refuse to shrink below its intrinsic
            size inside a flex-grow parent — a classic reason a flex: 1 child
            doesn't actually fill the available height. The video container
            below sets its own explicit width/height: 100%, so it still fills
            this box regardless of the alignItems/justifyContent centering
            used for the (unsized) error text. */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {videoError && (
            <p style={{ color: 'var(--color-text-on-dark-muted)' }}>Couldn't join the call ({videoError})</p>
          )}
          <div
            ref={videoContainerRef}
            style={{ width: '100%', height: '100%', display: videoError ? 'none' : 'block' }}
          />
        </div>

        {isChatOpen && (
          <ChatPanel
            messages={chatMessages}
            participants={participants}
            selfSessionId={participants.local?.session_id}
            isReady={isChatReady}
            onSend={sendChatMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}

        {/* Docked pulse widget — real data, persistent while "presenting." */}
        <div style={{ width: '260px', flexShrink: 0, background: 'var(--color-forest)', color: 'var(--color-text-on-dark)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Class pulse</h2>
          {error ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-on-dark-muted)' }}>{error}</p>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-mono)' }}>
                {openCount === null ? '…' : openCount}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-on-dark-muted)' }}>
                student{openCount === 1 ? '' : 's'} signaled
              </p>
            </>
          )}
          <Link
            to={`/lessons/${lessonId}`}
            className="btn-pill btn-pill--outline"
            style={{ marginTop: '1.5rem', display: 'inline-block', color: 'var(--color-text-on-dark)', borderColor: 'var(--color-text-on-dark)', textDecoration: 'none' }}
          >
            Full dashboard →
          </Link>
        </div>
      </div>

      {/* Control bar — parity with StudentLessonPage.jsx's, just the chat
          toggle here since "I'm lost" is student-only. Daily's own call
          frame already renders its own mute/camera controls inside the
          video iframe (Prebuilt UI), so chat is the one custom control that
          belongs in this bar. */}
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
    </div>
  )
}
