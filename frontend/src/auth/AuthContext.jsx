import { createContext, useContext, useEffect, useState } from 'react' // React's built-in context/state tools
import { apiRequest, TOKEN_STORAGE_KEY } from '../api/client.js'

// React Context is how we share "who's logged in" with any component in the
// tree without passing it down as a prop through every level.
const AuthContext = createContext(null)

// Wrap the whole app in this once (see App.jsx) so every page can read auth state.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // the logged-in user's profile, or null if signed out
  const [isLoading, setIsLoading] = useState(true) // true while we check for an existing session on first load

  // Runs once when the app first mounts. If a token was saved from a previous
  // visit, ask the backend who it belongs to instead of trusting it blindly —
  // it may have expired or been revoked server-side.
  useEffect(() => {
    const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!existingToken) {
      setIsLoading(false) // nothing to check, stop showing the loading state
      return
    }

    apiRequest('/api/auth/me')
      .then((profile) => setUser(profile)) // token is valid — restore the session
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY) // token was rejected — throw it away
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, []) // empty dependency array = run only once, not on every re-render

  // Called by the login page after a successful POST /api/auth/login.
  function login(token, profile) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token) // persist across page reloads
    setUser(profile) // update in-memory state so the UI reacts immediately
  }

  // Called by a "log out" button anywhere in the app.
  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
  }

  const value = { user, isLoading, login, logout } // everything consumers of this context can access

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Convenience hook so components can write `const { user } = useAuth()`
// instead of importing useContext + AuthContext everywhere.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Fails loudly if someone forgets to wrap the app in <AuthProvider> —
    // better than silently returning undefined and crashing somewhere else.
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
