import { apiRequest } from './client.js'

// GET /api/lessons/:id/dashboard is real and merged on main (Noboni's
// Sprint 2 backend work). Two distinct modes, per app/services/signal_service.py:
// - no `since` -> returns only currently-OPEN signals (first load)
// - `since=<ISO timestamp>` -> returns anything created OR updated after that
//   time, regardless of status — this is how a status change (e.g. a signal
//   another tab just resolved) reaches a polling client. There's no
//   WebSocket yet (app/websockets/broadcaster.py is a no-op stub), so polling
//   with `since` is the only way to approximate "near real-time" right now.
export function getDashboard(lessonId, since) {
  const query = since ? `?since=${encodeURIComponent(since)}` : ''
  return apiRequest(`/api/lessons/${lessonId}/dashboard${query}`)
}

// Marks a signal resolved. `status` also accepts 'acknowledged' on the
// backend, but Sprint 2's requirement is specifically "mark resolved," so
// that's the only transition wired up here.
export function resolveSignal(lessonId, signalId) {
  return apiRequest(`/api/lessons/${lessonId}/signals/${signalId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'resolved' }),
  })
}

// Student sends an "I'm lost" signal. Real and merged on main. The backend
// requires the student be enrolled in the lesson's class (403 otherwise) and
// the lesson be live (409 otherwise) — see app/services/signal_service.py.
export function createSignal(lessonId) {
  return apiRequest(`/api/lessons/${lessonId}/signals`, { method: 'POST' })
}
