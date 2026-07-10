import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute.jsx'

// ProtectedRoute reads auth state via useAuth(), not props — mock the hook
// directly rather than standing up a real AuthProvider (which would need a
// live backend to resolve its loading state).
const mockUseAuth = vi.fn()
vi.mock('./AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderAt(initialPath, { role } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Teacher dashboard</p>} />
        <Route path="/student/dashboard" element={<p>Student dashboard</p>} />
        <Route element={<ProtectedRoute role={role} />}>
          <Route path="/protected" element={<p>Protected content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows a loading state instead of redirecting while auth is still resolving', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true })
    renderAt('/protected')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to /login when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false })
    renderAt('/protected')
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('renders the protected content when signed in with no role required', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'teacher' }, isLoading: false })
    renderAt('/protected')
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders the protected content when the required role matches', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'teacher' }, isLoading: false })
    renderAt('/protected', { role: 'teacher' })
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('redirects a student to their own dashboard when a teacher-only route is required', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'student' }, isLoading: false })
    renderAt('/protected', { role: 'teacher' })
    expect(screen.getByText('Student dashboard')).toBeInTheDocument()
  })

  it('redirects a teacher to their own dashboard when a student-only route is required', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'teacher' }, isLoading: false })
    renderAt('/protected', { role: 'student' })
    expect(screen.getByText('Teacher dashboard')).toBeInTheDocument()
  })
})
