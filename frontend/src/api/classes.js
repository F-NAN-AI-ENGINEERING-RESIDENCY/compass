import { apiRequest } from './client.js'

// Anticipated contract — Felix hasn't shipped POST /api/classes or
// GET /api/classes/:id yet (still unchecked in the sprint doc as of this
// writing), so these calls will 404 until then. Field names match the
// existing Class SQLAlchemy model (app/models/class_.py) via CamelModel's
// snake_case -> camelCase conversion, so no rework is expected once it lands.

// Creates a class for the logged-in teacher. Only `name` is teacher-supplied —
// joinCode and alertThreshold get server-side defaults (see the Class model).
export function createClass({ name }) {
  return apiRequest('/api/classes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

// Fetches one class's details, including its roster for the dashboard's
// "view class roster" requirement.
export function getClass(classId) {
  return apiRequest(`/api/classes/${classId}`)
}
