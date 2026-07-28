import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../api/auth.js' // renamed on import — AuthContext also exposes a `login`
import { useAuth } from '../auth/AuthContext.jsx'
import { AuthSplitLayout } from '../components/AuthSplitLayout.jsx'

// Wireframe spec screen 01 ("Sign in") — "one door for both roles." The
// backend's LoginRequest requires knowing which table to check (teachers vs
// students; usernames aren't unique across both), so a literal invisible
// "one door" isn't possible without either guessing (trying both roles in
// sequence, which risks logging someone into the wrong account if a
// student and teacher happen to share both a username AND a password) or a
// visible role toggle. This uses a toggle — still one page, one form.
export function LoginPage() {
  const [role, setRole] = useState('teacher') // arbitrary default; nothing in the spec implies one role signs in more often than the other
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login: authLogin } = useAuth() // stores the token/profile once we have them
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const session = await loginRequest({ role, username, password }) // POST /api/auth/login
      // /api/auth/login only returns the token/role/userId, not a full
      // profile, so build a minimal one from what we already know (the
      // username just typed in, and the role we sent) — enough for the nav
      // bar's avatar initials and route guarding until a fuller profile is
      // fetched elsewhere.
      authLogin(session.accessToken, { name: username, role: session.role })
      navigate(session.role === 'teacher' ? '/dashboard' : '/student/dashboard')
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

      <RoleToggle role={role} onChange={setRole} />

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
        New to Compass? <Link to="/role-select">Create an account</Link> — you'll pick student or
        teacher first.
      </p>
    </AuthSplitLayout>
  )
}

// Segmented pill control for picking which account table to check.
function RoleToggle({ role, onChange }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1.5px solid var(--color-cream-dim)',
        borderRadius: 'var(--radius-pill)',
        padding: '0.25rem',
        marginBottom: '1.25rem',
      }}
    >
      {['student', 'teacher'].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className="btn-pill"
          style={{
            padding: '0.4rem 1rem',
            fontSize: '0.85rem',
            background: role === option ? 'var(--color-forest)' : 'transparent',
            color: role === option ? 'var(--color-text-on-dark)' : 'var(--color-ink-muted)',
          }}
        >
          {option === 'student' ? 'Student' : 'Teacher'}
        </button>
      ))}
    </div>
  )
}
