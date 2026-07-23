import type { IntentCluster } from '../assessment/types'

export type PolicyViolation =
  | 'registration_required'     // anonymous users can't save a plan
  | 'premium_required'          // feature needs subscription
  | 'rate_limit_exceeded'       // too many plans in a period
  | 'cluster_blocked'           // health risk detected, manual review needed
  | 'age_restriction'           // user under 18 for certain clusters

export interface PolicyResult {
  readonly allowed: boolean
  readonly violations: readonly PolicyViolation[]
  readonly reasons: readonly string[]         // human-readable explanations
  readonly requiresRegistration: boolean      // quick-check for UI gate
  readonly requiresPremium: boolean           // quick-check for UI gate
}

export interface PolicyInput {
  readonly cluster: IntentCluster
  readonly userType: 'anonymous' | 'authenticated'
  readonly subscriptionTier: 'free' | 'pro' | 'enterprise'
  readonly existingPlanCount: number          // how many active plans already
  readonly assessmentScore: number            // from assessment result
}
