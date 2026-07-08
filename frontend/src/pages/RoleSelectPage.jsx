import { Link } from 'react-router-dom'
import { LogoWordmark } from '../components/Logo.jsx'
import { ConfidenceShape } from '../components/ConfidenceShape.jsx'

// Wireframe spec screen 02 ("Role select") — "the fork before anything
// else." Reached from the sign-in page's "Create an account" link; picking a
// card carries the role forward as a query param to /signup.
export function RoleSelectPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-cream)', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <LogoWordmark color="var(--color-forest)" />

        <h1 style={{ fontSize: '2.5rem', textAlign: 'center', margin: '2.5rem 0 0.75rem' }}>
          Find your bearings.
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-ink-muted)',
            maxWidth: '44ch',
            margin: '0 auto 2.5rem',
          }}
        >
          One calm place to see how class is really going — and to say "slow down" without raising
          your hand.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <RoleCard
            role="student"
            dark={false}
            title="I'm a student"
            body='See your confidence topic by topic, practice with Scout the AI tutor, and signal when class moves too fast — always anonymously.'
            shapes={['forest', 'ochre', 'clay']}
          />
          <RoleCard
            role="teacher"
            dark
            title="I'm a teacher"
            body="Watch understanding live, spot the exact moment a lesson lost the room, and know what's worth revisiting tomorrow."
            shapes={['olive', 'ochre', 'cream']}
          />
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem' }}>
          Joining from a class invite?{' '}
          <Link to="/signup?role=student">Enter your code</Link>
        </p>
      </div>
    </div>
  )
}

// One role's card. `shapes` is 3 color-token names, drawn as the
// circle/diamond/square "confidence-ramp motif in miniature" from the spec.
function RoleCard({ role, dark, title, body, shapes }) {
  return (
    <div
      className="card"
      style={{
        background: dark ? 'var(--color-forest)' : 'var(--color-cream-dim)',
        color: dark ? 'var(--color-text-on-dark)' : 'var(--color-ink)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <ConfidenceShape color={shapes[0]} kind="circle" />
        <ConfidenceShape color={shapes[1]} kind="diamond" />
        <ConfidenceShape color={shapes[2]} kind="square" />
      </div>
      <h2 style={{ fontSize: '1.3rem' }}>{title}</h2>
      <p style={{ color: dark ? 'var(--color-text-on-dark-muted)' : 'var(--color-ink-muted)', flex: 1 }}>
        {body}
      </p>
      <Link
        to={`/signup?role=${role}`}
        className="btn-pill"
        style={{
          background: dark ? 'var(--color-cream)' : 'var(--color-forest)',
          color: dark ? 'var(--color-ink)' : 'var(--color-text-on-dark)',
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        Continue as a {role} →
      </Link>
    </div>
  )
}
