// The circular initials badge shown top-right on every screen in the spec
// (labelled "BA" in the wireframe placeholders). Here it's computed from the
// real logged-in user's name instead of being a hardcoded placeholder.
export function AvatarBadge({ name }) {
  const initials = getInitials(name)

  return (
    <span
      title={name} // full name on hover, since the badge itself only fits 1-2 letters
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2rem',
        height: '2rem',
        borderRadius: '50%', // makes the square span into a circle
        background: 'var(--color-forest)',
        color: 'var(--color-text-on-dark)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: '0.85rem',
      }}
    >
      {initials}
    </span>
  )
}

// "Naomi Sato" -> "NS". Falls back to "?" if name is missing/blank so the
// badge never renders empty.
function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/) // split on any run of whitespace
  const firstInitial = parts[0]?.[0] || ''
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (firstInitial + lastInitial).toUpperCase()
}
