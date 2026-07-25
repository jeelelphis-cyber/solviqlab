import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PremiumAnalytics } from '../analytics'
import type { AccessDecision } from '../types'

function makeDecision(): AccessDecision {
  return {
    allowed:      false,
    feature:      'multi_cluster',
    requiredTier: 'pro',
    currentTier:  'free',
    reason:       'tier_insufficient',
  }
}

describe('PremiumAnalytics', () => {
  const analytics = new PremiumAnalytics()
  const gtagMock  = vi.fn()

  beforeEach(() => {
    gtagMock.mockClear()
    // @ts-expect-error — node env
    globalThis.window = { gtag: gtagMock }
  })

  it('trackPaywallShown fires paywall_shown event', () => {
    analytics.trackPaywallShown(makeDecision())
    expect(gtagMock).toHaveBeenCalledWith('event', 'paywall_shown', expect.objectContaining({
      feature:       'multi_cluster',
      current_tier:  'free',
      required_tier: 'pro',
      reason:        'tier_insufficient',
    }))
  })

  it('trackUpgradeClick fires premium_upgrade_click event', () => {
    analytics.trackUpgradeClick('multi_cluster', 'pro')
    expect(gtagMock).toHaveBeenCalledWith('event', 'premium_upgrade_click', expect.objectContaining({
      feature:     'multi_cluster',
      target_tier: 'pro',
    }))
  })

  it('trackSubscriptionStarted fires subscription_started event', () => {
    analytics.trackSubscriptionStarted('pro')
    expect(gtagMock).toHaveBeenCalledWith('event', 'subscription_started', { tier: 'pro' })
  })

  it('trackSubscriptionCancelled fires subscription_cancelled event', () => {
    analytics.trackSubscriptionCancelled('pro')
    expect(gtagMock).toHaveBeenCalledWith('event', 'subscription_cancelled', { tier: 'pro' })
  })

  it('does not throw when gtag is undefined', () => {
    // @ts-expect-error
    globalThis.window = {}
    expect(() => analytics.trackPaywallShown(makeDecision())).not.toThrow()
    expect(() => analytics.trackUpgradeClick('multi_cluster', 'pro')).not.toThrow()
    expect(() => analytics.trackSubscriptionStarted('pro')).not.toThrow()
    expect(() => analytics.trackSubscriptionCancelled('pro')).not.toThrow()
  })
})
