import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, TOKEN_STORAGE_KEY } from './client.js'

function mockFetchOnce({ status = 200, body = {} } = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  })
}

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not attach an Authorization header when logged out', async () => {
    mockFetchOnce({ body: { ok: true } })
    await apiRequest('/api/auth/login', { method: 'POST' })
    const [, options] = global.fetch.mock.calls[0]
    expect(options.headers.Authorization).toBeUndefined()
  })

  it('attaches the stored token as a Bearer header once logged in', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'abc123')
    mockFetchOnce({ body: { ok: true } })
    await apiRequest('/api/auth/me')
    const [, options] = global.fetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer abc123')
  })

  it('returns the parsed body on success', async () => {
    mockFetchOnce({ body: { name: 'Naomi' } })
    const result = await apiRequest('/api/auth/me')
    expect(result).toEqual({ name: 'Naomi' })
  })

  it('returns null for a 204 response instead of parsing a body', async () => {
    mockFetchOnce({ status: 204 })
    const result = await apiRequest('/api/lessons/1/signals/x', { method: 'DELETE' })
    expect(result).toBeNull()
  })

  it("throws with the backend's message field on a non-ok response (the real current contract)", async () => {
    mockFetchOnce({ status: 401, body: { message: 'Incorrect username or password' } })
    await expect(apiRequest('/api/auth/login')).rejects.toThrow('Incorrect username or password')
  })

  it('falls back to .detail if a response ever uses the framework-default shape instead', async () => {
    mockFetchOnce({ status: 403, body: { detail: 'You are not enrolled in this class' } })
    await expect(apiRequest('/api/classes/1')).rejects.toThrow('You are not enrolled in this class')
  })

  it('falls back to a generic message when the error body has neither field', async () => {
    mockFetchOnce({ status: 500, body: {} })
    await expect(apiRequest('/api/classes/1')).rejects.toThrow('Request failed with status 500')
  })
})
