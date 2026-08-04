import { TOKEN_STORAGE_KEY } from '../api/client.js'

// Builds the URL for a lesson's real-time WebSocket channel
// (app/websockets/dashboard_ws.py's `/ws/lessons/{lesson_id}`), reusing the
// same backend host the REST client talks to (VITE_API_URL, same fallback
// as api/client.js) and the same stored auth token — a WS handshake carries
// no Authorization header, so the backend expects the token as a query
// param instead (see authenticate_lesson_socket on the server).
export function lessonSocketUrl(lessonId) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const wsBase = base.replace(/^http/, 'ws') // http(s):// -> ws(s)://
  const token = localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  return `${wsBase}/ws/lessons/${lessonId}?token=${encodeURIComponent(token)}`
}
