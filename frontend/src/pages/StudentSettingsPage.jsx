import { useState } from 'react'
import { AccountSettingsSection } from '../components/AccountSettingsSection.jsx'

// Wireframe spec screen 07 ("Settings — student"). Only the Account section
// is real (see AccountSettingsSection). Classes and Notifications have no
// backend to read from or save to — there's no "list my enrolled classes"
// endpoint (same gap as StudentHomePage) and no notification-preferences
// model at all, so both are mocked/local, clearly labeled as such rather
// than pretending they persist.
export function StudentSettingsPage() {
  const [notifyDailyRecap, setNotifyDailyRecap] = useState(true)
  const [notifySignalReplies, setNotifySignalReplies] = useState(true)

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Settings</h1>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <AccountSettingsSection />
      </section>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Classes</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
          There's no endpoint yet to list classes you've joined outside of the current session —
          see the Classes page for what you've joined so far today.
        </p>
      </section>

      <section className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Notifications</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
          Mocked — there's no notification-preferences backend yet, so these toggles don't persist.
        </p>
        <ToggleRow
          label="Daily recap email"
          checked={notifyDailyRecap}
          onChange={setNotifyDailyRecap}
        />
        <ToggleRow
          label="Reply from Scout on a question"
          checked={notifySignalReplies}
          onChange={setNotifySignalReplies}
        />
      </section>
    </div>
  )
}

// Simple labeled on/off row, reused by both Settings pages.
export function ToggleRow({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0',
        borderBottom: '1px solid var(--color-cream-dim)',
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
