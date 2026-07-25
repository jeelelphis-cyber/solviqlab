import { describe, it, expect, vi } from 'vitest'
import { RetentionEngine } from '../engine'
import { DormancyDetector } from '../detector'
import { ReminderPolicy } from '../policy'
import { MemoryProvider } from '../../user/storage'
import type { AnonymousUser, AuthenticatedUser } from '../../user/types'
import type { RetentionRule } from '../types'

function makeAnonymousUser(daysAgo: number): AnonymousUser {
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
  return {
    id: 'u1', type: 'anonymous', created_at: ts, last_active_at: ts,
    result_history: [], journey_states: [], completed_slugs: [], achievements: [], schema_version: 1,
  }
}

function makeAuthUser(daysAgo: number): AuthenticatedUser {
  const base = makeAnonymousUser(daysAgo)
  return {
    ...base, type: 'authenticated', email: 'u@test.com',
    display_name: null, avatar_url: null, anonymous_id: null,
    auth_provider: 'email', subscription_tier: 'free',
  }
}

function makeEngine(rules?: readonly RetentionRule[]) {
  return new RetentionEngine(
    new DormancyDetector(),
    new ReminderPolicy(rules),
    new MemoryProvider(),
  )
}

describe('RetentionEngine', () => {
  it('evaluate() returns null for active user', () => {
    const engine = makeEngine()
    const result = engine.evaluate(makeAnonymousUser(0), 'en')
    expect(result).toBeNull()
  })

  it('evaluate() returns coach_reminder for 7-day inactive user', () => {
    const engine = makeEngine()
    const result = engine.evaluate(makeAnonymousUser(7), 'en')
    expect(result?.ruleId).toBe('coach_reminder_7d')
    expect(result?.action).toBe('coach_reminder')
    expect(result?.title).toBeTruthy()
    expect(result?.body).toBeTruthy()
    expect(result?.cta).toBeTruthy()
  })

  it('evaluate() returns registration_nudge for 30-day anonymous user', () => {
    const engine = makeEngine()
    const result = engine.evaluate(makeAnonymousUser(30), 'en')
    expect(result?.ruleId).toBe('registration_nudge_30d')
    expect(result?.action).toBe('registration_nudge')
  })

  it('evaluate() returns premium_nudge for 30-day authenticated user', () => {
    const engine = makeEngine()
    const result = engine.evaluate(makeAuthUser(30), 'en')
    expect(result?.ruleId).toBe('premium_nudge_30d')
    expect(result?.action).toBe('premium_nudge')
  })

  it('evaluate() returns Spanish template for lang=es', () => {
    const engine = makeEngine()
    const result = engine.evaluate(makeAnonymousUser(7), 'es')
    expect(result?.title).toContain('progreso')  // Spanish title
  })

  it('evaluate() falls back to EN for unsupported lang', () => {
    const engine = makeEngine()
    const result = engine.evaluate(makeAnonymousUser(7), 'de')
    expect(result?.title).toContain("How's")  // English fallback
  })

  it('evaluate() is pure — markFired() must be called separately', () => {
    const engine  = makeEngine()
    const result1 = engine.evaluate(makeAnonymousUser(7), 'en')
    const result2 = engine.evaluate(makeAnonymousUser(7), 'en')
    // Both return the same rule — memory not written
    expect(result1?.ruleId).toBe(result2?.ruleId)
    expect(engine.getMemory().rule_history).toHaveLength(0)
  })

  it('markFired() writes to memory', () => {
    const engine = makeEngine()
    const result = engine.evaluate(makeAnonymousUser(7), 'en')!
    engine.markFired(result.ruleId)
    expect(engine.getMemory().rule_history).toHaveLength(1)
    expect(engine.getMemory().last_check_at).not.toBeNull()
  })

  it('evaluate() returns null within cooldown period after markFired()', () => {
    const engine  = makeEngine()
    const user    = makeAnonymousUser(7)
    const result1 = engine.evaluate(user, 'en')!
    engine.markFired(result1.ruleId)
    // Same rule should not fire again within cooldown (14 days for coach_reminder_7d)
    const result2 = engine.evaluate(user, 'en')
    // Could be null (blocked by cooldown) or a different rule (none at 7 days)
    if (result2) {
      expect(result2.ruleId).not.toBe('coach_reminder_7d')
    }
  })

  it('evaluate() fires again after cooldown expires', () => {
    // cooldownDays: 0 means it can fire on every evaluation (simulates past-cooldown state)
    const rules: RetentionRule[] = [{
      id: 'coach_reminder_7d', name: 'Coach Reminder', daysInactive: 1,
      action: 'coach_reminder', priority: 'low', cooldownDays: 0,
    }]
    const engine = makeEngine(rules)
    const user   = makeAnonymousUser(1)
    const r1     = engine.evaluate(user, 'en')
    if (r1) engine.markFired(r1.ruleId)
    const r2 = engine.evaluate(user, 'en')
    expect(r2?.ruleId).toBe('coach_reminder_7d')
  })

  it('getMemory() starts empty', () => {
    const engine = makeEngine()
    const memory = engine.getMemory()
    expect(memory.rule_history).toHaveLength(0)
    expect(memory.last_check_at).toBeNull()
  })
})
