import { useEffect, useState } from 'react'
import { getMe, updateProfile } from '../api/auth.js'

// Shared "Account" block for both Settings screens (07 student, 16 teacher) —
// the account fields are identical for both roles. Real backend: loads via
// GET /api/auth/me, saves via PATCH /api/auth/me (both merged on main).
export function AccountSettingsSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedAt, setSavedAt] = useState(null) // timestamp of the last successful save, for a brief "Saved" confirmation

  useEffect(() => {
    getMe()
      .then((profile) => {
        setName(profile.name)
        setEmail(profile.email)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleSave(event) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      await updateProfile({ name, email })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err.message) // e.g. "Email already registered" (409)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <p style={{ color: 'var(--color-ink-muted)' }}>Loading account…</p>

  return (
    <form onSubmit={handleSave}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Account</h2>
      {error && <p className="error-text">{error}</p>}
      <div className="field">
        <label htmlFor="settings-name">Full name</label>
        <input id="settings-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="settings-email">Email</label>
        <input id="settings-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <button type="submit" className="btn-pill btn-pill--primary" disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save changes'}
      </button>
      {savedAt && (
        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>Saved</span>
      )}
    </form>
  )
}
