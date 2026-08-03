import { apiRequest } from './client.js'

// BACKEND STATUS: POST /api/lessons/:id/reflections does NOT exist yet — no
// reflections model, schema, router, or migration exists anywhere in app/
// as of this writing (confirmed by checking app/models, app/schemas,
// app/routers, and alembic/versions). This call WILL 404 until that route
// lands. Built against the shape described in the ticket, nested under the
// lesson the same way signals are (see api/signals.js's createSignal), since
// that's this codebase's existing convention for lesson-scoped writes.
//
// Flagging for the team to confirm: the body below — { lessonId,
// understoodText, struggledText } — is our best guess at what the
// reflections table expects (understood_text/struggled_text once the
// backend's CamelModel aliasing un-camelCases it), matching the ticket's
// { lesson_id, understood_text, struggled_text }.
export function saveReflection({ lessonId, understoodText, struggledText }) {
  return apiRequest(`/api/lessons/${lessonId}/reflections`, {
    method: 'POST',
    body: JSON.stringify({ lessonId, understoodText, struggledText }),
  })
}
