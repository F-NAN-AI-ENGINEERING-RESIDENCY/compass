import { useEffect, useRef, useState } from 'react'

const DURATIONS = [
  { seconds: 60, label: '1 min' },
  { seconds: 180, label: '3 min' },
]

// One 4s-in / 4s-hold / 4s-out cycle, 12 seconds total.
const CYCLE_SECONDS = 12

function phaseAt(elapsed) {
  const t = elapsed % CYCLE_SECONDS
  if (t < 4) return 'in'
  if (t < 8) return 'hold'
  return 'out'
}

const PHASE_COPY = {
  idle: 'Ready when you are.',
  in: 'Breathe in… 4 seconds',
  hold: 'Hold',
  out: 'Breathe out… 4 seconds',
}

// A guided breathing exercise: a central circle grows on the in-breath,
// holds, and shrinks on the out-breath, on a timed 4s/4s/4s loop, with a
// text cue kept in sync via a simple 1-second ticker (not tied 1:1 to the
// CSS transition — the transition just needs to be the same 4s duration).
export function MeditationSection({ onDone }) {
  const [duration, setDuration] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isRunning) return undefined
    intervalRef.current = setInterval(() => {
      setElapsed((current) => {
        const next = current + 1
        if (next >= duration) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          setIsDone(true)
          return current
        }
        return next
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isRunning, duration])

  function handleStartPause() {
    if (isDone) {
      setElapsed(0)
      setIsDone(false)
    }
    setIsRunning((current) => !current)
  }

  function handleDurationChange(seconds) {
    setDuration(seconds)
    setElapsed(0)
    setIsDone(false)
    setIsRunning(false)
  }

  const phase = isRunning ? phaseAt(elapsed) : 'idle'
  const secondsLeft = Math.max(0, duration - elapsed)

  return (
    <div
      style={{
        background: 'var(--color-forest)',
        borderRadius: 'var(--radius-card)',
        padding: '3rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'var(--color-text-on-dark)',
      }}
    >
      {isDone ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
          <p style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '0.5rem' }}>
            Nice. How do you feel now?
          </p>
          <p style={{ color: 'var(--color-text-on-dark-muted)', marginBottom: '1.5rem' }}>
            However that went, that was time well spent.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-pill btn-pill--primary" style={{ background: 'var(--color-cream)', color: 'var(--color-ink)' }} onClick={() => { setElapsed(0); setIsDone(false) }}>
              Breathe again
            </button>
            {onDone && (
              <button className="btn-pill btn-pill--outline" style={{ color: 'var(--color-text-on-dark)', borderColor: 'var(--color-text-on-dark-muted)' }} onClick={onDone}>
                Write about it →
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <BreathingCircle phase={phase} />

          <p style={{ fontSize: '1.15rem', margin: '1.75rem 0 2rem', minHeight: '1.5em' }}>{PHASE_COPY[phase]}</p>

          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {DURATIONS.map((option) => (
              <button
                key={option.seconds}
                type="button"
                className="meditation-duration"
                aria-pressed={duration === option.seconds}
                onClick={() => handleDurationChange(option.seconds)}
                disabled={isRunning}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button type="button" className="btn-pill" style={{ background: 'var(--color-cream)', color: 'var(--color-ink)' }} onClick={handleStartPause}>
            {isRunning ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
          </button>

          {elapsed > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-on-dark-muted)', marginTop: '0.85rem' }}>
              {Math.ceil(secondsLeft / 60)} min left
            </p>
          )}
        </>
      )}
    </div>
  )
}

// Central circle + two static concentric rings for depth. Only the center
// circle animates — grows on "in," holds, shrinks on "out" — the rings just
// sit there as calm framing.
function BreathingCircle({ phase }) {
  const scale = phase === 'out' || phase === 'idle' ? 1 : 1.4
  return (
    <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(245,241,230,0.15)' }} />
      <span style={{ position: 'absolute', width: '160px', height: '160px', borderRadius: '50%', border: '1px solid rgba(245,241,230,0.22)' }} />
      <span
        style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'var(--color-olive)',
          transform: `scale(${scale})`,
          transition: 'transform 4s ease-in-out',
        }}
      />
    </div>
  )
}
