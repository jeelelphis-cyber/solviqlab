export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export type FeatureFlag =
  | 'multi_cluster'              // Access to all journey clusters (free: single cluster only)
  | 'coach_advanced'             // Advanced coach messages beyond basic insights
  | 'coach_history_unlimited'    // Unlimited coach history (free: last 10 entries)
  | 'export_data'                // Export results and history to CSV/JSON
  | 'sync_multi_device'          // Cloud sync across devices
  | 'journey_insights'           // Deep analytics and trend charts
  | 'ai_consultation'            // LLM-powered AI consultation (Phase 3)
  | 'priority_support'           // Priority customer support

export interface Entitlement {
  readonly feature: FeatureFlag
  readonly tier: SubscriptionTier
  readonly granted: boolean
  readonly reason: 'tier_access' | 'trial' | 'override'
}

export interface AccessDecision {
  readonly allowed: boolean
  readonly feature: FeatureFlag
  readonly requiredTier: SubscriptionTier | null
  readonly currentTier: SubscriptionTier
  readonly reason: 'granted' | 'tier_insufficient' | 'not_authenticated'
}

export interface SubscriptionPrice {
  readonly monthly: number
  readonly annual: number
  readonly currency: string
}

export interface SubscriptionPlan {
  readonly id: string
  readonly name: string
  readonly tier: SubscriptionTier
  readonly price: SubscriptionPrice
  readonly features: readonly FeatureFlag[]
  readonly highlight: string | null
}
