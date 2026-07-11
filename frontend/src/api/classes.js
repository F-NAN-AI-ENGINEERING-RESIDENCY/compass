import { apiRequest } from './client.js'

// Creates a class for the logged-in teacher. Only `name` is teacher-supplied —
// joinCode and alertThreshold get server-side defaults (see the Class model).
export function createClass({ name }) {
  return apiRequest('/api/classes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

// Lists the logged-in teacher's own classes, persisted server-side (not
// session-only), so navigating away and back no longer loses them.
export function listClasses() {
  return apiRequest('/api/classes')
}

// Fetches one class's details, including its roster if the requester is the owning teacher.
export function getClass(classId) {
  return apiRequest(`/api/classes/${classId}`)
}

export function updateClass(classId, { name, alertThreshold } = {}) {
  return apiRequest(`/api/classes/${classId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, alertThreshold }),
  })
}

export function deleteClass(classId) {
  return apiRequest(`/api/classes/${classId}`, { method: 'DELETE' })
}
