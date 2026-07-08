import { Link, Outlet } from 'react-router-dom' // Link navigates without a full page reload; Outlet renders the current page
import { useAuth } from '../auth/AuthContext.jsx'
import { LogoWordmark } from './Logo.jsx'
import { AvatarBadge } from './AvatarBadge.jsx'

// Shared page frame: a top nav bar plus whatever page is currently routed to.
// Every route in App.jsx renders inside this via <Outlet/>. Dark forest-green
// nav with cream text/links, matching the persistent top nav in every screen
// of the wireframe spec (logomark left, avatar/links right).
export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          background: 'var(--color-forest)',
        }}
      >
        <Link to="/" style={{ color: 'var(--color-text-on-dark)', textDecoration: 'none' }}>
          <LogoWordmark color="var(--color-text-on-dark)" />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {user ? (
            // Signed in: show where you can go, who's signed in, and a way to sign out.
            // "Dashboard" routes home for whichever role is actually signed in —
            // a student following this link should land on /student, not a
            // teacher-only page that immediately 403s.
            <>
              <Link
                to={user.role === 'teacher' ? '/dashboard' : '/student'}
                style={{ color: 'var(--color-text-on-dark)' }}
              >
                {user.role === 'teacher' ? 'Dashboard' : 'My classes'}
              </Link>
              {user.role === 'student' && (
                <>
                  <Link to="/scout" style={{ color: 'var(--color-text-on-dark)' }}>
                    Scout
                  </Link>
                  <Link to="/wellbeing" style={{ color: 'var(--color-text-on-dark)' }}>
                    Wellbeing
                  </Link>
                  <Link to="/badge" style={{ color: 'var(--color-text-on-dark)' }}>
                    Badge
                  </Link>
                </>
              )}
              {user.role === 'teacher' && (
                <>
                  <Link to="/materials" style={{ color: 'var(--color-text-on-dark)' }}>
                    Materials
                  </Link>
                  <Link to="/recordings" style={{ color: 'var(--color-text-on-dark)' }}>
                    Recordings
                  </Link>
                </>
              )}
              <Link
                to={user.role === 'teacher' ? '/settings' : '/student/settings'}
                style={{ color: 'var(--color-text-on-dark)' }}
              >
                Settings
              </Link>
              <AvatarBadge name={user.name} />
              <button onClick={logout} className="btn-pill btn-pill--outline" style={outlineOnDark}>
                Log out
              </button>
            </>
          ) : (
            // Signed out: show the entry points into the app. Sign-up goes
            // through role-select first (screen 02) rather than straight to
            // the form, since the form needs to know which role to register.
            <>
              <Link to="/login" style={{ color: 'var(--color-text-on-dark)' }}>
                Log in
              </Link>
              <Link to="/role-select" className="btn-pill btn-pill--outline" style={outlineOnDark}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Outlet /> {/* whichever page matched the current URL renders here */}
      </main>
    </div>
  )
}

// .btn-pill--outline in index.css assumes a cream background (forest text on
// transparent). On this dark nav we need the inverse — cream text/border on
// forest — so those two properties are overridden inline here rather than
// adding a whole second CSS class just for this one spot.
const outlineOnDark = {
  color: 'var(--color-text-on-dark)',
  borderColor: 'var(--color-text-on-dark)',
  textDecoration: 'none',
}
