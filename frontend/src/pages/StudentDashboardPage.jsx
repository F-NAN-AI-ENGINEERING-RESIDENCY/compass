import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { CompanionCreature } from '../components/CompanionCreature.jsx'
import { MoodPicker } from '../components/MoodPicker.jsx'
import { recordCheckIn } from '../lib/streakStorage.js'
import { getLastActivity, recordActivity } from '../lib/activityStorage.js'
import {
  getCompanionConfig,
  getEngagementCount,
  getGrowthLevel,
  getNextGrowthLevel,
} from '../lib/companionStorage.js'

// Mocked — there's no endpoint for a student to fetch their own mastery
// across classes (Felix's GET /students/:id/skills, Sprint 2, isn't built).
// The per-lesson dashboard's skillSnapshot is class-wide and teacher-only, so
// it can't be reused here either. Colors are olive/ochre only (never clay,
// never red) — this section frames growth, not deficit.
const MOCK_TOPICS = [
  { name: 'Linear Equations', score: 68, weeklyGrowth: 4 },
  { name: 'Fractions', score: 72, weeklyGrowth: 11 },
  { name: 'Word Problems', score: 88, weeklyGrowth: 6 },
]

const MOOD_CHECKIN_KEY = 'compass_mood_checkin'
const JOURNAL_KEY = 'compass_wellbeing_journal' // read-only here, owned by WellbeingPage

function timeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}

// Wireframe spec screen 04 ("Dashboard" — student home). Distinct from
// StudentHomePage (the "join class, view enrolled classes" shell). Every
// personalization element below (streak, last activity, mood check-in,
// companion growth) is tracked client-side in localStorage — there's no
// backend model for any of it yet, same gap noted throughout this codebase's
// other localStorage-backed features (the wellbeing journal, the companion).
export function StudentDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0]

  const [streak] = useState(() => recordCheckIn())
  const [lastActivity] = useState(() => getLastActivity())
  const [engagement] = useState(() => getEngagementCount())
  const [companion] = useState(() => getCompanionConfig())
  const [todaysMood, setTodaysMood] = useState(() => readTodaysMood())

  const growthLevel = getGrowthLevel(engagement)
  const nextLevel = getNextGrowthLevel(engagement)
  const bestTopic = [...MOCK_TOPICS].sort((a, b) => b.weeklyGrowth - a.weeklyGrowth)[0]
  const journalNudge = getJournalNudge()

  function handlePractice(topic) {
    recordActivity({ type: 'practice', label: `Practicing ${topic.name}`, path: '/scout' })
    navigate('/scout')
  }

  function handleMoodSelect(mood) {
    setTodaysMood(mood)
    localStorage.setItem(MOOD_CHECKIN_KEY, JSON.stringify({ mood, date: new Date().toISOString().slice(0, 10) }))
  }

  return (
    <div>
      {/* Personal greeting header */}
      <div style={{ background: 'var(--color-forest)', color: 'var(--color-text-on-dark)', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(245,241,230,0.12)', borderRadius: '50%', display: 'inline-flex' }}>
            <CompanionCreature creatureType={companion.creatureType} bodyColor={companion.bodyColor} accessory={companion.accessory} level={growthLevel.level} size={64} />
          </span>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
              {timeGreeting()}, {firstName}.
            </h1>
            <p style={{ color: 'var(--color-text-on-dark-muted)' }}>
              {streak > 1
                ? `You've checked in ${streak} days in a row.`
                : "Glad you're here today."}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Quick, private mood check-in */}
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>How are you feeling right now?</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: '0.85rem' }}>
            Just for you — no one else sees this.
          </p>
          <MoodPicker value={todaysMood} onChange={handleMoodSelect} />
          {todaysMood && <p style={{ fontSize: '0.85rem', color: 'var(--color-olive)', marginTop: '0.75rem' }}>Got it — thanks for checking in. 💚</p>}
        </div>

        {/* Pick up where you left off */}
        {lastActivity && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: '0.2rem' }}>Pick up where you left off</p>
              <p style={{ fontWeight: 600 }}>{lastActivity.label}</p>
            </div>
            <Link to={lastActivity.path} className="btn-pill btn-pill--primary" style={{ textDecoration: 'none' }}>
              Resume →
            </Link>
          </div>
        )}

        {/* Growth framing — improvements only, olive/ochre, never red/deficit-framed */}
        <div>
          <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>This week you grew most in {bestTopic.name}.</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
            Mocked example scores — there's no endpoint yet for a student to fetch their own mastery across classes.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {MOCK_TOPICS.map((topic) => (
              <div key={topic.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span>{topic.name}</span>
                  <span style={{ color: 'var(--color-olive)' }}>+{topic.weeklyGrowth} this week</span>
                </div>
                <div style={{ height: '8px', borderRadius: 'var(--radius-pill)', background: 'var(--color-cream-dim)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${topic.score}%`,
                      height: '100%',
                      background: topic === bestTopic ? 'var(--color-olive)' : 'var(--color-ochre)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="btn-pill btn-pill--outline" style={{ marginTop: '1.25rem' }} onClick={() => handlePractice(bestTopic)}>
            Practice {bestTopic.name} →
          </button>
        </div>

        {/* Companion tie-in */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CompanionCreature creatureType={companion.creatureType} bodyColor={companion.bodyColor} accessory={companion.accessory} level={growthLevel.level} size={56} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600 }}>
              {companion.name || 'Your companion'} is a Level {growthLevel.level} {growthLevel.name}.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
              {nextLevel
                ? `Keep checking in, reflecting, and chatting with Scout to reach ${nextLevel.name}.`
                : "They've reached their final form — amazing work."}
            </p>
          </div>
          <Link to="/companion" className="btn-pill btn-pill--outline" style={{ textDecoration: 'none', flexShrink: 0 }}>
            Visit
          </Link>
        </div>

        {/* Gentle reminder, never a nag */}
        {journalNudge && (
          <div className="card" style={{ background: 'var(--color-cream-dim)' }}>
            <p style={{ fontSize: '0.9rem' }}>{journalNudge}</p>
            <Link to="/wellbeing" className="btn-pill btn-pill--outline" style={{ textDecoration: 'none', marginTop: '0.75rem', display: 'inline-flex' }}>
              Open journal →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function readTodaysMood() {
  try {
    const saved = JSON.parse(localStorage.getItem(MOOD_CHECKIN_KEY))
    const today = new Date().toISOString().slice(0, 10)
    return saved?.date === today ? saved.mood : null
  } catch {
    return null
  }
}

// A soft nudge if it's been a few days since the last journal entry — never
// phrased as having missed anything, just an open invitation back.
function getJournalNudge() {
  try {
    const entries = JSON.parse(localStorage.getItem(JOURNAL_KEY)) ?? []
    if (entries.length === 0) return null
    const daysSince = Math.floor((Date.now() - entries[0].at) / 86400000)
    if (daysSince < 2) return null
    const dayName = new Date(entries[0].at).toLocaleDateString(undefined, { weekday: 'long' })
    return `Your reflection from ${dayName} is waiting for you, whenever you'd like to add another.`
  } catch {
    return null
  }
}
