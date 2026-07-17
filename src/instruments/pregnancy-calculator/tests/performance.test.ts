import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculatePregnancy } from '../lib/calculate.js'

// Fix today so the LMP dates used here are always valid
const FAKE_TODAY = '2026-07-17'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(FAKE_TODAY + 'T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

// LMP 10 weeks ago from fake today = 2026-05-08
const VALID_LMP = '2026-05-08'

describe('calculatePregnancy — performance', () => {
  it('completes within 5ms', () => {
    const start = performance.now()
    calculatePregnancy({ method: 'lmp', date: VALID_LMP })
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(5)
  })

  it('100 sequential calculations complete within 50ms total', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      calculatePregnancy({ method: 'lmp', date: VALID_LMP })
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50)
  })

  it('all three methods are fast', () => {
    const methods = [
      { method: 'lmp' as const,       date: VALID_LMP },
      { method: 'conception' as const, date: '2026-05-22' },
      { method: 'dueDate' as const,    date: '2027-02-12' },
    ]
    for (const input of methods) {
      const start = performance.now()
      calculatePregnancy(input)
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(5)
    }
  })
})
