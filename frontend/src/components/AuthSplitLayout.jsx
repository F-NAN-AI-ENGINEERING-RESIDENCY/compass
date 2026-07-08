import { LogoWordmark } from './Logo.jsx'

// Shared two-panel shell for the sign-in/sign-up screens (wireframe spec
// screen 01): dark forest-green left panel with the pitch, cream right panel
// holding whatever form gets passed in as `children`. Both TeacherLoginPage
// and TeacherSignupPage reuse this so the pitch copy/panel only exists once.
export function AuthSplitLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel: ~45% width, dark forest-green, the app's pitch. */}
      <div
        style={{
          flexBasis: '45%',
          background: 'var(--color-forest)',
          color: 'var(--color-text-on-dark)',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.5rem',
        }}
      >
        <LogoWordmark color="var(--color-text-on-dark)" />
        <h1 style={{ fontSize: '2.25rem', lineHeight: 1.2 }}>Class, without the guessing.</h1>
        <p style={{ color: 'var(--color-text-on-dark-muted)', maxWidth: '32ch' }}>
          Students say "slow down" without raising a hand. Teachers see where the whole room
          is — never who.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {/* Pill tags/badges from the spec — plain text pills, not interactive buttons. */}
          <PitchTag>Anonymous "I'm lost" signals</PitchTag>
          <PitchTag>Daily recall with Scout</PitchTag>
          <PitchTag>A calm corner for wellbeing</PitchTag>
        </div>
      </div>

      {/* Right panel: ~55% width, cream, holds the actual login/signup form. */}
      <div
        style={{
          flexBasis: '55%',
          background: 'var(--color-cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px' }}>{children}</div>
      </div>
    </div>
  )
}

// One small rounded pill of static text — same pill shape as .btn-pill in
// index.css but not a button, so it's a tiny one-off instead of reusing that class.
function PitchTag({ children }) {
  return (
    <span
      style={{
        border: '1px solid var(--color-text-on-dark-muted)',
        borderRadius: 'var(--radius-pill)',
        padding: '0.35rem 0.85rem',
        fontSize: '0.85rem',
      }}
    >
      {children}
    </span>
  )
}
