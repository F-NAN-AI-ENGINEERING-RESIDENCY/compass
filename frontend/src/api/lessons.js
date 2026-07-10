import { apiRequest } from './client.js'

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
