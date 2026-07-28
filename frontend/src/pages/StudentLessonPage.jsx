import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLesson } from '../api/lessons.js'
import { createSignal } from '../api/signals.js'

// Wireframe spec screen 09 ("Student in-call"), scoped to just the part with
// real backend support: the "I'm lost" control and its three states
// (idle -> sending -> sent), per Sprint 2's actual requirements ("one tap, no
// confirmation needed" + "brief private confirmation that signal was sent").
// POST /api/lessons/:id/signals is real and merged — tapping this button
// shows up live on the teacher's dashboard (TeacherLessonDashboardPage).
//
// The main video-call stage itself (shared screen, other participants) needs
// Daily.co integration that doesn't exist in this app yet, so that part is a
// plain placeholder, not a mocked video tile — labeling it as fake video
// would be more misleading than just saying what's missing.
//
// No lesson title is shown here — LessonResponse has no `title` field at
// all (even though the Lesson model stores one; see the note in
// api/lessons.js), so there's nothing real to display without a backend
// schema change.
export function StudentLessonPage() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [isLoadingLesson, setIsLoadingLesson] = useState(true)
  const [loadError, setLoadError] = useState(null)
  // 'idle' -> 'sending' -> 'sent' -> (fades back to 'idle' after a few seconds)
  const [signalState, setSignalState] = useState('idle')
  const [error, setError] = useState(null)

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

  async function handleImLost() {
    setError(null)
    setSignalState('sending')
    try {
      await createSignal(lessonId)
      setSignalState('sent')
      setTimeout(() => setSignalState('idle'), 4000) // one-tap, no confirmation dialog — just a brief private acknowledgment
    } catch (err) {
      setError(err.message) // e.g. "Lesson ... is not live" (409) or "You are not enrolled" (403)
      setSignalState('idle')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#111' }}>
      {/* Main stage placeholder — see file-level note above on why this isn't a mocked video tile. */}
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
        ) : (
          <p style={{ color: 'var(--color-text-on-dark-muted)' }}>
            Lesson #{lessonId} — shared screen/video isn't built yet (needs Daily.co integration)
          </p>
        )}
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
              background: signalState === 'sent' ? 'var(--color-clay)' : 'var(--color-cream)',
              color: signalState === 'sent' ? 'var(--color-text-on-dark)' : 'var(--color-ink)',
              fontWeight: 700,
              padding: '1rem 2rem',
            }}
          >
            {signalState === 'idle' && "I'm lost"}
            {signalState === 'sending' && 'Sending…'}
            {signalState === 'sent' && 'Sent — your teacher can see this'}
          </button>
        </div>
      )}
    </div>
  )
}
