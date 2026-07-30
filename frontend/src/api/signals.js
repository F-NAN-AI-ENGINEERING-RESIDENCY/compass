import { apiRequest } from './client.js'

// ANONYMITY BOUNDARY — read this before touching either export below.
//
// getDashboard and resolveSignal are TEACHER-ONLY. They return/mutate
// confusion signals *with student identity attached*, which is correct and
// required for the teacher's dashboard (a teacher must know who to help).
// But that also makes both functions unsafe to ever call from student-facing
// code: the entire value of the "I'm lost" signal is that classmates can't
// tell who sent one. Even a de-identified count ("2 students are confused")
// is enough to de-anonymize someone in a small class by process of
// elimination, so a student-facing view must show ZERO information about
// other students' signals — not a name, not a count, not an indicator.
// Only import these two from a component gated by `ProtectedRoute
// role="teacher"` (see App.jsx). Student views must only ever call
// createSignal below, which is write-only and returns no other student's data.

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
// Write-only by design: it returns the created signal (the student's own),
// never a list of other students' signals — this is the ONLY signals
// function student-facing components should ever import. See the
// ANONYMITY BOUNDARY note above before adding any new student-facing call
// that reads signal data.
export function createSignal(lessonId) {
  return apiRequest(`/api/lessons/${lessonId}/signals`, { method: 'POST' })
}
