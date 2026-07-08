import { useAuth } from '../auth/AuthContext.jsx'

// Mocked — there's no endpoint for a student to fetch their own mastery
// across classes (Felix's GET /students/:id/skills, Sprint 2, isn't built).
// The per-lesson dashboard's skillSnapshot is class-wide and teacher-only, so
// it can't be reused here either.
const MOCK_TOPICS = [
  { name: 'Linear Equations', score: 68, color: 'olive' },
  { name: 'Fractions', score: 72, color: 'ochre' },
  { name: 'Word Problems', score: 88, color: 'clay' },
]

// Wireframe spec screen 04 ("Dashboard" — student home). Distinct from
// StudentHomePage (the "join class, view enrolled classes" shell from the
// original sprint task) — this is the confidence-ramp tile view the spec
// separately calls "Dashboard."
export function StudentDashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <div style={{ background: 'var(--color-forest)', color: 'var(--color-text-on-dark)', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Morning, {user?.name?.split(' ')[0]}.</h1>
          <p style={{ color: 'var(--color-text-on-dark-muted)', marginBottom: '1.5rem' }}>
            Mostly on track. One topic needs a rescue.
          </p>
          <button className="btn-pill" style={{ background: 'var(--color-cream)', color: 'var(--color-ink)' }}>
            Practice Word Problems →
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
          Mocked example scores — there's no endpoint yet for a student to fetch their own mastery
          across classes.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {MOCK_TOPICS.map((topic) => (
            <div key={topic.name} className="card" style={{ borderTop: `4px solid var(--color-${topic.color})` }}>
              <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-mono)' }}>{topic.score}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>{topic.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
