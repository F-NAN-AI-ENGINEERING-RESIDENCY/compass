import { apiRequest } from './client.js'

// Registers a new teacher account. Maps directly onto the backend's
// RegisterRequest schema (app/schemas/auth.py) — role is hardcoded to
// 'teacher' here since this app only ever signs up teachers.
export function registerTeacher({ username, name, email, password }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ role: 'teacher', username, name, email, password }),
  })
}

// Logs a teacher in. The backend's LoginRequest takes `username`, not email —
// there's no email-based lookup on the backend today, so the form field below
// asks for username to match, even though the wireframe spec shows "School
// email." (Flag to the team if email login is wanted; that needs a backend change.)
export function loginTeacher({ username, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role: 'teacher', username, password }),
  })
}
