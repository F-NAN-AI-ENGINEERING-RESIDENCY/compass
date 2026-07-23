import { useState } from 'react'
import { MoodPicker, moodEmoji } from '../MoodPicker.jsx'
import { recordEngagement } from '../../lib/companionStorage.js'

const JOURNAL_KEY = 'compass_wellbeing_journal'

// Rotating reflective prompts — just enough of a nudge to get past a blank
// page without turning this into a worksheet.
const PROMPTS = [
  'When did you feel proud this week?',
  "What's one thing that felt easier today than it used to?",
  'Who or what helped you today?',
  "What's something you're looking forward to?",
  'What would you tell a friend who felt the way you do right now?',
  "What's one small thing that went well today?",
]

// Deterministic "rotation" by day of year, not random — so the prompt
// doesn't reshuffle every time the page re-renders, only once a day.
function promptOfTheDay() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000)
  return PROMPTS[dayOfYear % PROMPTS.length]
}

// Wellbeing journal — no backend model exists for entries (same gap noted
// on the page before this rewrite), so entries save to localStorage:
// real persistence on this device without inventing a backend contract
// nobody's agreed on yet.
export function JournalSection() {
  const [entries, setEntries] = useState(() => readEntries())
  const [draft, setDraft] = useState('')
  const [mood, setMood] = useState(null)

  function handleSave(event) {
    event.preventDefault()
    if (!draft.trim()) return
    const next = [{ text: draft.trim(), mood: mood ?? 'okay', at: Date.now() }, ...entries]
    setEntries(next)
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(next))
    setDraft('')
    setMood(null)
    recordEngagement() // "writing reflections" is a companion growth trigger
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <form onSubmit={handleSave} className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>{todayLabel()}</p>
          <MoodPicker value={mood} onChange={setMood} size="sm" />
        </div>
        <textarea
          className="journal-textarea"
          rows={6}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write whatever's on your mind…"
        />
        <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', fontStyle: 'italic', margin: '0.85rem 0' }}>
          {promptOfTheDay()}
        </p>
        <button type="submit" className="btn-pill btn-pill--primary">
          Save entry
        </button>
      </form>

      <h2 style={{ fontSize: '1rem', color: 'var(--color-ink-muted)', marginBottom: '0.75rem' }}>Past entries</h2>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
          Nothing written yet — your first entry will show up here.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map((entry) => (
            <div key={entry.at} className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{moodEmoji(entry.mood)}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: '0 0 0.25rem' }}>{formatDate(entry.at)}</p>
                <p className="journal-entry-text" style={{ fontSize: '0.95rem', margin: 0 }}>{truncate(entry.text, 110)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
function truncate(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text
}
function readEntries() {
  try {
    return JSON.parse(localStorage.getItem(JOURNAL_KEY)) ?? []
  } catch {
    return [] // corrupted/old localStorage shape — fail soft to empty rather than crash the page
  }
}
