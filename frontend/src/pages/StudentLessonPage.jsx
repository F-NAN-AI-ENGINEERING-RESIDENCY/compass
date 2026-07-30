import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import DailyIframe from '@daily-co/daily-js'
import { Check } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getLesson, getVideoToken } from '../api/lessons.js'
import { createSignal } from '../api/signals.js'

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
          iframeStyle: { width: '100%', height: '100%', border: '0' },
          showLeaveButton: false, // leaving is tied to the lesson's own lifecycle, not a standalone control here
        })
        callFrameRef.current = callFrame
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
      callFrameRef.current?.destroy()
      callFrameRef.current = null
    }
  }, [lesson?.status, lessonId, user?.name])

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
      {/* Main stage: real Daily call frame once live, placeholder text otherwise. */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLoadingLesson ? (
          <p style={{ color: 'var(--color-text-on-dark-muted)' }}>Loading lesson…</p>
        ) : loadError ? (
          <p style={{ color: 'var(--color-text-on-dark-muted)' }}>Couldn't load this lesson ({loadError})</p>
        ) : lesson.status === 'ended' ? (
          <p style={{ color: 'var(--color-text-on-dark-muted)' }}>This lesson has ended.</p>
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
        </div>
      )}
    </div>
  )
}
