import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveReflection } from '../api/reflections.js'

// Shown after a lesson ends (see StudentLessonPage.jsx). NOT the wellbeing
// journal (components/wellbeing/JournalSection.jsx) — that's open-ended and
// private to the student. This is tied to a specific lesson and IS meant to
// be seen by the teacher, so it deliberately does not reuse the journal's
// visual language (no Fraunces serif, no ruled paper) — keeping the two
// feeling distinct matters as much as keeping their data separate.
const UNDERSTOOD_CHIPS = ["I got it", "Kind of", "I'm still lost"]

// Fallback struggle-topic chips, used whenever real lesson subtopics aren't
// available. Real subtopics WOULD ideally come from something like
// QuestionCluster.representative_text (app/models/question_cluster.py),
// which is already grouped by lesson_id — but there's no endpoint exposing
// that to the frontend today, so `subtopics` below just defaults to [] and
// this component falls back to generic options. Whoever wires up real
// subtopics later just needs to pass a `subtopics` prop from wherever that
// data ends up living.
const FALLBACK_STRUGGLE_CHIPS = ['the main idea', 'the examples', 'the practice problems']

export function LessonReflection({ lessonId, subtopics = [] }) {
  const struggleChipOptions = subtopics.length > 0 ? subtopics : FALLBACK_STRUGGLE_CHIPS
  const navigate = useNavigate()

  // Single-select: "I got it" and "I'm still lost" are opposite ends of one
  // scale, not independent facts, so letting both be picked at once would
  // just produce confusing data. (The ticket describes chips generally as
  // multi-select; struggle topics below honor that since a student can
  // genuinely struggle with more than one thing at once — this one prompt is
  // the one deliberate exception. Worth confirming this reading is right.)
  const [understoodChip, setUnderstoodChip] = useState(null)
  const [understoodFreeText, setUnderstoodFreeText] = useState('')

  // Multi-select — a student can struggle with more than one topic.
  const [struggleChips, setStruggleChips] = useState([])
  const [struggleFreeText, setStruggleFreeText] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [error, setError] = useState(null)

  function toggleStruggleChip(chip) {
    setStruggleChips((current) => (current.includes(chip) ? current.filter((c) => c !== chip) : [...current, chip]))
  }

  const hasStruggleInput = struggleChips.length > 0 || struggleFreeText.trim().length > 0
  const hasAnyInput = Boolean(understoodChip) || understoodFreeText.trim().length > 0 || hasStruggleInput

  async function handleSave() {
    setError(null)
    setIsSaving(true)
    try {
      // CHIP-ENCODING NOTE for the backend team: our schema only has two text
      // fields (understood_text/struggled_text) — there's no separate
      // structured column for "which chips were tapped." So a chip selection
      // is folded into that same text field: the chip label(s) joined with
      // the free-text response using an em dash as a separator. E.g. picking
      // "Kind of" and typing "the fractions part" saves understoodText as
      // "Kind of — the fractions part". If a dedicated structured field
      // (e.g. a chips array/JSON column) gets added later, this encoding
      // should move there instead of being folded into the text.
      const understoodText = [understoodChip, understoodFreeText.trim()].filter(Boolean).join(' — ')
      const struggledText = [struggleChips.join(', ') || null, struggleFreeText.trim()]
        .filter(Boolean)
        .join(' — ')

      await saveReflection({ lessonId, understoodText, struggledText })
      setIsSaved(true)
    } catch {
      // Deliberately not showing err.message here — that's raw backend/HTTP
      // text (e.g. "Not Found"), which reads cold and confusing to a 6th-8th
      // grader and isn't the "calm inline message" this needs. Nothing above
      // is cleared on failure, so the student's chips/text are exactly as
      // they left them and "Save reflection" just re-submits.
      setError("Hmm, that didn't save. Want to try again?")
    } finally {
      setIsSaving(false)
    }
  }

  // Only offered — never forced — and only when the student actually
  // indicated a struggle. Uses the first selected topic chip as Scout's
  // starting context (handling multiple simultaneously is more than this
  // stretch feature needs); falls back to a generic opener if the student
  // only wrote free text with no chip picked.
  function handleWorkWithScout() {
    const topic = struggleChips[0]
    navigate(topic ? `/scout?topic=${encodeURIComponent(topic)}` : '/scout')
  }

  if (isDismissed) return null

  if (isSaved) {
    return (
      <div className="reflection-card" style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Thanks for sharing that.</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: hasStruggleInput ? '1.25rem' : 0 }}>
          Your teacher sees this so they know how to help next time.
        </p>
        {hasStruggleInput && (
          <button type="button" className="btn-pill btn-pill--primary" onClick={handleWorkWithScout}>
            Want to work through {struggleChips[0] ?? 'this'} with Scout?
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="reflection-card">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--color-forest)', marginBottom: '0.35rem' }}>
        Quick check-in
      </h2>
      {/* Positive framing, not surveillance/grading — especially important
          for the struggle prompt, which needs to feel safe to answer honestly. */}
      <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: '1.25rem' }}>
        Totally optional, takes ten seconds. Your teacher sees this so they know how to help next time.
      </p>

      {error && <p className="error-text">{error}</p>}

      {/* Prompt 1: what clicked */}
      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>What clicked for you today?</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        {UNDERSTOOD_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="reflection-chip"
            aria-pressed={understoodChip === chip}
            onClick={() => setUnderstoodChip((current) => (current === chip ? null : chip))}
          >
            {chip}
          </button>
        ))}
      </div>
      <textarea
        className="text-input"
        style={{ width: '100%', marginBottom: '1.25rem' }}
        rows={2}
        placeholder="Anything else? (optional)"
        value={understoodFreeText}
        onChange={(event) => setUnderstoodFreeText(event.target.value)}
      />

      {/* Prompt 2: what was tricky — kept as its own separate box, never
          collapsed into the first prompt. */}
      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>What was tricky or confusing?</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        {struggleChipOptions.map((chip) => (
          <button
            key={chip}
            type="button"
            className="reflection-chip"
            aria-pressed={struggleChips.includes(chip)}
            onClick={() => toggleStruggleChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
      <textarea
        className="text-input"
        style={{ width: '100%', marginBottom: '1.5rem' }}
        rows={2}
        placeholder="Anything else? (optional)"
        value={struggleFreeText}
        onChange={(event) => setStruggleFreeText(event.target.value)}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          type="button"
          className="btn-pill btn-pill--primary"
          onClick={handleSave}
          disabled={isSaving || !hasAnyInput}
        >
          {isSaving ? 'Saving…' : 'Save reflection'}
        </button>
        {/* Clear, always-available skip — this never blocks the student. */}
        <button type="button" className="text-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsDismissed(true)}>
          Skip for now
        </button>
      </div>
    </div>
  )
}
