import type { SolviqUser } from '../user/types'
import type { AccessDecision, FeatureFlag, SubscriptionTier } from './types'
import type { EntitlementService } from './entitlements'
import type { FeatureFlagEngine } from './flags'

const TIER_ORDER: SubscriptionTier[] = ['free', 'pro', 'enterprise']

export class AccessPolicy {
  constructor(
    private readonly entitlements: EntitlementService,
    private readonly flags: FeatureFlagEngine,
  ) {}

  evaluate(feature: FeatureFlag, user: SolviqUser | null): AccessDecision {
    const entitlement = this.entitlements.check(feature, user)
    const currentTier = entitlement.tier

    if (entitlement.granted) {
      return {
        allowed:      true,
        feature,
        requiredTier: null,
        currentTier,
        reason:       'granted',
      }
    }

    const requiredTier = this.flags.getRequiredTier(feature)

    if (!user) {
      return {
        allowed:      false,
        feature,
        requiredTier,
        currentTier,
        reason:       'not_authenticated',
      }
    }

    return {
      allowed:      false,
      feature,
      requiredTier,
      currentTier,
      reason:       'tier_insufficient',
    }
  }

  // Which tier comes after the current one?
  getUpgradeTier(currentTier: SubscriptionTier): SubscriptionTier | null {
    const idx = TIER_ORDER.indexOf(currentTier)
    return TIER_ORDER[idx + 1] ?? null
  }
}
