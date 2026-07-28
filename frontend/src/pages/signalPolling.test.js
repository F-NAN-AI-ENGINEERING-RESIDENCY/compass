import { describe, expect, it } from 'vitest'
import { mergeSignals, sortedOpenSignals } from './signalPolling.js'

describe('mergeSignals', () => {
  it('adds a new open signal to an empty map', () => {
    const result = mergeSignals({}, [{ signalId: 'a', status: 'open' }])
    expect(result).toEqual({ a: { signalId: 'a', status: 'open' } })
  })

  it('refreshes an existing open signal in place', () => {
    const current = { a: { signalId: 'a', status: 'open', createdAt: '1' } }
    const result = mergeSignals(current, [{ signalId: 'a', status: 'open', createdAt: '2' }])
    expect(result.a.createdAt).toBe('2')
  })

  it('removes a signal once it comes back resolved', () => {
    const current = { a: { signalId: 'a', status: 'open' } }
    const result = mergeSignals(current, [{ signalId: 'a', status: 'resolved' }])
    expect(result).toEqual({})
  })

  it('removes a signal once it comes back acknowledged', () => {
    const current = { a: { signalId: 'a', status: 'open' } }
    const result = mergeSignals(current, [{ signalId: 'a', status: 'acknowledged' }])
    expect(result).toEqual({})
  })

  it('leaves signals not mentioned in this batch untouched', () => {
    // This is the case that makes the `since` polling mode work: a batch
    // only ever contains what changed, not the full open set.
    const current = { a: { signalId: 'a', status: 'open' }, b: { signalId: 'b', status: 'open' } }
    const result = mergeSignals(current, [{ signalId: 'a', status: 'resolved' }])
    expect(result).toEqual({ b: { signalId: 'b', status: 'open' } })
  })

  it('does not mutate the map passed in', () => {
    const current = { a: { signalId: 'a', status: 'open' } }
    mergeSignals(current, [{ signalId: 'a', status: 'resolved' }])
    expect(current).toEqual({ a: { signalId: 'a', status: 'open' } })
  })
})

describe('sortedOpenSignals', () => {
  it('orders oldest first', () => {
    const map = {
      b: { signalId: 'b', createdAt: '2026-01-01T00:00:02Z' },
      a: { signalId: 'a', createdAt: '2026-01-01T00:00:01Z' },
    }
    expect(sortedOpenSignals(map).map((s) => s.signalId)).toEqual(['a', 'b'])
  })

  it('returns an empty array for an empty map', () => {
    expect(sortedOpenSignals({})).toEqual([])
  })
})
