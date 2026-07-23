// ── Profile Reader ─────────────────────────────────────────────────────────────
// Flattens PersonalHealthProfile into a keyed signal map for the scoring DSL.
// Keeps the most recent signal per metric across all domains.

import type { PersonalHealthProfile, HealthSignal } from '../profile/types'
import type { ResolvedSignals } from './types'

/** Flat map: metric → most recent HealthSignal. */
export function buildResolvedSignals(profile: PersonalHealthProfile): ResolvedSignals {
  const byMetric = new Map<string, HealthSignal>()

  for (const domainProfile of Object.values(profile.domains)) {
    for (const signal of domainProfile.signals) {
      const existing = byMetric.get(signal.metric)
      if (!existing || signal.recorded_at > existing.recorded_at) {
        byMetric.set(signal.metric, signal)
      }
    }
  }

  return Object.fromEntries(byMetric)
}

/** Extract gender from resolved signals, returning undefined if not known. */
export function extractGender(signals: ResolvedSignals): 'male' | 'female' | undefined {
  const genderSignal = signals['gender']
  if (!genderSignal) return undefined
  if (genderSignal.label === 'male' || genderSignal.label === 'Male') return 'male'
  if (genderSignal.label === 'female' || genderSignal.label === 'Female') return 'female'
  return undefined
}

/** Count how many of a cluster's canonical instrument slugs are in the profile timeline. */
export function countCompletedInCluster(
  profile: PersonalHealthProfile,
  clusterSlugs: readonly string[]
): number {
  const completedSet = new Set(profile.timeline.map(t => t.instrument_slug))
  return clusterSlugs.filter(slug => completedSet.has(slug)).length
}

/** Instruments belonging to each Intent Cluster. */
export const CLUSTER_INSTRUMENTS: Readonly<Record<string, readonly string[]>> = {
  weight: [
    'bmi-calculator',
    'body-fat-calculator',
    'bmr-calculator',
    'tdee-calculator',
    'calorie-calculator',
    'calorie-deficit-calculator',
    'ideal-weight-calculator',
  ],
  sleep: ['sleep-calculator'],
  finance: [
    'savings-calculator',
    'compound-interest-calculator',
    'investment-calculator',
    'retirement-calculator',
    'loan-calculator',
    'mortgage-calculator',
    'salary-calculator',
  ],
  pregnancy: ['due-date-calculator', 'pregnancy-calculator', 'ovulation-calculator'],
  nutrition: ['calorie-calculator', 'tdee-calculator', 'calorie-deficit-calculator'],
  fitness:   ['body-fat-calculator', 'bmi-calculator', 'bmr-calculator'],
}
