import { apiRequest } from './client.js'

// POST /api/tutor/message is real and merged on main (Gemini-backed for now,
// see README's "Known deviations" — provider-agnostic, Anthropic later).
// lessonId is optional: Scout has no lesson context today (it's a standalone
// screen, not opened from within a lesson), so callers can omit it.
export function sendTutorMessage(message, lessonId) {
  return apiRequest('/api/tutor/message', {
    method: 'POST',
    body: JSON.stringify({ message, lessonId: lessonId ?? null }),
  })
}
