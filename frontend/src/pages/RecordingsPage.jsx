import { useState } from 'react'

// Static example data — there's no recording/transcript backend at all
// (no video recording infra, no storage), so this whole screen is a visual
// mock of the list+detail pattern rather than real data.
const MOCK_RECORDINGS = [
  {
    id: 1,
    title: 'Period 3 Algebra — Solving Linear Equations',
    date: '2026-07-07',
    durationMin: 42,
    // Spike positions as a percentage across the recording, where "I'm lost" signals clustered.
    spikes: [18, 52, 71],
  },
  {
    id: 2,
    title: 'Period 3 Algebra — Fractions Review',
    date: '2026-07-03',
    durationMin: 38,
    spikes: [30],
  },
]

// Wireframe spec screen 15 ("Recordings & transcripts") — "jump straight to
// the confusion spikes." Mocked end to end: no recording/transcript backend
// exists, so there's nothing real to fetch or play.
export function RecordingsPage() {
  const [selectedId, setSelectedId] = useState(MOCK_RECORDINGS[0].id)
  const selected = MOCK_RECORDINGS.find((r) => r.id === selectedId)

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Recordings</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        Mocked — no recording/transcript backend exists yet, so these are example entries, not
        real lessons.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {MOCK_RECORDINGS.map((recording) => (
            <li key={recording.id} style={{ marginBottom: '0.75rem' }}>
              <button
                onClick={() => setSelectedId(recording.id)}
                className="card"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: recording.id === selectedId ? '2px solid var(--color-forest)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600 }}>{recording.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                  {recording.date} · {recording.durationMin} min
                </div>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{selected.title}</h2>

            {/* Scrubber with spike markers — a plain bar with positioned dots, not
                a real seekable player, since there's no actual video to play. */}
            <div style={{ position: 'relative', height: '8px', background: 'var(--color-cream-dim)', borderRadius: '4px', marginBottom: '0.5rem' }}>
              {selected.spikes.map((position) => (
                <button
                  key={position}
                  title={`Jump to spike at ${Math.round((position / 100) * selected.durationMin)}m`}
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    top: '-4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--color-clay)',
                    border: '2px solid white',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
              <span>0:00</span>
              <span>{selected.durationMin}:00</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
              {selected.spikes.length} confusion spike{selected.spikes.length === 1 ? '' : 's'} detected —
              click a marker above to jump to it once real playback exists.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
