// The Compass logomark from the spec: "a circular ring with center dot."
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
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      {/* the center dot */}
      <circle cx="12" cy="12" r="2.5" fill={color} />
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
