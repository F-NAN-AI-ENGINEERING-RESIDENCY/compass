import { BrowserRouter, Routes, Route } from 'react-router-dom' // core router pieces: history handling, route table, one route
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { Layout } from './components/Layout.jsx'
import { TeacherLoginPage } from './pages/TeacherLoginPage.jsx'
import { TeacherSignupPage } from './pages/TeacherSignupPage.jsx'
import { TeacherDashboardPage } from './pages/TeacherDashboardPage.jsx'

// Home page has no design yet and isn't one of Asia's assigned screens —
// stays a placeholder until the team decides what it should be.
function HomePage() {
  return <h1>Compass</h1>
}

export default function App() {
  return (
    // BrowserRouter enables client-side routing (URL changes without full page reloads).
    <BrowserRouter>
      {/* AuthProvider goes inside the router but outside the routes, so every
          page — and ProtectedRoute's redirect logic — can read login state. */}
      <AuthProvider>
        <Routes>
          {/* Login/signup render their own full-bleed split-panel screen (with
              their own logo in the left panel) per the wireframe spec — they
              deliberately sit outside Layout so the persistent top nav doesn't
              double up with that panel. */}
          <Route path="/login" element={<TeacherLoginPage />} />
          <Route path="/signup" element={<TeacherSignupPage />} />

          {/* Everything else keeps the persistent top nav: Layout renders it
              once, then <Outlet/> swaps in whichever child route matches. */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />

            {/* Nested inside ProtectedRoute, so it redirects to /login unless
                the user is signed in. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<TeacherDashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
