import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { AuthSplitLayout } from '../components/AuthSplitLayout.jsx'

// Dedicated student-only login entry point (as opposed to LoginPage, which
// toggles between both roles). Role is fixed to 'student' since this page
// only ever signs students in.
export function StudentLogin() {
  // The backend's LoginRequest takes `username`, not email — there's no
  // email-based lookup today (same gap noted in LoginPage.jsx), so this
  // field asks for username to match what actually authenticates.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const session = await loginRequest({ role: 'student', username, password })
      authLogin(session.accessToken, { name: username, role: 'student' })
      navigate('/student')
    } catch (err) {
      setError(err.message)
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
            onChange={(event) => setUsername(event.target.value)}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
        Don't have an account? <Link to="/student/signup">Sign up</Link>
      </p>
    </AuthSplitLayout>
  )
}
