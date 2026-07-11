import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listClasses } from '../api/classes.js'
import { createLesson, getLesson, updateLessonStatus } from '../api/lessons.js'

const STORAGE_KEY = 'compass_tracked_sessions'

// Wireframe spec screen 10 ("Teacher sessions hub"). Creating a lesson calls
// the real POST /api/lessons under a class the teacher owns; each row's
// status comes from GET /api/lessons/:id, and Start/End call the real
// PATCH /api/lessons/:id status transition. The list of which lessons to
// track is still only local (no "list my lessons" endpoint exists), so it's
// kept in localStorage same as before — only lesson *creation* was fake.
export function TeacherSessionsHubPage() {
  const [sessions, setSessions] = useState(() => readSaved()) // [{ label, lessonId }]
  const [statuses, setStatuses] = useState({}) // lessonId -> { status, error }

  const [classes, setClasses] = useState([])
  const [classesError, setClassesError] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [trackLabel, setTrackLabel] = useState('')
  const [lessonIdInput, setLessonIdInput] = useState('')

  useEffect(() => {
    listClasses() // GET /api/classes, to populate the "which class" dropdown below
      .then(setClasses)
      .catch((err) => setClassesError(err.message))
  }, [])

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

  function persistSessions(next) {
    setSessions(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  async function handleCreateLesson(event) {
    event.preventDefault()
    setCreateError(null)
    setIsCreating(true)
    try {
      const lesson = await createLesson({ classId: Number(selectedClassId), title }) // real POST /api/lessons
      persistSessions([...sessions, { label: title, lessonId: lesson.lessonId }])
      setTitle('')
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  function handleTrackExisting(event) {
    event.preventDefault()
    if (!trackLabel.trim() || !lessonIdInput.trim()) return
    persistSessions([...sessions, { label: trackLabel.trim(), lessonId: lessonIdInput.trim() }])
    setTrackLabel('')
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

      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Create a lesson</h2>
      {classesError ? (
        <p className="error-text">Couldn't load your classes ({classesError})</p>
      ) : classes.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
          Create a class first (on the Classes page) before scheduling a lesson.
        </p>
      ) : (
        <form onSubmit={handleCreateLesson} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <select
            className="text-input"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            required
            style={{ width: '12rem' }}
          >
            <option value="" disabled>
              Select a class
            </option>
            {classes.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="text-input"
            placeholder="Lesson title (e.g. Fractions review)"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            style={{ flex: 1 }}
            required
          />
          <button type="submit" className="btn-pill btn-pill--primary" disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create lesson'}
          </button>
        </form>
      )}
      {createError && <p className="error-text" style={{ marginBottom: '1rem' }}>{createError}</p>}

      <details style={{ marginBottom: '2rem' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
          Track an existing lesson by ID instead
        </summary>
        <form onSubmit={handleTrackExisting} style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
          <input
            type="text"
            className="text-input"
            placeholder="Label (e.g. Period 3 — Mon)"
            value={trackLabel}
            onChange={(event) => setTrackLabel(event.target.value)}
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
          <button type="submit" className="btn-pill btn-pill--outline">
            Track
          </button>
        </form>
      </details>

      {sessions.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>No sessions tracked yet — create one above.</p>
      ) : (
        sessions.map((session) => {
          const info = statuses[session.lessonId]
          return (
            <div
              key={session.lessonId}
              className="card"
              style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
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
