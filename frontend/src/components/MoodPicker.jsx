// Shared mood-selector row — used by the wellbeing journal (mood per entry)
// and the student dashboard's private daily check-in (Tasks 6 & 7), so
// picking a mood looks and behaves identically in both places.
export const MOODS = [
  { id: 'great', emoji: '😄', label: 'Great' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'low', emoji: '😕', label: 'Low' },
  { id: 'rough', emoji: '😢', label: 'Rough' },
]

export function moodEmoji(moodId) {
  return MOODS.find((mood) => mood.id === moodId)?.emoji ?? '😐'
}

export function MoodPicker({ value, onChange, size = 'md' }) {
  const isSmall = size === 'sm'
  return (
    <div style={{ display: 'flex', gap: isSmall ? '0.4rem' : '0.6rem' }}>
      {MOODS.map((mood) => (
        <button
          key={mood.id}
          type="button"
          onClick={() => onChange(mood.id)}
          title={mood.label}
          aria-label={mood.label}
          aria-pressed={value === mood.id}
          className="mood-picker-option"
          style={{
            width: isSmall ? '36px' : '44px',
            height: isSmall ? '36px' : '44px',
            fontSize: isSmall ? '1.1rem' : '1.35rem',
            background: value === mood.id ? 'var(--color-cream-dim)' : 'transparent',
            border: value === mood.id ? '2px solid var(--color-forest)' : '2px solid transparent',
          }}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  )
}
