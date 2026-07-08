import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginTeacher, registerTeacher } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { AuthSplitLayout } from '../components/AuthSplitLayout.jsx'

// Teacher-only signup form, built against the real RegisterRequest schema
// (app/schemas/auth.py: role, username, name, email, password). Reuses the
// same split-panel shell as TeacherLoginPage.
export function TeacherSignupPage() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await registerTeacher({ username, name, email, password }) // POST /api/auth/register
      // Registration doesn't return a session token by itself, so immediately
      // log the new account in too — one submit takes the teacher straight
      // into the dashboard instead of bouncing them to a second login screen.
      const session = await loginTeacher({ username, password })
      login(session.accessToken, { name })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message) // e.g. "Username already registered" (409 from the backend)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Create your teacher account.</h2>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        Set up Compass for your classroom.
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
    </AuthSplitLayout>
  )
}
