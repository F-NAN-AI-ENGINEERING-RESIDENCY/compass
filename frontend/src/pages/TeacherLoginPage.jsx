import { useState } from 'react' // local component state: form field values, error message, submitting flag
import { Link, useNavigate } from 'react-router-dom' // Link for the "sign up instead" link; useNavigate to redirect after login
import { loginTeacher } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { AuthSplitLayout } from '../components/AuthSplitLayout.jsx'

// Wireframe spec screen 01 ("Sign in"), scoped to teachers only — Asia's
// Sprint 1 task. The spec's unified "one door for both roles" entry point and
// role-select branching (screen 02) is a bigger shared decision that also
// affects Naomi's student pages, so it isn't decided unilaterally here.
export function TeacherLoginPage() {
  const [username, setUsername] = useState('') // controlled input: current value of the username field
  const [password, setPassword] = useState('') // controlled input: current value of the password field
  const [error, setError] = useState(null) // holds a message string if the last submit failed, else null
  const [isSubmitting, setIsSubmitting] = useState(false) // true while the login request is in flight
  const { login } = useAuth() // login() from AuthContext stores the token/profile once we have them
  const navigate = useNavigate() // lets us send the user to /dashboard after a successful login

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser's default full-page-reload form submission
    setError(null)
    setIsSubmitting(true)
    try {
      const session = await loginTeacher({ username, password }) // POST /api/auth/login
      // /api/auth/login only returns the token/role/userId, not a full profile,
      // so build a minimal profile from what we already know (the username
      // just typed in) — enough for the nav bar's avatar initials until a
      // fuller profile is fetched elsewhere.
      login(session.accessToken, { name: username })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message) // e.g. "Invalid credentials" from the backend
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Welcome back.</h2>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        Sign in with your school account.
      </p>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)} // keep state in sync on every keystroke
            required
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="btn-pill btn-pill--primary"
          style={{ width: '100%' }}
          disabled={isSubmitting} // prevents double-submitting while the request is still pending
        >
          {isSubmitting ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
        New to Compass? <Link to="/signup">Create a teacher account</Link>
      </p>
    </AuthSplitLayout>
  )
}
