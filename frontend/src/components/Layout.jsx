import { Link, Outlet } from 'react-router-dom' // Link navigates without a full page reload; Outlet renders the current page
import { useAuth } from '../auth/AuthContext.jsx'

// Shared page frame: a top nav bar plus whatever page is currently routed to.
// Every route in App.jsx renders inside this via <Outlet/>.
// NOTE: intentionally unstyled/plain for now — visual design (colors, fonts,
// layout) is being worked out separately before we build it in here.
export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div>
      <header>
        <nav>
          <Link to="/">Compass</Link> {/* app name, links back to the home page */}
          {user ? (
            // Signed in: show where you can go plus a way to sign out.
            <>
              <Link to="/dashboard">Dashboard</Link>
              <span>{user.name}</span> {/* who's currently logged in */}
              <button onClick={logout}>Log out</button>
            </>
          ) : (
            // Signed out: show the entry points into the app.
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Sign up</Link>
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
