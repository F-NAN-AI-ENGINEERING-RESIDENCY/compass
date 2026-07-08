import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AvatarBadge } from './AvatarBadge.jsx'

// getInitials isn't exported (it's an internal helper), so these go through
// the rendered component — that's the actual contract users see anyway.
describe('AvatarBadge', () => {
  it('shows both initials for a two-word name', () => {
    render(<AvatarBadge name="Naomi Sato" />)
    expect(screen.getByText('NS')).toBeInTheDocument()
  })

  it('shows one initial for a single-word name (e.g. login-only username fallback)', () => {
    render(<AvatarBadge name="nsato_26419" />)
    expect(screen.getByText('N')).toBeInTheDocument()
  })

  it('uses the first and last word for a three-word name', () => {
    render(<AvatarBadge name="Maya Del Rivera" />)
    expect(screen.getByText('MR')).toBeInTheDocument()
  })

  it('falls back to "?" when name is missing', () => {
    render(<AvatarBadge name={undefined} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('puts the full name in the title attribute for hover', () => {
    render(<AvatarBadge name="Naomi Sato" />)
    expect(screen.getByTitle('Naomi Sato')).toBeInTheDocument()
  })
})
