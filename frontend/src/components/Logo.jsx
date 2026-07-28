import { Link } from 'react-router-dom'

// The Compass logomark: a compass rose with real dimension — the needle's
// two faces are distinct solid fills (never one color at reduced opacity,
// and never a gradient), like light catching two sides of a physical
// needle, plus a small ochre pivot pin where a real compass needle turns.
//
// `color` is the primary tone (the ring + the needle's "lit" north face);
// `shade` is the secondary tone for the needle's south face. Both default to
// the forest ramp for the common case — logo on a cream background. Callers
// on a dark forest background (the signed-in nav, the auth-screen panel)
// pass on-dark tones for both instead, so the mark stays legible there too.
export function Logo({ size = 28, color = 'var(--color-forest)', shade = 'var(--color-forest-dark)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Compass logo"
    >
      {/* outer ring */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      {/* needle: north face solid `color`, south face solid `shade` — two
          distinct fills, not one color at partial opacity, for real depth */}
      <path d="M12 4.2L15.2 12L12 12Z" fill={color} />
      <path d="M12 19.8L8.8 12L12 12Z" fill={shade} />
      {/* ochre pivot pin */}
      <circle cx="12" cy="12" r="1.6" fill="var(--color-ochre)" />
    </svg>
  )
}

// Logomark + wordmark together, as seen top-left on every screen in the
// spec — a home link everywhere it appears, with a subtle hover scale (see
// .logo-wordmark in index.css).
export function LogoWordmark({ color = 'var(--color-forest)', shade = 'var(--color-forest-dark)' }) {
  return (
    <Link
      to="/"
      className="logo-wordmark"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color, textDecoration: 'none' }}
    >
      <Logo color={color} shade={shade} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color }}>
        Compass
      </span>
    </Link>
  )
}
