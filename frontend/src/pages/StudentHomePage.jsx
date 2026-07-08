import { useState } from 'react'
import { joinClass } from '../api/enrollments.js'
import { getClass } from '../api/classes.js'

// Wireframe spec's student home shell: "join class, view enrolled classes."
// Like the teacher's Classes page, there's no "list my enrolled classes"
// endpoint, so classes joined this session are tracked in local state —
// reloading the page loses the list until a real list endpoint exists.
//
// POST /api/enrollments (join by code) exists on felix/roster-endpoints
// (open PR, not yet merged to main) — this will 404 until that merges, same
// situation as the teacher dashboard's "create class."
export function StudentHomePage() {
  const [classes, setClasses] = useState([]) // classes joined this session
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)

  async function handleJoin(event) {
    event.preventDefault()
    setJoinError(null)
    setIsJoining(true)
    try {
      const enrollment = await joinClass(joinCode.trim().toUpperCase()) // join codes are uppercase (see Class.generate_join_code's alphabet)
      setJoinCode('')
      // EnrollmentResponse only has {enrollmentId, studentId, classId,
      // enrolledAt} — no class name — so fetch the class details too, same
      // chaining pattern as the teacher dashboard's create-then-fetch-roster.
      const classDetail = await getClass(enrollment.classId)
      setClasses((current) => [...current, classDetail])
    } catch (err) {
      setJoinError(err.message) // e.g. "No class found for join code..." or "Already enrolled in this class"
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
          {joinError && <p className="error-text">{joinError}</p>}
        </div>
        <button type="submit" className="btn-pill btn-pill--primary" disabled={isJoining}>
          {isJoining ? 'Joining…' : 'Join class'}
        </button>
      </form>

      {classes.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>
          You haven't joined a class yet — enter a join code from your teacher above.
        </p>
      ) : (
        classes.map((classItem) => (
          <div key={classItem.classId} className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>{classItem.name}</h2>
          </div>
        ))
      )}
    </div>
  )
}
