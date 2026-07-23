import { NavLink } from 'react-router-dom'

// One signed-in nav link (Layout.jsx's header), shared by every teacher and
// student page so hover/active behavior is defined once and stays identical
// everywhere it's used. Renders a real <NavLink> — react-router computes
// `isActive` for us, so the current page gets a persistent highlight instead
// of only a hover one.
//
// Default (idle) text is on-dark, since this nav sits on the forest-green
// header — the hover/active state's "ink"-ish forest text only works because
// it's paired with its own light cream-dim pill sitting on top of that dark
// background, not because the text itself changed context.
export function AppNavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `app-nav-item${isActive ? ' app-nav-item--active' : ''}`}
    >
      {children}
    </NavLink>
  )
}
