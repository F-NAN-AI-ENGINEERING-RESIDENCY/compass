import { apiRequest } from './client.js'

// Felix has implemented both of these on felix/roster-endpoints (open PR, not
// yet merged to main as of this writing) — field names match exactly what
// was assumed here (see ClassResponse in app/schemas/classes.py), so no
// rework needed on that front. What's still missing: a way to read a class's
// enrolled students. See the note in TeacherDashboardPage.jsx for details.

// Creates a class for the logged-in teacher. Only `name` is teacher-supplied —
// joinCode and alertThreshold get server-side defaults (see the Class model).
export function createClass({ name }) {
  return apiRequest('/api/classes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

// Fetches one class's details (name, joinCode, etc). Does NOT include the
// roster/enrollments — that data isn't returned by any endpoint yet.
export function getClass(classId) {
  return apiRequest(`/api/classes/${classId}`)
}
