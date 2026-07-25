import type { SubscriptionPlan } from './types'

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id:        'free',
    name:      'Free',
    tier:      'free',
    price:     { monthly: 0, annual: 0, currency: 'USD' },
    features:  [],
    highlight: null,
  },
  {
    id:       'pro',
    name:     'Pro',
    tier:     'pro',
    price:    { monthly: 9.99, annual: 79.99, currency: 'USD' },
    features: [
      'multi_cluster',
      'coach_advanced',
      'coach_history_unlimited',
      'export_data',
      'sync_multi_device',
      'journey_insights',
    ],
    highlight: 'Most Popular',
  },
  {
    id:       'enterprise',
    name:     'Enterprise',
    tier:     'enterprise',
    price:    { monthly: 29.99, annual: 239.99, currency: 'USD' },
    features: [
      'multi_cluster',
      'coach_advanced',
      'coach_history_unlimited',
      'export_data',
      'sync_multi_device',
      'journey_insights',
      'ai_consultation',
      'priority_support',
    ],
    highlight: null,
  },
]

export function getPlan(tier: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS.find(p => p.tier === tier) ?? null
}
