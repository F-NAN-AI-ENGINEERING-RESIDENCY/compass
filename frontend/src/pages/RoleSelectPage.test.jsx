import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RoleSelectPage } from './RoleSelectPage.jsx'

describe('RoleSelectPage', () => {
  it('links the student card to signup with role=student', () => {
    render(<MemoryRouter><RoleSelectPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /continue as a student/i })).toHaveAttribute(
      'href',
      '/signup?role=student',
    )
  })

  it('links the teacher card to signup with role=teacher', () => {
    render(<MemoryRouter><RoleSelectPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /continue as a teacher/i })).toHaveAttribute(
      'href',
      '/signup?role=teacher',
    )
  })

  it('links the class-invite shortcut to student signup', () => {
    render(<MemoryRouter><RoleSelectPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /enter your code/i })).toHaveAttribute(
      'href',
      '/signup?role=student',
    )
  })
})
