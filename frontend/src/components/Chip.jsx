// Single reusable pill "chip" used everywhere a screen needs a small rounded
// label or action — recall-queue topics, Scout's suggestion actions, and any
// future spot that needs the same shape instead of a one-off inline style.
// With no onClick it renders as a plain non-interactive <span> (display-only,
// e.g. the topic chips); passing onClick upgrades it to a real <button> and
// the hover/disabled states in .chip (index.css) kick in automatically.
export function Chip({ children, onClick, disabled = false }) {
  if (!onClick) {
    return <span className="chip">{children}</span>
  }
  return (
    <button type="button" className="chip" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
