import { Navigate, Outlet } from 'react-router-dom' // Navigate redirects; Outlet renders the matched child route
import { useAuth } from './AuthContext.jsx'

// Where a signed-in user belongs if they land somewhere their role doesn't
// own (e.g. a student hitting a teacher-only route, or vice versa).
function homeRouteFor(role) {
  return role === 'teacher' ? '/dashboard' : '/student'
}

// Wrap any <Route> that should only be reachable while logged in. Usage in
// App.jsx: <Route element={<ProtectedRoute />}><Route path="/dashboard" .../></Route>
// Pass `role="teacher"` (or "student") to also require that specific role —
// a signed-in user with the wrong role gets sent to their own home instead
// of the teacher/student area they tried to open.
export function ProtectedRoute({ role }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    // Still checking localStorage/the /me endpoint — avoid a flash-redirect
    // to /login before we actually know if the user is signed in.
    return <p>Loading...</p>
  }

  if (!user) {
    // `replace` swaps the current history entry instead of adding a new one,
    // so hitting the browser's back button doesn't bounce back to this redirect.
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={homeRouteFor(user.role)} replace />
  }

  // Signed in (and the right role, if one was required) — render whichever
  // nested route matched (e.g. the dashboard page).
  return <Outlet />
}
