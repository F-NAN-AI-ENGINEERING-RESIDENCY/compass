import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { joinClass, listMyEnrollments } from '../api/enrollments.js'
import { getClass } from '../api/classes.js'

// Wireframe spec's student home shell: "join class, view enrolled classes."
export function StudentHomePage() {
  const [classes, setClasses] = useState([])
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [loading, setLoading] = useState(true) // true while the on-load enrollments fetch is in flight
  const [error, setError] = useState(null) // shared by the load fetch and the join submit
  const [joinSuccess, setJoinSuccess] = useState(null)
  const [lessonIdInput, setLessonIdInput] = useState('') // controlled input for the "go to lesson" shortcut below
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function loadEnrolledClasses() {
      try {
        const enrollments = await listMyEnrollments()
        // EnrollmentResponse only has {enrollmentId, studentId, classId,
        // enrolledAt} — no class name — so fetch each class's details too,
        // same chaining pattern as the join flow below.
        const classDetails = await Promise.all(
          enrollments.map((enrollment) => getClass(enrollment.classId)),
        )
        if (!cancelled) setClasses(classDetails)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadEnrolledClasses()
    return () => {
      cancelled = true
    }
  }, [])

  function handleGoToLesson(event) {
    event.preventDefault()
    if (lessonIdInput.trim()) navigate(`/student/lessons/${lessonIdInput.trim()}/join`)
  }

  async function handleJoin(event) {
    event.preventDefault()
    setError(null)
    setJoinSuccess(null)
    setIsJoining(true)
    try {
      const enrollment = await joinClass(joinCode.trim().toUpperCase()) // join codes are uppercase (see Class.generate_join_code's alphabet)
      setJoinCode('')
      const classDetail = await getClass(enrollment.classId)
      setClasses((current) => [...current, classDetail])
      setJoinSuccess(`Joined ${classDetail.name}!`)
    } catch (err) {
      setError(err.message) // e.g. "No class found for join code..." or "Already enrolled in this class"
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>My classes</h1>

      <form
        onSubmit={handleJoin}
        style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '2rem' }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            className="text-input"
            style={{ width: '100%', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
            placeholder="Join code (e.g. ALG3XYZ)"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-pill btn-pill--primary" disabled={isJoining}>
          {isJoining ? 'Joining…' : 'Join class'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {joinSuccess && <p style={{ color: 'var(--color-forest)', marginBottom: '1rem' }}>{joinSuccess}</p>}

      {loading ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>Loading your classes…</p>
      ) : classes.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>
          You haven't joined a class yet — enter a join code from your teacher above.
        </p>
      ) : (
        classes.map((classItem) => (
          <Link
            key={classItem.classId}
            to={`/student/class/${classItem.classId}`}
            className="card"
            style={{ display: 'block', marginBottom: '1rem', textDecoration: 'none', color: 'inherit' }}
          >
            <h2 style={{ fontSize: '1.25rem' }}>{classItem.name}</h2>
          </Link>
        ))
      )}

      {/* Same stand-in as the teacher Classes page: no "list my lessons"
          endpoint exists, so there's no in-app way to browse to one —
          enter a known lesson id to jump to the pre-join screen (Sprint 2). */}
      <form
        onSubmit={handleGoToLesson}
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
          Go to lesson →
        </button>
      </form>
    </div>
  )
}
