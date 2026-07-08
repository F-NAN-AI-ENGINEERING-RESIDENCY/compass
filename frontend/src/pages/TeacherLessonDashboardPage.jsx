import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom' // reads the :lessonId part of the current URL
import { getLesson } from '../api/lessons.js'
import { getDashboard, resolveSignal } from '../api/signals.js'

const POLL_INTERVAL_MS = 5000 // no WebSocket exists yet, so this is how "near real-time" is approximated

// Sprint 2's three teacher-facing dashboard requirements in one page: the
// list of students who've signaled (with count + timestamp), a skill-level
// view, and marking a signal resolved.
//
// Identity note: student names ARE shown here on purpose — per the
// 2026-07-07 backend decision (see ConfusionSignal.student_id's comment in
// app/models/confusion_signal.py), the teacher always sees who signaled;
// anonymity is only ever from classmates. This matches the real API, but it
// contradicts the "never who" pitch copy on the login page and the wireframe
// spec doc — flagged to the team separately, not something to silently
// paper over here.
export function TeacherLessonDashboardPage() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [signals, setSignals] = useState({}) // keyed by signalId so repeated polls can upsert in place
  const [skillSnapshot, setSkillSnapshot] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const sinceRef = useRef(null) // the timestamp cursor for incremental polls; a ref because updating it shouldn't trigger a re-render

  useEffect(() => {
    let cancelled = false // guards against setting state after the component unmounts (e.g. navigating away mid-request)

    async function loadLesson() {
      try {
        setLesson(await getLesson(lessonId))
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    async function poll() {
      const requestedAt = new Date().toISOString() // captured before the request so nothing that changes mid-flight is missed
      try {
        const dashboard = await getDashboard(lessonId, sinceRef.current)
        if (cancelled) return
        setError(null)

        setSignals((current) => {
          const next = { ...current }
          for (const signal of dashboard.signals) {
            if (signal.status === 'open') {
              next[signal.signalId] = signal // new or still-open — add/refresh it
            } else {
              delete next[signal.signalId] // resolved/acknowledged elsewhere — drop it from the active list
            }
          }
          return next
        })
        // Skill snapshot has no incremental mode on the backend — every
        // response carries the full current picture, so replace outright.
        setSkillSnapshot(dashboard.skillSnapshot)
        sinceRef.current = requestedAt
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadLesson()
    poll() // first load: sinceRef.current is still null, so this fetches all currently-open signals
    const intervalId = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [lessonId])

  async function handleResolve(signalId) {
    // Optimistic removal — don't wait for the next poll to reflect it.
    setSignals((current) => {
      const next = { ...current }
      delete next[signalId]
      return next
    })
    try {
      await resolveSignal(lessonId, signalId)
    } catch (err) {
      setError(`Couldn't mark that signal resolved: ${err.message}`)
      // Next poll will restore it to the list automatically if it's still open server-side.
    }
  }

  const openSignals = Object.values(signals).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Live dashboard</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        {lesson ? `Lesson #${lesson.lessonId} · ${lesson.status}` : `Lesson #${lessonId}`}
      </p>

      {error && <p className="error-text">{error}</p>}

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          {isLoading ? 'Loading…' : `${openSignals.length} student${openSignals.length === 1 ? '' : 's'} signaled`}
        </h2>
        {!isLoading && openSignals.length === 0 && (
          <p style={{ color: 'var(--color-ink-muted)' }}>No open "I'm lost" signals right now.</p>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {openSignals.map((signal) => (
            <li
              key={signal.signalId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0',
                borderBottom: '1px solid var(--color-cream-dim)',
              }}
            >
              <div>
                <div>{signal.studentName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(signal.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button className="btn-pill btn-pill--outline" onClick={() => handleResolve(signal.signalId)}>
                Mark resolved
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Skill levels</h2>
        {/* This is a class-wide average per topic, not a per-student breakdown —
            that's the actual shape GET /dashboard returns (see
            app/services/signal_service.get_dashboard); there's no per-student
            skills endpoint on the backend yet. */}
        {skillSnapshot.length === 0 ? (
          <p style={{ color: 'var(--color-ink-muted)' }}>No skill data for this class yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {skillSnapshot.map((skill) => (
              <li key={skill.skillId} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--color-cream-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{skill.skillName}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {Math.round(skill.classAverageLevel * 100)}%
                  </span>
                </div>
                {skill.studentsBelowThreshold > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-clay)' }}>
                    {skill.studentsBelowThreshold} student{skill.studentsBelowThreshold === 1 ? '' : 's'} below the
                    class alert threshold
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
