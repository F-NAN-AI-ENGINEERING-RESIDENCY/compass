// The small circle/diamond/square(/hexagon) motif representing the
// confidence ramp, used at reduced scale on the role-select cards and
// full-size in the badge builder. `size` lets both contexts share one
// implementation.
const HEXAGON_CLIP_PATH = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'

export function ConfidenceShape({ color, kind, size = 14 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        background: `var(--color-${color})`,
        borderRadius: kind === 'circle' ? '50%' : kind === 'square' ? Math.max(3, size * 0.15) : 0,
        transform: kind === 'diamond' ? 'rotate(45deg)' : undefined,
        clipPath: kind === 'hexagon' ? HEXAGON_CLIP_PATH : undefined,
      }}
    />
  )
}
