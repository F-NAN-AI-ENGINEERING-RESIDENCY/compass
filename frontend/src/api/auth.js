import { apiRequest } from './client.js'

// Registers a new account. Maps directly onto the backend's RegisterRequest
// schema (app/schemas/auth.py) — identical shape for both roles, `role`
// just picks which table (teachers vs students) the row lands in.
export function register({ role, username, name, email, password }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ role, username, name, email, password }),
  })
}

// Logs a user in. The backend's LoginRequest takes `username`, not email —
// there's no email-based lookup on the backend today, so the form field asks
// for username to match, even though the wireframe spec shows "School
// email." (Flag to the team if email login is wanted; that needs a backend change.)
export function login({ role, username, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role, username, password }),
  })
}
