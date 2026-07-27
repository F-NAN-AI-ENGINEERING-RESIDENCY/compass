// Shared fetch wrapper used by every api/*.js file. Centralizing this means the
// base URL, auth header, and error handling only need to be written once.

// The FastAPI backend's default local address (uvicorn's default port is 8000).
// import.meta.env.VITE_API_URL lets this be overridden without editing code —
// Vite only exposes env vars prefixed with VITE_ to browser code.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Key used to persist the auth token across page reloads. Shared with AuthContext.
export const TOKEN_STORAGE_KEY = 'compass_token'

// Reads the current token straight from localStorage rather than from React
// state, so this plain (non-component) module never needs access to context.
function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

// Makes one HTTP request to the backend and returns the parsed JSON body.
// path: e.g. "/api/auth/login". options: standard fetch() options (method, body, etc).
export async function apiRequest(path, options = {}) {
  const token = getStoredToken() // attach the logged-in user's token, if any

  const headers = {
    'Content-Type': 'application/json', // every request/response body here is JSON
    ...options.headers, // let individual calls add/override headers if they need to
  }
  if (token) {
    headers.Authorization = `Bearer ${token}` // matches the backend's HTTPBearer auth scheme
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  // 204 No Content has no body to parse — return null instead of calling .json().
  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null) // tolerate a non-JSON error body

  if (!response.ok) {
    // app/exceptions.py normalizes every error response to { "message": "..." }
    // (not FastAPI's default { "detail": "..." }) — .detail is checked too as a
    // defensive fallback in case something outside those handlers ever responds
    // in the framework-default shape, but .message is what the backend actually sends.
    const message = data?.message || data?.detail || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return data
}
