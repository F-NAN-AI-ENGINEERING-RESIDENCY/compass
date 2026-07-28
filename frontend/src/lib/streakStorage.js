// No backend "last active"/streak column exists yet (same gap as the rest
// of this file's localStorage-backed siblings). Tracks distinct calendar
// days visited, on this device, so the dashboard can show a gentle streak
// without inventing a backend contract nobody's agreed on.
const DATES_KEY = 'compass_checkin_dates'

function todayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function readDates() {
  try {
    return JSON.parse(localStorage.getItem(DATES_KEY)) ?? []
  } catch {
    return []
  }
}

// How many consecutive days (ending today) appear in `dates`. Deliberately
// has no concept of a "broken" streak to report on — a gap just means the
// count starts over quietly at whatever the new run is, never flagged.
function consecutiveDaysEndingToday(dates) {
  const seen = new Set(dates)
  const cursor = new Date()
  let streak = 0
  while (seen.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Call once per dashboard visit — records today (if not already recorded)
// and returns the resulting streak length.
export function recordCheckIn() {
  const dates = readDates()
  const today = todayKey()
  const next = dates.includes(today) ? dates : [...dates, today]
  if (next !== dates) localStorage.setItem(DATES_KEY, JSON.stringify(next))
  return consecutiveDaysEndingToday(next)
}
