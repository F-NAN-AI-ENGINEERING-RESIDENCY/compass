import { apiRequest } from './client.js'

// POST /api/enrollments exists on felix/roster-endpoints (open PR, not yet
// merged to main as of this writing) — a student joining a class by code.
// Body/response shape confirmed against app/schemas/enrollments.py.
export function joinClass(joinCode) {
  return apiRequest('/api/enrollments', {
    method: 'POST',
    body: JSON.stringify({ joinCode }),
  })
}

// ASSUMPTION, NOT CONFIRMED: there is no "list the logged-in student's
// enrollments" endpoint in app/routers/enrollments.py today — only POST
// exists. This guesses GET /api/enrollments would be added as the
// student-scoped mirror of GET /api/classes (which is teacher-scoped to
// "my classes"), returning EnrollmentResponse[] for the current student.
// Confirm the actual path/shape with the backend team before relying on this
// — it will 404 until that route exists.
export function listMyEnrollments() {
  return apiRequest('/api/enrollments')
}
