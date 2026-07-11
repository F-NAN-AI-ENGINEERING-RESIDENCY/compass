import { apiRequest } from './client.js'

// Creates a lesson under a class the logged-in teacher owns. Starts out
// 'scheduled' — use updateLessonStatus to go live.
export function createLesson({ classId, title }) {
  return apiRequest('/api/lessons', {
    method: 'POST',
    body: JSON.stringify({ classId, title }),
  })
}

// GET /api/lessons/:id is real and merged on main. Note: LessonResponse has
// no `title` field (even though the Lesson model has one) — only
// lessonId/classId/status/startedAt/endedAt come back.
export function getLesson(lessonId) {
  return apiRequest(`/api/lessons/${lessonId}`)
}

// PATCH /api/lessons/:id is real and merged on main — transitions a lesson's
// status. Only 'live' and 'ended' are valid transitions here (see
// app/schemas/lessons.py's LessonStatusUpdate); there's no way to go back to
// 'scheduled' once live.
export function updateLessonStatus(lessonId, status) {
  return apiRequest(`/api/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
