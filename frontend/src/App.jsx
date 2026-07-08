import { BrowserRouter, Routes, Route } from 'react-router-dom' // core router pieces: history handling, route table, one route
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { Layout } from './components/Layout.jsx'

// Placeholder pages for routes that get their real implementation in later
// branches (asia/teacher-auth, asia/teacher-dashboard). Keeping them here for
// now proves the routing/auth plumbing works end to end before those exist.
function HomePage() {
  return <h1>Compass</h1>
}
function LoginPagePlaceholder() {
  return <p>Login page coming in asia/teacher-auth</p>
}
function SignupPagePlaceholder() {
  return <p>Signup page coming in asia/teacher-auth</p>
}
function DashboardPagePlaceholder() {
  return <p>Dashboard coming in asia/teacher-dashboard</p>
}

export default function App() {
  return (
    // BrowserRouter enables client-side routing (URL changes without full page reloads).
    <BrowserRouter>
      {/* AuthProvider goes inside the router but outside the routes, so every
          page — and ProtectedRoute's redirect logic — can read login state. */}
      <AuthProvider>
        <Routes>
          {/* Layout renders the nav bar once, then <Outlet/> swaps in whichever
              child route below matches the current URL. */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPagePlaceholder />} />
            <Route path="/signup" element={<SignupPagePlaceholder />} />

            {/* Everything nested inside ProtectedRoute redirects to /login
                unless the user is signed in. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPagePlaceholder />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
