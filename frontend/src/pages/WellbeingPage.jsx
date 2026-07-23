import { useState } from 'react'
import { JournalSection } from '../components/wellbeing/JournalSection.jsx'
import { MeditationSection } from '../components/wellbeing/MeditationSection.jsx'

// Wireframe spec screen 06 ("Wellbeing"). Split into two tabs — the journal
// reads like a real paper journal (cream, ruled lines, serif text), so it
// no longer shares the previous single-page dusk gradient with the
// breathing exercise, which keeps its own forest-green panel.
export function WellbeingPage() {
  const [tab, setTab] = useState('journal')

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Wellbeing</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>A calm corner, just for you.</p>

      <div role="tablist" style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-cream-dim)', marginBottom: '2rem' }}>
        <button role="tab" aria-selected={tab === 'journal'} className="wellbeing-tab" onClick={() => setTab('journal')}>
          Journal
        </button>
        <button role="tab" aria-selected={tab === 'meditation'} className="wellbeing-tab" onClick={() => setTab('meditation')}>
          Breathe
        </button>
      </div>

      {tab === 'journal' ? <JournalSection /> : <MeditationSection onDone={() => setTab('journal')} />}
    </div>
  )
}
