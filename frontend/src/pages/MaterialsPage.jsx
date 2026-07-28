import { useState } from 'react'

const STORAGE_KEY = 'compass_materials'

// Wireframe spec screen 14 ("Learning materials"). There's no file-storage
// backend at all (no upload endpoint, nowhere to put the bytes), so
// "uploading" here only remembers file metadata (name, size, which unit) in
// localStorage — real persistence of the *list*, honest about not actually
// storing the file anywhere.
export function MaterialsPage() {
  const [filesByUnit, setFilesByUnit] = useState(() => readSaved())
  const [unitName, setUnitName] = useState('Unit 1')

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    const entry = { name: file.name, sizeKb: Math.round(file.size / 1024), addedAt: Date.now() }
    const next = { ...filesByUnit, [unitName]: [...(filesByUnit[unitName] ?? []), entry] }
    setFilesByUnit(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    event.target.value = '' // reset so picking the same file again still fires onChange
  }

  const units = Object.keys(filesByUnit)

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Materials</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1.5rem' }}>
        Mocked — there's no file-storage backend yet, so only the file name and unit are
        remembered on this device, not the file itself.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center' }}>
        <input
          type="text"
          className="text-input"
          value={unitName}
          onChange={(event) => setUnitName(event.target.value)}
          style={{ width: '140px' }}
        />
        <label className="btn-pill btn-pill--primary" style={{ cursor: 'pointer' }}>
          Upload
          <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      </div>

      {units.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>No materials uploaded yet.</p>
      ) : (
        units.map((unit) => (
          <section key={unit} className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{unit}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filesByUnit[unit].map((file) => (
                <li
                  key={file.name + file.addedAt}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}
                >
                  <span>{file.name}</span>
                  <span style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                    {file.sizeKb} KB
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}
