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

// GET /api/enrollments: student-scoped mirror of GET /api/classes (teacher-
// scoped to "my classes"), added on noboni/student-enrollments-list. Returns
// EnrollmentResponse[] for the current student.
export function listMyEnrollments() {
  return apiRequest('/api/enrollments')
}
