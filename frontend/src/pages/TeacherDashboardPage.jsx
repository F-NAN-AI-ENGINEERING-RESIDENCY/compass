import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClass, deleteClass, getClass, listClasses, updateClass } from '../api/classes.js'
import { AvatarBadge } from '../components/AvatarBadge.jsx'

// Wireframe spec screen 13 ("Class management"): create a class, view its
// roster, rename it, or delete it. Classes are fetched from GET /api/classes
// on load, so they persist across navigation/reload instead of only living
// in this page's session state.
export function TeacherDashboardPage() {
  const [classes, setClasses] = useState([]) // each augmented with roster/rosterError once fetched
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [className, setClassName] = useState('') // controlled input for the "create class" form
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [lessonIdInput, setLessonIdInput] = useState('') // controlled input for the "jump to lesson" shortcut below
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function loadClasses() {
      try {
        const persisted = await listClasses() // GET /api/classes
        if (cancelled) return
        setClasses(persisted.map((c) => ({ ...c, roster: null, rosterError: null })))
        persisted.forEach((c) => loadRoster(c.classId))
      } catch (err) {
        if (!cancelled) setLoadError(err.message)
      } finally {
        if (!cancelled) setIsLoadingClasses(false)
      }
    }
    loadClasses()
    return () => {
      cancelled = true // avoids setting state after the component's unmounted if this outlives it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadRoster is stable enough for a mount-only effect
  }, [])

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
      const detail = await getClass(classId) // GET /api/classes/:id — returns a real enrollments list
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

  async function handleRename(classId, newName) {
    const updated = await updateClass(classId, { name: newName }) // PATCH /api/classes/:id
    setClasses((current) => current.map((c) => (c.classId === classId ? { ...c, ...updated } : c)))
  }

  async function handleDelete(classId) {
    await deleteClass(classId) // DELETE /api/classes/:id — cascades to its enrollments/lessons server-side
    setClasses((current) => current.filter((c) => c.classId !== classId))
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

      {isLoadingClasses ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>Loading your classes…</p>
      ) : loadError ? (
        <p className="error-text">Couldn't load your classes ({loadError})</p>
      ) : classes.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>No classes yet — create one above.</p>
      ) : (
        classes.map((classItem) => (
          <ClassCard
            key={classItem.classId}
            classItem={classItem}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))
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

// One class's card: name (editable), join code, roster, and delete.
function ClassCard({ classItem, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(classItem.name)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleSaveName(event) {
    event.preventDefault()
    setSaveError(null)
    setIsSaving(true)
    try {
      await onRename(classItem.classId, editedName)
      setIsEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteClick() {
    if (!window.confirm(`Delete "${classItem.name}"? This also removes its enrollments and lessons.`)) {
      return
    }
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await onDelete(classItem.classId)
    } catch (err) {
      setDeleteError(err.message)
      setIsDeleting(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
        {isEditing ? (
          <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <input
              type="text"
              className="text-input"
              style={{ flex: 1 }}
              value={editedName}
              onChange={(event) => setEditedName(event.target.value)}
              required
              autoFocus
            />
            <button type="submit" className="btn-pill btn-pill--primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="btn-pill btn-pill--outline"
              onClick={() => {
                setIsEditing(false)
                setEditedName(classItem.name)
                setSaveError(null)
              }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <h2 style={{ fontSize: '1.25rem' }}>{classItem.name}</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
              {/* Join code in the spec's mono typeface — it's data students type in, not prose. */}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                {classItem.joinCode}
              </span>
              <button type="button" className="btn-pill btn-pill--outline" onClick={() => setIsEditing(true)}>
                Rename
              </button>
              <button
                type="button"
                className="btn-pill btn-pill--outline"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
      {saveError && <p className="error-text">{saveError}</p>}
      {deleteError && <p className="error-text">{deleteError}</p>}

      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', margin: '1rem 0 0.5rem' }}>
        Roster
      </h3>
      {classItem.rosterError ? (
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
