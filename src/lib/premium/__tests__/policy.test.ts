import { describe, it, expect } from 'vitest'
import { FeatureFlagEngine } from '../flags'
import { EntitlementService } from '../entitlements'
import { AccessPolicy } from '../policy'
import type { AnonymousUser, AuthenticatedUser } from '../../user/types'

function makeAnon(): AnonymousUser {
  const ts = new Date().toISOString()
  return { id: 'u1', type: 'anonymous', created_at: ts, last_active_at: ts,
    result_history: [], journey_states: [], completed_slugs: [], achievements: [], schema_version: 1 }
}

function makeAuth(tier: AuthenticatedUser['subscription_tier'] = 'free'): AuthenticatedUser {
  return { ...makeAnon(), type: 'authenticated', email: 'u@test.com',
    display_name: null, avatar_url: null, anonymous_id: null, auth_provider: 'email', subscription_tier: tier }
}

function makePolicy() {
  const flags        = new FeatureFlagEngine()
  const entitlements = new EntitlementService(flags)
  return new AccessPolicy(entitlements, flags)
}

describe('AccessPolicy', () => {
  it('evaluate() allows pro user to access multi_cluster', () => {
    const policy   = makePolicy()
    const decision = policy.evaluate('multi_cluster', makeAuth('pro'))
    expect(decision.allowed).toBe(true)
    expect(decision.reason).toBe('granted')
    expect(decision.requiredTier).toBeNull()
  })

  it('evaluate() denies free user with tier_insufficient reason', () => {
    const policy   = makePolicy()
    const decision = policy.evaluate('multi_cluster', makeAuth('free'))
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe('tier_insufficient')
    expect(decision.requiredTier).toBe('pro')
    expect(decision.currentTier).toBe('free')
  })

  it('evaluate() denies anonymous user', () => {
    const policy   = makePolicy()
    const decision = policy.evaluate('multi_cluster', makeAnon())
    expect(decision.allowed).toBe(false)
    expect(decision.currentTier).toBe('free')
  })

  it('evaluate() denies null user with not_authenticated reason', () => {
    const policy   = makePolicy()
    const decision = policy.evaluate('multi_cluster', null)
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe('not_authenticated')
  })

  it('evaluate() denies pro user from enterprise feature', () => {
    const policy   = makePolicy()
    const decision = policy.evaluate('ai_consultation', makeAuth('pro'))
    expect(decision.allowed).toBe(false)
    expect(decision.requiredTier).toBe('enterprise')
  })

  it('evaluate() allows enterprise user all features', () => {
    const policy   = makePolicy()
    const features = ['multi_cluster', 'ai_consultation', 'priority_support'] as const
    features.forEach(f => {
      const d = policy.evaluate(f, makeAuth('enterprise'))
      expect(d.allowed).toBe(true)
    })
  })

  it('getUpgradeTier() returns pro for free', () => {
    expect(makePolicy().getUpgradeTier('free')).toBe('pro')
  })

  it('getUpgradeTier() returns enterprise for pro', () => {
    expect(makePolicy().getUpgradeTier('pro')).toBe('enterprise')
  })

  it('getUpgradeTier() returns null for enterprise (top tier)', () => {
    expect(makePolicy().getUpgradeTier('enterprise')).toBeNull()
  })
})
