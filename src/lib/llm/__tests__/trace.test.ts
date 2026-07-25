import { describe, it, expect } from 'vitest'
import { createTrace, elapsedMs } from '../trace'

describe('createTrace()', () => {
  it('returns a non-empty traceId', () => {
    const trace = createTrace()
    expect(trace.traceId.length).toBeGreaterThan(0)
  })

  it('returns an ISO startedAt timestamp', () => {
    const trace = createTrace()
    expect(new Date(trace.startedAt).getTime()).toBeGreaterThan(0)
  })

  it('generates unique IDs each call', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createTrace().traceId))
    expect(ids.size).toBe(50)
  })
})

describe('elapsedMs()', () => {
  it('returns non-negative elapsed time', () => {
    const trace   = createTrace()
    const elapsed = elapsedMs(trace)
    expect(elapsed).toBeGreaterThanOrEqual(0)
  })

  it('increases over time', async () => {
    const trace = createTrace()
    await new Promise(r => setTimeout(r, 10))
    expect(elapsedMs(trace)).toBeGreaterThanOrEqual(10)
  })
})
