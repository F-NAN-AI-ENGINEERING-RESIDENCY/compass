import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { createSignal } from '../api/signals.js'
// Deliberately NOT importing getDashboard/resolveSignal from api/signals.js.
// Those return/mutate confusion signals with student identity attached —
// correct for the teacher's dashboard, unsafe here. See the ANONYMITY
// BOUNDARY comment in api/signals.js before adding any import to this file.

// Wireframe spec screen 09 ("Student in-call"), scoped to just the part with
// real backend support: the "I'm lost" control and its states (idle ->
// sending -> idle) plus a private confirmation toast, per Sprint 2's actual
// requirements ("one tap, no confirmation needed" + "brief private
// confirmation that signal was sent"). POST /api/lessons/:id/signals is real
// and merged — tapping this button shows up live on the teacher's dashboard
// (TeacherLessonDashboardPage), aggregated there without naming the student.
//
// ANONYMITY BOUNDARY: this component must show a student ONLY their own
// signal confirmation, never any information about other students' signals
// (not a name, not an anonymized count, not an indicator of any kind). The
// entire value of "I'm lost" is that classmates can't tell who asked for
// help — and even a de-identified count can de-anonymize a student in a
// small class by process of elimination. Do not add a "N classmates are
// confused" indicator or similar to this page or any component it renders.
//
// The main video-call stage itself (shared screen, other participants) needs
// Daily.co integration that doesn't exist in this app yet, so that part is a
// plain placeholder, not a mocked video tile — labeling it as fake video
// would be more misleading than just saying what's missing.
export function StudentLessonPage() {
  const { lessonId } = useParams()
  const [signalState, setSignalState] = useState('idle') // 'idle' -> 'sending' -> 'idle'
  const [error, setError] = useState(null)

  // PRIVACY NOTE: this confirmation toast lives only in this component — the
  // student's own lesson view. It must never be added to
  // TeacherLessonDashboardPage or any other shared/projected view. The whole
  // point of the "I'm lost" signal is that a classmate (or the teacher, in
  // the sense of "which student") never sees who sent it; the teacher's
  // dashboard already surfaces signals in aggregate elsewhere. This toast is
  // purely local, private feedback to the sender that their tap went through.
  const [showConfirmation, setShowConfirmation] = useState(false)
  const dismissTimerRef = useRef(null)

  // Clear any pending auto-dismiss timer on unmount, so it never fires a
  // setState against an unmounted component (a memory-leak warning waiting
  // to happen if the student navigates away mid-toast).
  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current)
  }, [])

  async function handleImLost() {
    setError(null)
    setSignalState('sending')
    try {
      await createSignal(lessonId) // POST /api/lessons/:id/signals
      setSignalState('idle')

      // Only show the confirmation on a successful send — a failed send
      // falls into the catch block below and surfaces the existing error
      // state instead, never this toast.
      //
      // Clear any timer from a previous signal first: if the student sends
      // a second "I'm lost" later in the same lesson before the first
      // toast's timer fired, this restarts the auto-dismiss clock cleanly
      // instead of the old timer cutting the new toast short.
      clearTimeout(dismissTimerRef.current)
      setShowConfirmation(true)
      dismissTimerRef.current = setTimeout(() => setShowConfirmation(false), 3500)
    } catch (err) {
      setError(err.message) // e.g. "Lesson ... is not live" (409) or "You are not enrolled" (403)
      setSignalState('idle')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#111' }}>
      {/* Main stage placeholder — see file-level note above on why this isn't a mocked video tile. */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-on-dark-muted)' }}>
          Lesson #{lessonId} — shared screen/video isn't built yet (needs Daily.co integration)
        </p>
      </div>

      {/* Private confirmation toast. Always rendered (not conditionally
          mounted) so the opacity/transform transition below can actually
          animate in both directions — toggling the class, not the element,
          is what makes the fade in AND out. `pointer-events: none` at rest
          keeps it from ever intercepting a click while invisible. */}
      <div
        role="status"
        aria-live="polite"
        className={`signal-confirmation-toast${showConfirmation ? ' signal-confirmation-toast--visible' : ''}`}
      >
        <Check size={16} aria-hidden="true" />
        <span>Your teacher knows. Sit tight.</span>
      </div>

      {/* Control bar, docked at the bottom per the spec. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          background: 'var(--color-forest)',
        }}
      >
        {error && <p className="error-text" style={{ position: 'absolute', bottom: '5rem' }}>{error}</p>}
        <button
          className="btn-pill"
          onClick={handleImLost}
          disabled={signalState === 'sending'}
          style={{
            background: 'var(--color-cream)',
            color: 'var(--color-ink)',
            fontWeight: 700,
            padding: '1rem 2rem',
          }}
        >
          {signalState === 'idle' && "I'm lost"}
          {signalState === 'sending' && 'Sending…'}
        </button>
      </div>
    </div>
  )
}
