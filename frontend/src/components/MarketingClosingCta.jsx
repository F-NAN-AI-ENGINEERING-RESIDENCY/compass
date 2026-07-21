import { Link } from 'react-router-dom'

// Forest-green closing band shared by the About/Research marketing pages —
// every page that makes the case for Compass should end with a way to act on it.
export function MarketingClosingCta() {
  return (
    <section
      style={{
        background: 'var(--color-forest)',
        padding: '3.5rem 32px',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '28px',
          color: 'var(--color-text-on-dark)',
          margin: '0 0 0.6rem',
        }}
      >
        See it for your classroom.
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--color-text-on-dark-muted)',
          margin: '0 0 1.5rem',
        }}
      >
        Free to try for teachers and students, grades 6–12.
      </p>
      <Link
        to="/role-select"
        className="btn-pill"
        style={{
          background: 'var(--color-cream)',
          color: 'var(--color-forest)',
          textDecoration: 'none',
          display: 'inline-flex',
        }}
      >
        Get started
      </Link>
    </section>
  )
}
