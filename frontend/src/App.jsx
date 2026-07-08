import { BrowserRouter, Routes, Route } from 'react-router-dom' // core router pieces: history handling, route table, one route
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { Layout } from './components/Layout.jsx'
import { RoleSelectPage } from './pages/RoleSelectPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { SignupPage } from './pages/SignupPage.jsx'
import { TeacherDashboardPage } from './pages/TeacherDashboardPage.jsx'
import { TeacherLessonDashboardPage } from './pages/TeacherLessonDashboardPage.jsx'
import { StudentHomePage } from './pages/StudentHomePage.jsx'
import { StudentPreJoinPage } from './pages/StudentPreJoinPage.jsx'
import { StudentLessonPage } from './pages/StudentLessonPage.jsx'
import { WellbeingPage } from './pages/WellbeingPage.jsx'
import { StudentSettingsPage } from './pages/StudentSettingsPage.jsx'
import { TeacherSettingsPage } from './pages/TeacherSettingsPage.jsx'
import { BadgeBuilderPage } from './pages/BadgeBuilderPage.jsx'
import { ScoutPage } from './pages/ScoutPage.jsx'
import { MaterialsPage } from './pages/MaterialsPage.jsx'
import { RecordingsPage } from './pages/RecordingsPage.jsx'
import { TeacherSessionsHubPage } from './pages/TeacherSessionsHubPage.jsx'

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
          {/* Role-select/login/signup each render their own full-bleed screen
              (with their own logo, no persistent nav) per the wireframe spec —
              they deliberately sit outside Layout so the top nav doesn't
              double up with those panels. */}
          <Route path="/role-select" element={<RoleSelectPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Pre-join and in-lesson screens are also full-bleed/no-nav — an
              immersive "in a call" context per the spec, same reasoning as
              login/signup above. Still role-gated even without the nav shell. */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/student/lessons/:lessonId/join" element={<StudentPreJoinPage />} />
            <Route path="/student/lessons/:lessonId" element={<StudentLessonPage />} />
          </Route>

          {/* Everything else keeps the persistent top nav: Layout renders it
              once, then <Outlet/> swaps in whichever child route matches. */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />

            {/* Teacher-only routes: a signed-in student hitting these gets
                bounced to /student instead of seeing a 403-riddled page. */}
            <Route element={<ProtectedRoute role="teacher" />}>
              <Route path="/dashboard" element={<TeacherDashboardPage />} />
              <Route path="/sessions" element={<TeacherSessionsHubPage />} />
              <Route path="/lessons/:lessonId" element={<TeacherLessonDashboardPage />} />
              <Route path="/settings" element={<TeacherSettingsPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/recordings" element={<RecordingsPage />} />
            </Route>

            {/* Student-only route, same idea in reverse. */}
            <Route element={<ProtectedRoute role="student" />}>
              <Route path="/student" element={<StudentHomePage />} />
              <Route path="/wellbeing" element={<WellbeingPage />} />
              <Route path="/student/settings" element={<StudentSettingsPage />} />
              <Route path="/badge" element={<BadgeBuilderPage />} />
              <Route path="/scout" element={<ScoutPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
