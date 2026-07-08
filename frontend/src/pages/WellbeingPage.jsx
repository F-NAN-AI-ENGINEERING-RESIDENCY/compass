import { useState } from 'react'

const JOURNAL_KEY = 'compass_wellbeing_journal'
const WINS_KEY = 'compass_wellbeing_wins'

// Wireframe spec screen 06 ("Wellbeing") — dusk gradient, one big breathing
// focal point, journal + wins floating below. No backend exists for any of
// this (it's a stretch feature — "Asia: focus/breathing exercise at session
// start" — in the sprint doc), so journal entries and wins are saved to
// localStorage instead of a server: real persistence across reloads on this
// device, without inventing a backend contract nobody's agreed on yet.
export function WellbeingPage() {
  const [isBreathing, setIsBreathing] = useState(false)
  const [journalEntries, setJournalEntries] = useState(() => readList(JOURNAL_KEY))
  const [journalDraft, setJournalDraft] = useState('')
  const [wins, setWins] = useState(() => readList(WINS_KEY))
  const [winDraft, setWinDraft] = useState('')

  function addJournalEntry(event) {
    event.preventDefault()
    if (!journalDraft.trim()) return
    const next = [{ text: journalDraft.trim(), at: Date.now() }, ...journalEntries]
    setJournalEntries(next)
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(next))
    setJournalDraft('')
  }

  function addWin(event) {
    event.preventDefault()
    if (!winDraft.trim()) return
    const next = [{ text: winDraft.trim(), at: Date.now() }, ...wins]
    setWins(next)
    localStorage.setItem(WINS_KEY, JSON.stringify(next))
    setWinDraft('')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        // dusk gradient — distinct from the forest/cream palette used everywhere
        // else, per the spec's note that this screen is deliberately "off the clock."
        background: 'linear-gradient(180deg, #3d3350 0%, #7a5a5a 55%, #d99b6c 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 1.5rem',
        color: '#fdf5ee',
      }}
    >
      <p style={{ opacity: 0.75, marginBottom: '2rem' }}>Off the clock.</p>

      <button
        onClick={() => setIsBreathing((current) => !current)}
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.6)',
          background: 'rgba(255,255,255,0.12)',
          color: 'inherit',
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'transform 4s ease-in-out',
          transform: isBreathing ? 'scale(1.15)' : 'scale(1)',
        }}
      >
        {isBreathing ? 'Breathe out…' : 'Take a minute.'}
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '720px',
          marginTop: '3rem',
        }}
      >
        <FloatingCard title="Journal">
          <form onSubmit={addJournalEntry} style={{ marginBottom: '0.75rem' }}>
            <textarea
              value={journalDraft}
              onChange={(event) => setJournalDraft(event.target.value)}
              placeholder="What's on your mind?"
              rows={2}
              style={{
                width: '100%',
                borderRadius: '10px',
                border: 'none',
                padding: '0.6rem',
                fontFamily: 'var(--font-body)',
                resize: 'vertical',
              }}
            />
            <button type="submit" className="btn-pill btn-pill--outline" style={{ marginTop: '0.5rem', color: 'inherit', borderColor: 'rgba(255,255,255,0.6)' }}>
              Save
            </button>
          </form>
          <EntryList entries={journalEntries} empty="Nothing written yet." />
        </FloatingCard>

        <FloatingCard title="Wins">
          <form onSubmit={addWin} style={{ marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={winDraft}
              onChange={(event) => setWinDraft(event.target.value)}
              placeholder="A small win today…"
              className="text-input"
              style={{ width: '100%' }}
            />
            <button type="submit" className="btn-pill btn-pill--outline" style={{ marginTop: '0.5rem', color: 'inherit', borderColor: 'rgba(255,255,255,0.6)' }}>
              Add
            </button>
          </form>
          <EntryList entries={wins} empty="No wins logged yet." />
        </FloatingCard>
      </div>
    </div>
  )
}

function FloatingCard({ title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.14)', borderRadius: 'var(--radius-card)', padding: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{title}</h2>
      {children}
    </div>
  )
}

function EntryList({ entries, empty }) {
  if (entries.length === 0) return <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{empty}</p>
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
      {entries.map((entry) => (
        <li key={entry.at} style={{ padding: '0.35rem 0', opacity: 0.9 }}>
          {entry.text}
        </li>
      ))}
    </ul>
  )
}

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? []
  } catch {
    return [] // corrupted/old localStorage shape — fail soft to empty rather than crash the page
  }
}
