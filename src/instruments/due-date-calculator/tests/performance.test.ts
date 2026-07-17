import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateDueDate } from '../lib/calculate.js'

const FAKE_TODAY = '2025-05-15'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(FAKE_TODAY + 'T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('performance', () => {
  it('calculateDueDate (lmp) completes in < 5ms', () => {
    const start = performance.now()
    calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })

  it('calculateDueDate (conception) completes in < 5ms', () => {
    const start = performance.now()
    calculateDueDate({ method: 'conception', date: '2025-01-15' })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })

  it('calculateDueDate (ivf3) completes in < 5ms', () => {
    const start = performance.now()
    calculateDueDate({ method: 'ivf3', date: '2025-01-15' })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })

  it('calculateDueDate (ivf5) completes in < 5ms', () => {
    const start = performance.now()
    calculateDueDate({ method: 'ivf5', date: '2025-01-15' })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })

  it('100 consecutive calculations complete in < 200ms', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(200)
  })
})
