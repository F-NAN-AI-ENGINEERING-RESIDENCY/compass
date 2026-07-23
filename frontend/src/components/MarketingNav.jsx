import { Link } from 'react-router-dom'
import { LogoWordmark } from './Logo.jsx'

// Shared top nav for the public marketing pages (landing/about/research) —
// deliberately separate from Layout's signed-in nav, since a signed-out
// visitor has no dashboard/settings/etc. to link to.
const NAV_LINKS = [
  { label: 'For educators', to: '/signup?role=teacher' },
  { label: 'For students', to: '/signup?role=student' },
  { label: 'Research', to: '/research' },
  { label: 'About', to: '/about' },
]

export function MarketingNav() {
  return (
    <header
      className="landing-nav"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 32px',
        background: 'var(--color-cream)',
      }}
    >
      <LogoWordmark />

      {/* Marketing links: hidden below tablet width — see .landing-nav-links
          in index.css — there's no room for them next to the CTAs on mobile. */}
      <nav className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {NAV_LINKS.map(({ label, to }) => (
          <Link key={label} to={to} className="public-nav-link" style={{ fontFamily: 'var(--font-body)', fontSize: '13px' }}>
            {label}
          </Link>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
        <Link to="/login" className="public-nav-signin" style={{ fontSize: '13px' }}>
          Sign in
        </Link>
        <Link to="/role-select" className="btn-pill btn-pill--primary" style={{ textDecoration: 'none' }}>
          Get started
        </Link>
      </div>
    </header>
  )
}
