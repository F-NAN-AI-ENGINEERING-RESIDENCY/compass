import { useState } from 'react'
import { listRecordings, getAccessLink, getTranscript } from '../api/recordings.js'

// Wireframe spec screen 15 ("Recordings & transcripts"). Real backend now
// exists (Noboni's recording/transcription work) — no more mocked data.
//
// Two real gaps versus the original spec, worth knowing about rather than
// faking around:
// - No "list all my recordings" endpoint exists, only per-lesson
//   (GET /api/lessons/:id/recordings) — same "enter a lesson id" shortcut
//   used on the Sessions hub and teacher dashboard, for the same reason.
// - The spec's "jump straight to the confusion spikes" scrubber needed a way
//   to correlate signal timestamps with a recording's timeline. No endpoint
//   returns that (the dashboard endpoint only surfaces currently-open
//   signals, not a full historical list for review purposes), so the spike
//   markers from the old mocked version are gone rather than faked — the
//   transcript below is real, the spike-jump feature just isn't built yet.
export function RecordingsPage() {
  const [lessonIdInput, setLessonIdInput] = useState('')
  const [lessonId, setLessonId] = useState(null)
  const [recordings, setRecordings] = useState([])
  const [transcript, setTranscript] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [selectedRecordingId, setSelectedRecordingId] = useState(null)
  const [accessLink, setAccessLink] = useState(null)
  const [linkError, setLinkError] = useState(null)
  const [isLoadingLink, setIsLoadingLink] = useState(false)

  async function handleLoadLesson(event) {
    event.preventDefault()
    const id = lessonIdInput.trim()
    if (!id) return
    setLoadError(null)
    setIsLoading(true)
    setAccessLink(null)
    setSelectedRecordingId(null)
    try {
      // Both real, both scoped to this one lesson.
      const [recordingList, transcriptChunks] = await Promise.all([listRecordings(id), getTranscript(id)])
      setLessonId(id)
      setRecordings(recordingList)
      setTranscript(transcriptChunks)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSelectRecording(recordingId) {
    setSelectedRecordingId(recordingId)
    setAccessLink(null)
    setLinkError(null)
    setIsLoadingLink(true)
    try {
      // Fetched fresh on selection, not cached — see the file-level note above.
      const { accessLink: link } = await getAccessLink(recordingId)
      setAccessLink(link)
    } catch (err) {
      setLinkError(err.message)
    } finally {
      setIsLoadingLink(false)
    }
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Recordings</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        There's no "list all my recordings" endpoint yet — enter a lesson ID to see its recordings
        and transcript.
      </p>

      <form onSubmit={handleLoadLesson} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <input
          type="number"
          className="text-input"
          placeholder="Lesson ID"
          value={lessonIdInput}
          onChange={(event) => setLessonIdInput(event.target.value)}
          style={{ width: '8rem' }}
        />
        <button type="submit" className="btn-pill btn-pill--primary" disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Load lesson'}
        </button>
      </form>

      {loadError && <p className="error-text">{loadError}</p>}

      {lessonId && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Lesson #{lessonId}</h2>
            {recordings.length === 0 ? (
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>No recordings for this lesson.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recordings.map((recording) => (
                  <li key={recording.recordingId} style={{ marginBottom: '0.75rem' }}>
                    <button
                      onClick={() => handleSelectRecording(recording.recordingId)}
                      className="card"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        border:
                          recording.recordingId === selectedRecordingId
                            ? '2px solid var(--color-forest)'
                            : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>Recording #{recording.recordingId}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                        {recording.status}
                        {recording.durationSeconds != null && ` · ${Math.round(recording.durationSeconds / 60)} min`}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              {selectedRecordingId ? `Recording #${selectedRecordingId}` : 'Select a recording'}
            </h2>

            {selectedRecordingId && (
              <div style={{ marginBottom: '1.5rem' }}>
                {isLoadingLink ? (
                  <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Getting access link…</p>
                ) : linkError ? (
                  <p className="error-text">{linkError}</p>
                ) : accessLink ? (
                  <a href={accessLink} target="_blank" rel="noreferrer" className="btn-pill btn-pill--primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Open recording ↗
                  </a>
                ) : null}
              </div>
            )}

            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', marginBottom: '0.5rem' }}>Transcript</h3>
            {transcript.length === 0 ? (
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>No transcript for this lesson.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '360px', overflowY: 'auto' }}>
                {transcript.map((chunk) => (
                  <li key={chunk.chunkId} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-cream-dim)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginRight: '0.75rem' }}>
                      {formatTimestamp(chunk.startOffsetSeconds)}
                    </span>
                    {chunk.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatTimestamp(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
