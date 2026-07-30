import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DailyIframe from '@daily-co/daily-js'
import { getDashboard } from '../api/signals.js'
import { getVideoToken } from '../api/lessons.js'
import { useAuth } from '../auth/AuthContext.jsx'

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

  // Joins the real Daily call on mount, tears the frame down on unmount —
  // destroy() implicitly leaves the call too, so no separate leave() call.
  useEffect(() => {
    if (!videoContainerRef.current) return

    let cancelled = false
    getVideoToken(lessonId)
      .then(({ roomUrl, token }) => {
        if (cancelled) return
        const callFrame = DailyIframe.createFrame(videoContainerRef.current, {
          iframeStyle: { width: '100%', height: '100%', border: '0' },
          showLeaveButton: false, // leaving is tied to the lesson's own lifecycle, not a standalone control here
        })
        callFrameRef.current = callFrame
        callFrame.join({ url: roomUrl, token, userName: user?.name }).catch((err) => {
          if (!cancelled) setVideoError(err.message)
        })
      })
      .catch((err) => {
        if (!cancelled) setVideoError(err.message)
      })

    return () => {
      cancelled = true
      callFrameRef.current?.destroy()
      callFrameRef.current = null
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

  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex' }}>
      {/* Main stage: real Daily call frame, placeholder text only on error. */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {videoError && (
          <p style={{ color: 'var(--color-text-on-dark-muted)' }}>Couldn't join the call ({videoError})</p>
        )}
        <div
          ref={videoContainerRef}
          style={{ width: '100%', height: '100%', display: videoError ? 'none' : 'block' }}
        />
      </div>

      {/* Docked pulse widget — real data, persistent while "presenting." */}
      <div style={{ width: '260px', background: 'var(--color-forest)', color: 'var(--color-text-on-dark)', padding: '1.5rem' }}>
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
  )
}
