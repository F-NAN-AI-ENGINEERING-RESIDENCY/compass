import { Link } from 'react-router-dom'

// The Compass logomark. Three deliberate choices make it read as this app's
// mark rather than generic compass clip-art:
//   - the needle sits ~30° off-axis, not straight N-S, for visual energy
//   - the needle's two faces use the confidence ramp (ochre lit face, olive
//     dimmed face) instead of two shades of one color, tying the mark to the
//     same olive->ochre->clay ramp used everywhere else in the app
//   - a small clay dot pulses at the needle's tip — the same color/animation
//     language as the "Live" indicator used elsewhere, nodding to the
//     product's actual core feature (the private "I'm lost" signal)
// `color` still adapts the ring + center pivot for dark backgrounds (the
// signed-in nav, the auth-screen panel); the ramp colors on the needle need
// no such adaptation — ochre/olive/clay all read fine on both cream and forest.
export function Logo({ size = 28, color = 'var(--color-forest)' }) {
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
      {/* needle, rotated off-axis; tip carries a pulsing signal dot */}
      <g transform="rotate(30 12 12)">
        <path d="M12 4.2L15.2 12L12 12Z" fill="var(--color-ochre)" />
        <path d="M12 19.8L8.8 12L12 12Z" fill="var(--color-olive)" />
        <circle cx="12" cy="3" r="1.15" fill="var(--color-clay)" className="logo-signal-dot" />
      </g>
      {/* center pivot */}
      <circle cx="12" cy="12" r="1.3" fill={color} />
    </svg>
  )
}

// Logomark + wordmark together, as seen top-left on every screen in the
// spec — a home link everywhere it appears, with a subtle hover scale (see
// .logo-wordmark in index.css).
export function LogoWordmark({ color = 'var(--color-forest)' }) {
  return (
    <Link
      to="/"
      className="logo-wordmark"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color, textDecoration: 'none' }}
    >
      <Logo color={color} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color }}>
        Compass
      </span>
    </Link>
  )
}
