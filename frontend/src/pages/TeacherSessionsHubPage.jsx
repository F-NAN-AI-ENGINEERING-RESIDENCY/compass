import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLesson, updateLessonStatus } from '../api/lessons.js'

const STORAGE_KEY = 'compass_tracked_sessions'

// Wireframe spec screen 10 ("Teacher sessions hub"). There's no
// POST /api/lessons (create) or "list my lessons" endpoint, so "scheduling"
// here can't create a real lesson — it just labels and locally tracks a
// lesson id you already know (e.g. one from the seed data), same pattern as
// the "jump to lesson" shortcuts elsewhere. What IS real: each row's status
// comes from GET /api/lessons/:id, and Start/End call the real
// PATCH /api/lessons/:id status transition.
export function TeacherSessionsHubPage() {
  const [sessions, setSessions] = useState(() => readSaved()) // [{ label, lessonId }]
  const [statuses, setStatuses] = useState({}) // lessonId -> { status, error }
  const [label, setLabel] = useState('')
  const [lessonIdInput, setLessonIdInput] = useState('')

  useEffect(() => {
    sessions.forEach((session) => refreshStatus(session.lessonId))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on mount/list-change, not on every statuses update
  }, [sessions])

  async function refreshStatus(lessonId) {
    try {
      const lesson = await getLesson(lessonId)
      setStatuses((current) => ({ ...current, [lessonId]: { status: lesson.status, error: null } }))
    } catch (err) {
      setStatuses((current) => ({ ...current, [lessonId]: { status: null, error: err.message } }))
    }
  }

  function handleAddSession(event) {
    event.preventDefault()
    if (!label.trim() || !lessonIdInput.trim()) return
    const next = [...sessions, { label: label.trim(), lessonId: lessonIdInput.trim() }]
    setSessions(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setLabel('')
    setLessonIdInput('')
  }

  async function handleTransition(lessonId, status) {
    try {
      await updateLessonStatus(lessonId, status) // real PATCH
      await refreshStatus(lessonId)
    } catch (err) {
      setStatuses((current) => ({ ...current, [lessonId]: { ...current[lessonId], error: err.message } }))
    }
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Sessions</h1>

      <form onSubmit={handleAddSession} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <input
          type="text"
          className="text-input"
          placeholder="Label (e.g. Period 3 — Mon)"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          className="text-input"
          placeholder="Lesson ID"
          value={lessonIdInput}
          onChange={(event) => setLessonIdInput(event.target.value)}
          style={{ width: '8rem' }}
        />
        <button type="submit" className="btn-pill btn-pill--primary">
          Schedule
        </button>
      </form>

      {sessions.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>No sessions tracked yet — schedule one above.</p>
      ) : (
        sessions.map((session) => {
          const info = statuses[session.lessonId]
          return (
            <div key={session.lessonId} className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{session.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                  Lesson #{session.lessonId} ·{' '}
                  {info?.error ? (
                    <span style={{ color: 'var(--color-clay)' }}>{info.error}</span>
                  ) : (
                    info?.status ?? 'loading…'
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {info?.status === 'scheduled' && (
                  <button className="btn-pill btn-pill--primary" onClick={() => handleTransition(session.lessonId, 'live')}>
                    Start
                  </button>
                )}
                {info?.status === 'live' && (
                  <>
                    <Link to={`/lessons/${session.lessonId}`} className="btn-pill btn-pill--outline" style={{ textDecoration: 'none' }}>
                      Live dashboard
                    </Link>
                    <button className="btn-pill btn-pill--outline" onClick={() => handleTransition(session.lessonId, 'ended')}>
                      End
                    </button>
                  </>
                )}
                {info?.status === 'ended' && (
                  <Link to="/recordings" className="btn-pill btn-pill--outline" style={{ textDecoration: 'none' }}>
                    View recording
                  </Link>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}
