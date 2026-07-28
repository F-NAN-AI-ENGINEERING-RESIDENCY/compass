// Tracks the single most recent thing the student was doing, so the
// dashboard's "pick up where you left off" card has something real to
// resume — no backend history endpoint exists yet, so this is scoped to
// this device only, same as the rest of this file's siblings.
const ACTIVITY_KEY = 'compass_last_activity'

export function recordActivity({ type, label, path }) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify({ type, label, path, at: Date.now() }))
}

export function getLastActivity() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY))
  } catch {
    return null
  }
}
