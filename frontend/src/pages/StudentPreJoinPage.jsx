import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Wireframe spec screen 08 ("Student pre-join") — camera check + anonymity
// reminder before entering a lesson. Uses the browser's real camera/mic APIs
// (getUserMedia) for the preview — this needs no backend at all, so unlike
// most of the rest of this page it isn't mocked. There's no real video-call
// join yet (that's Daily.co/screens 09/11's full scope) — "Join" here just
// carries the camera/mic on-off choice forward to the lesson view.
export function StudentPreJoinPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop()) // component unmounted before permission resolved
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch((err) => {
        // No camera, permission denied, or running headless without a fake
        // device — fail soft into a text placeholder rather than crashing
        // the page, since a mic/camera aren't required to still join.
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop()) // release the camera when leaving this screen
    }
  }, [])

  function toggleCamera() {
    const next = !cameraOn
    setCameraOn(next)
    streamRef.current?.getVideoTracks().forEach((track) => (track.enabled = next))
  }

  function toggleMic() {
    const next = !micOn
    setMicOn(next)
    streamRef.current?.getAudioTracks().forEach((track) => (track.enabled = next))
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-cream)',
        padding: '1.5rem',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Ready to join?</h1>

        <div
          style={{
            background: '#111',
            borderRadius: 'var(--radius-card)',
            aspectRatio: '4 / 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          {error ? (
            <p style={{ color: 'var(--color-text-on-dark-muted)', padding: '1rem', textAlign: 'center' }}>
              Camera unavailable ({error})
            </p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted // muted so the student doesn't hear their own mic echo — this is a self-preview, not a call
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <button type="button" className="btn-pill btn-pill--outline" onClick={toggleCamera}>
            Camera {cameraOn ? 'on' : 'off'}
          </button>
          <button type="button" className="btn-pill btn-pill--outline" onClick={toggleMic}>
            Mic {micOn ? 'on' : 'off'}
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1.25rem' }}>
          Your "I'm lost" signals in this lesson are always anonymous — classmates never see who
          sent one.
        </p>

        <button
          className="btn-pill btn-pill--primary"
          style={{ width: '100%' }}
          onClick={() => navigate(`/student/lessons/${lessonId}`)}
        >
          Join lesson →
        </button>
      </div>
    </div>
  )
}
