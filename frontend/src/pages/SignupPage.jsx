import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login as loginRequest, register } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { AuthSplitLayout } from '../components/AuthSplitLayout.jsx'

// Signup form for the role picked on RoleSelectPage (screen 02), carried
// here as ?role=student|teacher. RegisterRequest's shape is identical for
// both roles (role/username/name/email/password), so one form covers both —
// only the headline copy and which role gets submitted change.
export function SignupPage() {
  const [searchParams] = useSearchParams()
  // Defaults to teacher if someone lands here directly without going through
  // role-select (e.g. a bookmarked link) — arbitrary, just needs to be one or the other.
  const role = searchParams.get('role') === 'student' ? 'student' : 'teacher'

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
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
      await register({ role, username, name, email, password }) // POST /api/auth/register
      // Registration doesn't return a session token by itself, so immediately
      // log the new account in too — one submit takes them straight into
      // their home page instead of bouncing to a second login screen.
      const session = await loginRequest({ role, username, password })
      authLogin(session.accessToken, { name, role })
      navigate(role === 'teacher' ? '/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err.message) // e.g. "Username already registered" (409 from the backend)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
        Create your {role} account.
      </h2>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        {role === 'teacher' ? 'Set up Compass for your classroom.' : 'Set up Compass for your classes.'}
      </p>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit}>
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
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={3} // matches RegisterRequest's min_length=3 on the backend
            maxLength={50}
            autoComplete="username"
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
            minLength={8} // matches RegisterRequest's min_length=8 on the backend
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
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
        Not a {role === 'teacher' ? 'teacher' : 'student'}? <Link to="/role-select">Go back</Link>
      </p>
    </AuthSplitLayout>
  )
}
