import { describe, it, expect } from 'vitest'
import { ReminderPolicy } from '../policy'

describe('ReminderPolicy', () => {
  const policy = new ReminderPolicy()

  it('getRules() returns all default rules', () => {
    expect(policy.getRules().length).toBeGreaterThan(0)
  })

  it('getActiveRule() returns null when below minimum threshold', () => {
    expect(policy.getActiveRule(0, 'anonymous')).toBeNull()
    expect(policy.getActiveRule(6, 'anonymous')).toBeNull()
  })

  it('getActiveRule() returns coach_reminder at 7 days', () => {
    const rule = policy.getActiveRule(7, 'anonymous')
    expect(rule?.id).toBe('coach_reminder_7d')
  })

  it('getActiveRule() returns journey_reminder at 14 days', () => {
    const rule = policy.getActiveRule(14, 'anonymous')
    expect(rule?.id).toBe('journey_reminder_14d')
  })

  it('getActiveRule() returns recommendation at 21 days', () => {
    const rule = policy.getActiveRule(21, 'anonymous')
    expect(rule?.id).toBe('recommendation_21d')
  })

  it('getActiveRule() returns registration_nudge for anonymous at 30 days', () => {
    const rule = policy.getActiveRule(30, 'anonymous')
    expect(rule?.id).toBe('registration_nudge_30d')
  })

  it('getActiveRule() returns premium_nudge for authenticated at 30 days', () => {
    const rule = policy.getActiveRule(30, 'authenticated')
    expect(rule?.id).toBe('premium_nudge_30d')
  })

  it('getActiveRule() does not return anonymous-only rule to authenticated user', () => {
    const rule = policy.getActiveRule(30, 'authenticated')
    expect(rule?.id).not.toBe('registration_nudge_30d')
  })

  it('getActiveRule() returns highest matching threshold (21d > 14d)', () => {
    // At 21 days, both 14d and 21d rules match — 21d takes priority
    const rule = policy.getActiveRule(21, 'anonymous')
    expect(rule?.daysInactive).toBe(21)
  })

  it('supports custom rules via constructor', () => {
    const custom = new ReminderPolicy([{
      id: 'test_rule',
      name: 'Test',
      daysInactive: 3,
      action: 'coach_reminder',
      priority: 'low',
      cooldownDays: 7,
    }])
    const rule = custom.getActiveRule(5, 'anonymous')
    expect(rule?.id).toBe('test_rule')
  })
})
