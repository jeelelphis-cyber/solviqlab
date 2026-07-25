import { describe, it, expect } from 'vitest'
import { QuotaGuard } from '../quota-guard'
import { MemoryProvider } from '../../user/storage'

function makeGuard(quota?: { free?: number; pro?: number; enterprise?: number }) {
  return new QuotaGuard(new MemoryProvider(), quota)
}

describe('QuotaGuard', () => {
  it('allows requests when under limit', () => {
    const guard = makeGuard({ free: 5 })
    expect(guard.check('free')).toBe(true)
  })

  it('tracks remaining count', () => {
    const guard = makeGuard({ free: 3 })
    expect(guard.remaining('free')).toBe(3)
    guard.increment()
    expect(guard.remaining('free')).toBe(2)
  })

  it('blocks after limit is reached', () => {
    const guard = makeGuard({ free: 2 })
    guard.increment()
    guard.increment()
    expect(guard.check('free')).toBe(false)
    expect(guard.remaining('free')).toBe(0)
  })

  it('applies different limits per tier', () => {
    const guard = makeGuard({ free: 2, pro: 50 })
    guard.increment()
    guard.increment()
    expect(guard.check('free')).toBe(false)
    expect(guard.check('pro')).toBe(true)
    expect(guard.remaining('pro')).toBe(48)
  })

  it('unknown tiers get free quota', () => {
    const guard = makeGuard({ free: 5 })
    expect(guard.remaining('unknown_tier')).toBe(5)
  })

  it('counter persists across guard instances with same storage', () => {
    const storage = new MemoryProvider()
    const g1 = new QuotaGuard(storage, { free: 5 })
    g1.increment()
    g1.increment()
    const g2 = new QuotaGuard(storage, { free: 5 })
    expect(g2.remaining('free')).toBe(3)
  })
})
