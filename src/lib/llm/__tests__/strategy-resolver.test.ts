import { describe, it, expect } from 'vitest'
import { StrategyResolver } from '../strategy-resolver'
import type { LLMContext } from '../types'

function ctx(overrides?: Partial<LLMContext>): LLMContext {
  return {
    userId: 'u1', userType: 'anonymous', subscription: 'free',
    activeCluster: null, assessmentScore: null, assessmentConfidence: null,
    currentPhase: null, primaryGoal: null, daysSinceActive: 0,
    dormancyLevel: 'none', recentCoachMessages: [], journeyProgress: null,
    ...overrides,
  }
}

describe('StrategyResolver', () => {
  const resolver = new StrategyResolver()

  it('returns default_coach for fresh anonymous user', () => {
    expect(resolver.resolve(ctx()).id).toBe('default_coach')
  })

  it('returns motivator for severely dormant users', () => {
    expect(resolver.resolve(ctx({ dormancyLevel: 'severe' })).id).toBe('motivator')
    expect(resolver.resolve(ctx({ dormancyLevel: 'critical' })).id).toBe('motivator')
  })

  it('dormancy overrides everything — even pro subscription', () => {
    const result = resolver.resolve(ctx({ dormancyLevel: 'severe', subscription: 'pro', primaryGoal: 'Lose weight' }))
    expect(result.id).toBe('motivator')
  })

  it('returns consultant for pro user with primary goal', () => {
    const result = resolver.resolve(ctx({ subscription: 'pro', primaryGoal: 'Lose 5kg' }))
    expect(result.id).toBe('consultant')
  })

  it('returns consultant for enterprise user with primary goal', () => {
    const result = resolver.resolve(ctx({ subscription: 'enterprise', primaryGoal: 'Improve sleep' }))
    expect(result.id).toBe('consultant')
  })

  it('does NOT return consultant for pro user without a primary goal', () => {
    const result = resolver.resolve(ctx({ subscription: 'pro', primaryGoal: null }))
    expect(result.id).not.toBe('consultant')
  })

  it('returns explainer for established free user with active phase', () => {
    const result = resolver.resolve(ctx({
      assessmentConfidence: 'established',
      currentPhase: 'planning',
    }))
    expect(result.id).toBe('explainer')
  })

  it('does NOT return explainer when confidence is not established', () => {
    const result = resolver.resolve(ctx({
      assessmentConfidence: 'preliminary',
      currentPhase: 'planning',
    }))
    expect(result.id).toBe('default_coach')
  })

  it('respects explicit override regardless of context', () => {
    const dormant = ctx({ dormancyLevel: 'critical' })
    expect(resolver.resolve(dormant, 'consultant').id).toBe('consultant')
    expect(resolver.resolve(dormant, 'explainer').id).toBe('explainer')
    expect(resolver.resolve(dormant, 'default_coach').id).toBe('default_coach')
  })

  it('returns stateless singleton instances (no state leaks)', () => {
    const s1 = resolver.resolve(ctx())
    const s2 = resolver.resolve(ctx())
    expect(s1).toBe(s2)  // same cached instance
  })
})
