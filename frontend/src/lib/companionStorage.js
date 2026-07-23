// No backend model exists for the companion (or for any engagement/streak
// tracking) yet — same gap as the wellbeing journal and the old badge
// builder. Saved to localStorage instead: real persistence on this device
// without inventing a backend contract nobody's agreed on.
const CONFIG_KEY = 'compass_companion'
const ENGAGEMENT_KEY = 'compass_companion_engagement'

// Fired on `window` whenever engagement changes, so any mounted component
// (the dashboard's companion tie-in, the builder page) can react live
// without polling localStorage.
export const ENGAGEMENT_EVENT = 'compass:companion-engagement'

export const CREATURE_TYPES = ['blob', 'fox', 'owl', 'dino']
export const BODY_COLORS = ['forest', 'olive', 'ochre', 'clay', 'cream', 'cream-dim']

// Each accessory names the growth level it unlocks at. Level 1 (Hatchling)
// always has "none" available; everything else is a reward for sticking
// with the platform, per the spec's "recurring reward" ask.
export const ACCESSORIES = [
  { id: 'none', label: 'None', unlocksAt: 1 },
  { id: 'bow', label: 'Bow', unlocksAt: 1 },
  { id: 'glasses', label: 'Glasses', unlocksAt: 2 },
  { id: 'scarf', label: 'Scarf', unlocksAt: 3 },
  { id: 'star', label: 'Star badge', unlocksAt: 4 },
]

// Growth levels unlock roughly every 10 engagement actions (a saved
// reflection, a Scout message, attending a session) — deliberately gentle,
// not a grind: a student who uses the platform a handful of times a week
// will see their companion change within the first couple of weeks.
export const GROWTH_LEVELS = [
  { level: 1, name: 'Hatchling', threshold: 0 },
  { level: 2, name: 'Sprout', threshold: 10 },
  { level: 3, name: 'Companion', threshold: 25 },
  { level: 4, name: 'Guardian', threshold: 50 },
]

const DEFAULT_CONFIG = {
  name: '',
  creatureType: 'blob',
  bodyColor: 'olive',
  accessory: 'none',
}

export function getCompanionConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CONFIG_KEY)) }
  } catch {
    return { ...DEFAULT_CONFIG } // corrupted/missing localStorage — fail soft to defaults rather than crash the page
  }
}

export function saveCompanionConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function getEngagementCount() {
  const raw = Number(localStorage.getItem(ENGAGEMENT_KEY))
  return Number.isFinite(raw) ? raw : 0
}

// Called from Scout (a message sent) and the wellbeing journal (an entry
// saved) — the two "chatting with Scout" / "writing reflections" triggers
// named in the spec. "Attending sessions" isn't wired up since there's no
// session-attendance signal available on the frontend at all yet.
export function recordEngagement(amount = 1) {
  const next = getEngagementCount() + amount
  localStorage.setItem(ENGAGEMENT_KEY, String(next))
  window.dispatchEvent(new CustomEvent(ENGAGEMENT_EVENT, { detail: { count: next } }))
  return next
}

export function getGrowthLevel(count = getEngagementCount()) {
  // GROWTH_LEVELS is ascending, so the last one whose threshold we've met is current.
  return [...GROWTH_LEVELS].reverse().find((entry) => count >= entry.threshold) ?? GROWTH_LEVELS[0]
}

export function getNextGrowthLevel(count = getEngagementCount()) {
  const current = getGrowthLevel(count)
  return GROWTH_LEVELS.find((entry) => entry.level === current.level + 1) ?? null
}

export function isAccessoryUnlocked(accessoryId, count = getEngagementCount()) {
  const accessory = ACCESSORIES.find((entry) => entry.id === accessoryId)
  if (!accessory) return false
  return getGrowthLevel(count).level >= accessory.unlocksAt
}
