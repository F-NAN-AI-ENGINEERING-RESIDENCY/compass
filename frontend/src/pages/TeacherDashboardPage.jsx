import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClass, getClass } from '../api/classes.js'
import { AvatarBadge } from '../components/AvatarBadge.jsx'

// Wireframe spec screen 13 ("Class management"), scoped to Sprint 1's actual
// requirement: create a class and view its roster. No edit/delete class yet —
// those (the "U" and "D" of the spec's CRUD note) aren't part of this sprint.
//
// There's no GET /api/classes endpoint to list a teacher's classes (only
// POST /api/classes and GET /api/classes/:id exist), so this page tracks
// classes created during the current session in local state rather than
// fetching a persisted list — reloading the page loses that list until a
// real "list my classes" endpoint exists.
//
// Roster: felix/roster-endpoints merged to main, and GET /api/classes/:id
// now returns a populated `enrollments` list for the owning teacher (see
// EnrolledStudent in app/schemas/classes.py) — create-class -> join-by-code
// -> roster is a real end-to-end flow now, not just a shell.
export function TeacherDashboardPage() {
  const [classes, setClasses] = useState([]) // classes created this session, each augmented with its roster once fetched
  const [className, setClassName] = useState('') // controlled input for the "create class" form
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [lessonIdInput, setLessonIdInput] = useState('') // controlled input for the "jump to lesson" shortcut below
  const navigate = useNavigate()

  function handleJumpToLesson(event) {
    event.preventDefault()
    if (lessonIdInput.trim()) navigate(`/lessons/${lessonIdInput.trim()}`)
  }

  async function handleCreateClass(event) {
    event.preventDefault()
    setCreateError(null)
    setIsCreating(true)
    try {
      const newClass = await createClass({ name: className }) // POST /api/classes
      setClassName('') // clear the form for the next class
      setClasses((current) => [...current, { ...newClass, roster: null, rosterError: null }])
      loadRoster(newClass.classId) // immediately fetch its roster so "view roster" needs no extra click
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  async function loadRoster(classId) {
    try {
      const detail = await getClass(classId) // GET /api/classes/:id — now returns a real enrollments list
      // `enrollments` is only populated for the owning teacher (student
      // requests get null per the backend) — ?? [] just covers that null
      // case and the brief moment before a fresh class has any enrollments yet.
      const roster = detail.enrollments ?? []
      setClasses((current) =>
        current.map((c) => (c.classId === classId ? { ...c, roster, rosterError: null } : c)),
      )
    } catch (err) {
      setClasses((current) =>
        current.map((c) => (c.classId === classId ? { ...c, rosterError: err.message } : c)),
      )
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Classes</h1>

      {/* "Create class" form — the spec's primary pill button next to the page title. */}
      <form
        onSubmit={handleCreateClass}
        style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '2rem' }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            className="text-input"
            style={{ width: '100%' }}
            placeholder="Class name (e.g. Period 3 Algebra)"
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            required
          />
          {createError && <p className="error-text">{createError}</p>}
        </div>
        <button type="submit" className="btn-pill btn-pill--primary" disabled={isCreating}>
          {isCreating ? 'Creating…' : 'Create class'}
        </button>
      </form>

      {classes.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>No classes yet — create one above.</p>
      ) : (
        classes.map((classItem) => <ClassCard key={classItem.classId} classItem={classItem} />)
      )}

      {/* There's no POST /api/lessons or "list my lessons" endpoint yet, so
          there's no in-app way to create or browse to a lesson. This is a
          stand-in shortcut until that exists — enter a known lesson id to
          jump straight to its live dashboard (Sprint 2). */}
      <form
        onSubmit={handleJumpToLesson}
        style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem', alignItems: 'center' }}
      >
        <input
          type="number"
          className="text-input"
          placeholder="Lesson ID"
          value={lessonIdInput}
          onChange={(event) => setLessonIdInput(event.target.value)}
          style={{ width: '8rem' }}
        />
        <button type="submit" className="btn-pill btn-pill--outline">
          Go to lesson dashboard →
        </button>
      </form>
    </div>
  )
}

// One class's card: name, join code, and its roster (or an explanation of
// why the roster couldn't load).
function ClassCard({ classItem }) {
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ fontSize: '1.25rem' }}>{classItem.name}</h2>
        {/* Join code in the spec's mono typeface — it's data students type in, not prose. */}
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
          {classItem.joinCode}
        </span>
      </div>

      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', margin: '1rem 0 0.5rem' }}>
        Roster
      </h3>
      {classItem.rosterError ? (
        // Only fires on a genuine error (network issue, 403, 404) — the
        // happy path now returns real roster data, see the file-level note above.
        <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>
          Roster unavailable ({classItem.rosterError})
        </p>
      ) : classItem.roster === null ? (
        <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>Loading roster…</p>
      ) : classItem.roster.length === 0 ? (
        <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>
          No students enrolled yet. Share the join code above.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {classItem.roster.map((student) => (
            <li
              key={student.studentId}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0' }}
            >
              <AvatarBadge name={student.studentName} />
              <span>{student.studentName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
