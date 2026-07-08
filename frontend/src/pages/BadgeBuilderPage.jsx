import { useState } from 'react'
import { ConfidenceShape } from '../components/ConfidenceShape.jsx'

const SHAPES = ['circle', 'diamond', 'square', 'hexagon']
const COLORS = ['forest', 'olive', 'ochre', 'clay']
const STORAGE_KEY = 'compass_badge'

// Wireframe spec screen 03 ("Badge builder") — no badge/customization model
// exists on the backend at all, so the built badge saves to localStorage
// instead of a server. Real persistence on this device without inventing an
// API contract nobody's agreed on.
export function BadgeBuilderPage() {
  const saved = readSavedBadge()
  const [shape, setShape] = useState(saved?.shape ?? 'circle')
  const [color, setColor] = useState(saved?.color ?? 'forest')
  const [justBuilt, setJustBuilt] = useState(false)

  function handleBuild() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shape, color }))
    setJustBuilt(true)
    setTimeout(() => setJustBuilt(false), 2500)
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Make it yours.</h1>

      {/* Live preview — large version of the currently-selected shape+color. */}
      <div
        style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'var(--color-cream-dim)',
          margin: '0 auto 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ConfidenceShape color={color} kind={shape} size={80} />
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem', textAlign: 'left' }}>
        Shape
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {SHAPES.map((option) => (
          <PickerSwatch key={option} isSelected={shape === option} onClick={() => setShape(option)}>
            <ConfidenceShape color={color} kind={option} size={28} />
          </PickerSwatch>
        ))}
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem', textAlign: 'left' }}>
        Color
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        {COLORS.map((option) => (
          <PickerSwatch key={option} isSelected={color === option} onClick={() => setColor(option)}>
            <span
              style={{
                display: 'block',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `var(--color-${option})`,
              }}
            />
          </PickerSwatch>
        ))}
      </div>

      <button className="btn-pill btn-pill--primary" onClick={handleBuild}>
        Build your badge
      </button>
      {justBuilt && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
          Saved on this device.
        </p>
      )}
    </div>
  )
}

// One chunky, large-tap-target swatch button in either picker row.
function PickerSwatch({ isSelected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '52px',
        height: '52px',
        borderRadius: 'var(--radius-card)',
        border: isSelected ? '2px solid var(--color-forest)' : '1.5px solid var(--color-cream-dim)',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function readSavedBadge() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null // corrupted/old localStorage shape — fail soft to defaults rather than crash the page
  }
}
