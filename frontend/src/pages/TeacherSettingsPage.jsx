import { useState } from 'react'
import { AccountSettingsSection } from '../components/AccountSettingsSection.jsx'
import { ToggleRow } from './StudentSettingsPage.jsx'

// Wireframe spec screen 16 ("Teacher settings") — "alert threshold is the
// key control." The Class model already has an alert_threshold column with
// a default (app/models/class_.py), but there's no PATCH endpoint to change
// it after a class is created, so this slider is local-state only —
// deliberately not wired to look real when it can't actually save anywhere.
export function TeacherSettingsPage() {
  const [alertThreshold, setAlertThreshold] = useState(0.5)
  const [notifyDailyRecap, setNotifyDailyRecap] = useState(true)
  const [notifyNewSignal, setNotifyNewSignal] = useState(true)

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Settings</h1>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <AccountSettingsSection />
      </section>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Alert threshold</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
          How many students need to signal "I'm lost" before a class counts as needing a rescue.
          Mocked — there's no endpoint yet to save this per class.
        </p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={alertThreshold}
          onChange={(event) => setAlertThreshold(Number(event.target.value))}
          style={{ width: '100%', accentColor: 'var(--color-forest)' }}
        />
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
          {Math.round(alertThreshold * 100)}%
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Notifications</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
          Mocked — there's no notification-preferences backend yet, so these toggles don't persist.
        </p>
        <ToggleRow label="Daily recap email" checked={notifyDailyRecap} onChange={setNotifyDailyRecap} />
        <ToggleRow label="New signal during a live lesson" checked={notifyNewSignal} onChange={setNotifyNewSignal} />
      </section>
    </div>
  )
}
