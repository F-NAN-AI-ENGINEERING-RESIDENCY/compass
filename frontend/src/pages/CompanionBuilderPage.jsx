import { useEffect, useState } from 'react'
import { CompanionCreature } from '../components/CompanionCreature.jsx'
import {
  ACCESSORIES,
  BODY_COLORS,
  CREATURE_TYPES,
  ENGAGEMENT_EVENT,
  getCompanionConfig,
  getEngagementCount,
  getGrowthLevel,
  getNextGrowthLevel,
  isAccessoryUnlocked,
  saveCompanionConfig,
} from '../lib/companionStorage.js'

const CREATURE_LABELS = { blob: 'Blob', fox: 'Fox', owl: 'Owl', dino: 'Dino' }

// Replaces the old shape-based "badge" builder (see git history) with a
// creature companion — the direction chosen over a human avatar or an
// emblem, since a companion can visibly grow alongside the student rather
// than being a one-time customization.
export function CompanionBuilderPage() {
  const saved = getCompanionConfig()
  const [name, setName] = useState(saved.name)
  const [creatureType, setCreatureType] = useState(saved.creatureType)
  const [bodyColor, setBodyColor] = useState(saved.bodyColor)
  const [accessory, setAccessory] = useState(saved.accessory)
  const [justSaved, setJustSaved] = useState(false)
  const [engagement, setEngagement] = useState(getEngagementCount())

  // Growth happens from using the rest of the app (Scout, journaling) —
  // listen live so this page updates if that happens in another tab, and so
  // the progress bar below feels connected to "the rest of Compass," not
  // just this one page.
  useEffect(() => {
    function onEngagement(event) {
      setEngagement(event.detail.count)
    }
    window.addEventListener(ENGAGEMENT_EVENT, onEngagement)
    return () => window.removeEventListener(ENGAGEMENT_EVENT, onEngagement)
  }, [])

  const growthLevel = getGrowthLevel(engagement)
  const nextLevel = getNextGrowthLevel(engagement)

  function handleSave() {
    saveCompanionConfig({ name: name.trim(), creatureType, bodyColor, accessory })
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Make it yours.</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>
        Build a companion who grows alongside you.
      </p>

      {/* Live preview */}
      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'var(--color-cream-dim)',
          margin: '0 auto 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CompanionCreature creatureType={creatureType} bodyColor={bodyColor} accessory={accessory} level={growthLevel.level} size={130} />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-forest)', marginBottom: '0.25rem' }}>
        {name.trim() || 'Your companion'} · Level {growthLevel.level} — {growthLevel.name}
      </p>
      <GrowthProgress count={engagement} currentLevel={growthLevel} nextLevel={nextLevel} />

      <div className="field" style={{ textAlign: 'left', margin: '2rem 0 1.5rem' }}>
        <label htmlFor="companion-name">Name your companion</label>
        <input
          id="companion-name"
          type="text"
          className="text-input"
          style={{ width: '100%' }}
          placeholder="Give them a name…"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={20}
        />
      </div>

      <PickerRow label="Type">
        {CREATURE_TYPES.map((option) => (
          <PickerSwatch key={option} isSelected={creatureType === option} onClick={() => setCreatureType(option)} label={CREATURE_LABELS[option]}>
            <CompanionCreature creatureType={option} bodyColor={bodyColor} accessory="none" size={40} />
          </PickerSwatch>
        ))}
      </PickerRow>

      <PickerRow label="Color">
        {BODY_COLORS.map((option) => (
          <PickerSwatch key={option} isSelected={bodyColor === option} onClick={() => setBodyColor(option)} label={option}>
            <span
              style={{
                display: 'block',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `var(--color-${option})`,
                border: option.startsWith('cream') ? '1px solid var(--color-cream-dim)' : 'none',
              }}
            />
          </PickerSwatch>
        ))}
      </PickerRow>

      <PickerRow label="Accessory">
        {ACCESSORIES.map((option) => {
          const unlocked = isAccessoryUnlocked(option.id, engagement)
          return (
            <PickerSwatch
              key={option.id}
              isSelected={accessory === option.id}
              onClick={() => unlocked && setAccessory(option.id)}
              label={unlocked ? option.label : `${option.label} — unlocks at Level ${option.unlocksAt}`}
              locked={!unlocked}
            >
              {option.id === 'none' ? (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>None</span>
              ) : (
                <CompanionCreature creatureType="blob" bodyColor="cream-dim" accessory={unlocked ? option.id : 'none'} size={40} />
              )}
            </PickerSwatch>
          )
        })}
      </PickerRow>

      <button className="btn-pill btn-pill--primary" onClick={handleSave} style={{ marginTop: '1rem' }}>
        Save companion
      </button>
      {justSaved && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
          Saved on this device.
        </p>
      )}
    </div>
  )
}

function GrowthProgress({ count, currentLevel, nextLevel }) {
  if (!nextLevel) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
        Your companion's fully grown — thanks for sticking with it.
      </p>
    )
  }
  const span = nextLevel.threshold - currentLevel.threshold
  const progress = Math.min(1, (count - currentLevel.threshold) / span)
  return (
    <div style={{ maxWidth: '320px', margin: '0.5rem auto 0' }}>
      <div style={{ height: '6px', borderRadius: 'var(--radius-pill)', background: 'var(--color-cream-dim)', overflow: 'hidden' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--color-olive)' }} />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.4rem' }}>
        {nextLevel.threshold - count} more check-ins, reflections, or Scout chats to reach {nextLevel.name}
      </p>
    </div>
  )
}

function PickerRow({ label, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem', textAlign: 'left' }}>{label}</p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

// One chunky, large-tap-target swatch button in any picker row. `locked`
// dims it and swaps the cursor so an unearned accessory still reads as
// selectable-looking but clearly not yet available, rather than vanishing
// entirely — the student can see what's coming.
function PickerSwatch({ isSelected, onClick, children, label, locked = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-disabled={locked}
      className="companion-swatch"
      style={{
        width: '52px',
        height: '52px',
        borderRadius: 'var(--radius-card)',
        border: isSelected ? '2px solid var(--color-forest)' : '1.5px solid var(--color-cream-dim)',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: locked ? 0.4 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}
