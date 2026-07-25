import type { FeatureFlag, SubscriptionTier } from './types'

type FlagConfig = Record<SubscriptionTier, readonly FeatureFlag[]>

const DEFAULT_CONFIG: FlagConfig = {
  free: [],
  pro: [
    'multi_cluster',
    'coach_advanced',
    'coach_history_unlimited',
    'export_data',
    'sync_multi_device',
    'journey_insights',
  ],
  enterprise: [
    'multi_cluster',
    'coach_advanced',
    'coach_history_unlimited',
    'export_data',
    'sync_multi_device',
    'journey_insights',
    'ai_consultation',
    'priority_support',
  ],
}

export class FeatureFlagEngine {
  constructor(private readonly config: FlagConfig = DEFAULT_CONFIG) {}

  isEnabled(feature: FeatureFlag, tier: SubscriptionTier): boolean {
    return this.config[tier].includes(feature)
  }

  getEnabledFeatures(tier: SubscriptionTier): readonly FeatureFlag[] {
    return this.config[tier]
  }

  // Which tier is the minimum required for this feature?
  getRequiredTier(feature: FeatureFlag): SubscriptionTier | null {
    const tiers: SubscriptionTier[] = ['free', 'pro', 'enterprise']
    return tiers.find(t => this.config[t].includes(feature)) ?? null
  }
}

export const featureFlagEngine = new FeatureFlagEngine()
