import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDashboard } from '../api/signals.js'

// Wireframe spec screen 11 ("Teacher in-call") — "sharing slides with the
// class pulse docked live (same data as 1j)." The slide-share stage itself
// needs Daily.co (not built, same gap as the student in-call screen), but
// the docked pulse widget is explicitly the same data as the live dashboard
// (TeacherLessonDashboardPage) — so unlike the video surface, this part is
// real, not mocked, reusing the same GET /api/lessons/:id/dashboard call.
export function TeacherInCallPage() {
  const { lessonId } = useParams()
  const [openCount, setOpenCount] = useState(null)
  const [error, setError] = useState(null)

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
      {/* Main stage placeholder — needs Daily.co screen-share, not built. */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-on-dark-muted)' }}>
          Slide/screen share isn't built yet (needs Daily.co integration)
        </p>
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
