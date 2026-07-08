import { Navigate, Outlet } from 'react-router-dom' // Navigate redirects; Outlet renders the matched child route
import { useAuth } from './AuthContext.jsx'

// Wrap any <Route> that should only be reachable while logged in. Usage in
// App.jsx: <Route element={<ProtectedRoute />}><Route path="/dashboard" .../></Route>
export function ProtectedRoute() {
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

  // Signed in — render whichever nested route matched (e.g. the dashboard page).
  return <Outlet />
}
