import type { SolviqUser } from '../user/types'
import type { Entitlement, FeatureFlag, SubscriptionTier } from './types'
import type { FeatureFlagEngine } from './flags'

function getUserTier(user: SolviqUser | null): SubscriptionTier {
  if (!user || user.type === 'anonymous') return 'free'
  return user.subscription_tier
}

export class EntitlementService {
  constructor(private readonly flags: FeatureFlagEngine) {}

  check(feature: FeatureFlag, user: SolviqUser | null): Entitlement {
    const tier    = getUserTier(user)
    const granted = this.flags.isEnabled(feature, tier)
    return { feature, tier, granted, reason: 'tier_access' }
  }

  canAccess(feature: FeatureFlag, user: SolviqUser | null): boolean {
    return this.check(feature, user).granted
  }

  getEntitlements(user: SolviqUser | null): readonly Entitlement[] {
    const tier: SubscriptionTier = getUserTier(user)
    const features                = this.flags.getEnabledFeatures(tier)
    return features.map(feature => ({ feature, tier, granted: true, reason: 'tier_access' as const }))
  }
}
