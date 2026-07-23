// The Compass logomark: a compass rose — ring plus a classic two-tone
// needle (one half solid, the other dimmed, the way a real compass needle
// reads N vs. S) instead of the old plain center dot.
// Built as inline SVG (not an image file) so it can inherit `color` via
// `currentColor` and needs no separate asset to keep track of.
// `size` controls both width and height; `color` defaults to inheriting
// whatever text color is already active where the logo is placed.
export function Logo({ size = 28, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Compass logo"
    >
      {/* the outer ring */}
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      {/* two-tone needle (a kite/diamond, not a clock hand): north point
          solid, south point dimmed, the way a real compass needle reads. */}
      <path d="M12 4.2L15.2 12L12 12Z" fill={color} />
      <path d="M12 19.8L8.8 12L12 12Z" fill={color} opacity="0.4" />
      {/* center pin */}
      <circle cx="12" cy="12" r="1.3" fill={color} />
    </svg>
  )
}

// Logomark + wordmark together, as seen top-left on every screen in the spec.
export function LogoWordmark({ color = 'currentColor' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color }}>
      <Logo color={color} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem' }}>
        Compass
      </span>
    </span>
  )
}
