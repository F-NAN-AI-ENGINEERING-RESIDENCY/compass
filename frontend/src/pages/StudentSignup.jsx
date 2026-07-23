import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginRequest, register } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { AuthSplitLayout } from '../components/AuthSplitLayout.jsx'

// Dedicated student-only signup entry point (as opposed to SignupPage,
// which handles both roles via ?role=). Posts straight to the student role
// on RegisterRequest — no role picker needed since this page only ever
// creates student accounts.
export function StudentSignup() {
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
      await register({ role: 'student', username, name, email, password })
      // Registration doesn't return a session token itself, so log the new
      // account in right after — matches SignupPage's flow.
      const session = await loginRequest({ role: 'student', username, password })
      authLogin(session.accessToken, { name, role: 'student' })
      navigate('/student')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Create your student account.</h2>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        Set up Compass for your classes.
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
            minLength={3}
            maxLength={50}
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="email">School email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
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
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="btn-pill btn-pill--primary"
          style={{ width: '100%' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Create account →'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/student/login">Log in</Link>
      </p>
    </AuthSplitLayout>
  )
}
