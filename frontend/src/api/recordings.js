import { apiRequest } from './client.js'

// All three real and merged on main (Noboni's recording/transcription work).
// Recordings are lesson-scoped — there's no "list all my recordings across
// every lesson" endpoint, same "no global list" situation as classes/sessions.

export function listRecordings(lessonId) {
  return apiRequest(`/api/lessons/${lessonId}/recordings`)
}

// Daily's access links are temporary and expire, so the backend deliberately
// never caches one — fetch fresh right when the teacher wants to open it,
// not ahead of time.
export function getAccessLink(recordingId) {
  return apiRequest(`/api/recordings/${recordingId}/access-link`)
}

// Transcript is fetched per lesson, not per recording (a lesson has at most
// one transcript even if Daily produced multiple recording segments).
export function getTranscript(lessonId) {
  return apiRequest(`/api/lessons/${lessonId}/transcript`)
}
