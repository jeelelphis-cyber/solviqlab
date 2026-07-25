import { describe, it, expect } from 'vitest'
import { DormancyDetector } from '../detector'
import type { AnonymousUser } from '../../user/types'

function makeUser(daysAgo: number): AnonymousUser {
  const lastActive = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
  return {
    id: 'u1',
    type: 'anonymous',
    created_at: lastActive,
    last_active_at: lastActive,
    result_history: [],
    journey_states: [],
    completed_slugs: [],
    achievements: [],
    schema_version: 1,
  }
}

describe('DormancyDetector', () => {
  const detector = new DormancyDetector()

  it('getDaysSinceLastActive() returns 0 for current user', () => {
    const user = makeUser(0)
    expect(detector.getDaysSinceLastActive(user)).toBe(0)
  })

  it('getDaysSinceLastActive() returns correct days', () => {
    expect(detector.getDaysSinceLastActive(makeUser(7))).toBe(7)
    expect(detector.getDaysSinceLastActive(makeUser(30))).toBe(30)
  })

  it('getDormancyLevel() none for < 7 days', () => {
    expect(detector.getDormancyLevel(0)).toBe('none')
    expect(detector.getDormancyLevel(6)).toBe('none')
  })

  it('getDormancyLevel() mild for 7-13 days', () => {
    expect(detector.getDormancyLevel(7)).toBe('mild')
    expect(detector.getDormancyLevel(13)).toBe('mild')
  })

  it('getDormancyLevel() moderate for 14-20 days', () => {
    expect(detector.getDormancyLevel(14)).toBe('moderate')
    expect(detector.getDormancyLevel(20)).toBe('moderate')
  })

  it('getDormancyLevel() severe for 21-29 days', () => {
    expect(detector.getDormancyLevel(21)).toBe('severe')
    expect(detector.getDormancyLevel(29)).toBe('severe')
  })

  it('getDormancyLevel() critical for 30+ days', () => {
    expect(detector.getDormancyLevel(30)).toBe('critical')
    expect(detector.getDormancyLevel(365)).toBe('critical')
  })

  it('isDormant() returns false below threshold', () => {
    expect(detector.isDormant(makeUser(6), 7)).toBe(false)
  })

  it('isDormant() returns true at threshold', () => {
    expect(detector.isDormant(makeUser(7), 7)).toBe(true)
  })

  it('isDormant() returns true above threshold', () => {
    expect(detector.isDormant(makeUser(30), 7)).toBe(true)
  })
})
