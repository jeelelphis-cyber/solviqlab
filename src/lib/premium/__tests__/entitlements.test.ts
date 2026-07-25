import { describe, it, expect } from 'vitest'
import { FeatureFlagEngine } from '../flags'
import { EntitlementService } from '../entitlements'
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

describe('EntitlementService', () => {
  const flags   = new FeatureFlagEngine()
  const service = new EntitlementService(flags)

  it('anonymous user gets free tier entitlements', () => {
    const result = service.check('multi_cluster', makeAnon())
    expect(result.tier).toBe('free')
    expect(result.granted).toBe(false)
  })

  it('free authenticated user cannot access pro features', () => {
    expect(service.canAccess('coach_advanced', makeAuth('free'))).toBe(false)
  })

  it('pro user can access multi_cluster', () => {
    expect(service.canAccess('multi_cluster', makeAuth('pro'))).toBe(true)
  })

  it('pro user cannot access ai_consultation', () => {
    expect(service.canAccess('ai_consultation', makeAuth('pro'))).toBe(false)
  })

  it('enterprise user can access ai_consultation', () => {
    expect(service.canAccess('ai_consultation', makeAuth('enterprise'))).toBe(true)
  })

  it('check() returns reason tier_access', () => {
    const result = service.check('multi_cluster', makeAuth('pro'))
    expect(result.reason).toBe('tier_access')
    expect(result.granted).toBe(true)
  })

  it('getEntitlements() returns all features for the user tier', () => {
    const entitlements = service.getEntitlements(makeAuth('pro'))
    expect(entitlements.every(e => e.granted)).toBe(true)
    const ids = entitlements.map(e => e.feature)
    expect(ids).toContain('multi_cluster')
    expect(ids).toContain('coach_advanced')
    expect(ids).not.toContain('ai_consultation')
  })

  it('getEntitlements() returns empty for free user', () => {
    expect(service.getEntitlements(makeAuth('free'))).toHaveLength(0)
  })

  it('null user treated as free', () => {
    expect(service.canAccess('multi_cluster', null)).toBe(false)
  })
})
