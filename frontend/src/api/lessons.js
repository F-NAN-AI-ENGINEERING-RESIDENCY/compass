import { apiRequest } from './client.js'

// Creates a lesson under a class the logged-in teacher owns. Starts out
// 'scheduled' — use updateLessonStatus to go live. scheduledAt is optional
// (see LessonCreateRequest in app/schemas/lessons.py).
export function createLesson({ classId, title, scheduledAt }) {
  return apiRequest('/api/lessons', {
    method: 'POST',
    body: JSON.stringify({ classId, title, scheduledAt: scheduledAt || undefined }),
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

// GET /api/lessons/:id/video-token is real and merged on main. Only callable
// while the lesson is 'live' (409 otherwise) — the backend provisions the
// Daily room lazily on first call, not at lesson-creation time. Returns
// { roomId, roomUrl, provider, token }; roomUrl + token are what Daily's
// client SDK needs to join the call.
export function getVideoToken(lessonId) {
  return apiRequest(`/api/lessons/${lessonId}/video-token`)
}
