import type { AccessDecision, FeatureFlag, SubscriptionTier } from './types'

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export class PremiumAnalytics {
  trackPaywallShown(decision: AccessDecision): void {
    try {
      window.gtag?.('event', 'paywall_shown', {
        feature:       decision.feature,
        current_tier:  decision.currentTier,
        required_tier: decision.requiredTier,
        reason:        decision.reason,
      })
    } catch {}
  }

  trackUpgradeClick(feature: FeatureFlag, targetTier: SubscriptionTier): void {
    try {
      window.gtag?.('event', 'premium_upgrade_click', { feature, target_tier: targetTier })
    } catch {}
  }

  trackSubscriptionStarted(tier: SubscriptionTier): void {
    try {
      window.gtag?.('event', 'subscription_started', { tier })
    } catch {}
  }

  trackSubscriptionCancelled(tier: SubscriptionTier): void {
    try {
      window.gtag?.('event', 'subscription_cancelled', { tier })
    } catch {}
  }
}

export const premiumAnalytics = new PremiumAnalytics()
