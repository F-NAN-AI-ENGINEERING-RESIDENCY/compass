import { apiRequest } from './client.js'

// GET /api/lessons/:id is real and merged on main. Note: LessonResponse has
// no `title` field (even though the Lesson model has one) — only
// lessonId/classId/status/startedAt/endedAt come back.
export function getLesson(lessonId) {
  return apiRequest(`/api/lessons/${lessonId}`)
}
