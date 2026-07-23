// ─────────────────────────────────────────────────────────────────────────────
// Profile Engine — Public API
//
// Usage (client component):
//   import { getProfileEngine } from '@/lib/profile'
//
//   const engine = getProfileEngine()
//   const profile = engine.getProfile(userId)
//   // profile.domains.weight.confidence → 72
//   // profile.missing_insights[0] → next instrument to complete
//   // profile.contradictions → inconsistencies to flag
//
// AI Coach integration (V3-08):
//   Pass profile directly to Claude API as structured context.
//   Claude explains profile state in natural language.
//   Claude does NOT compute confidence — the engine does.
//
// Registration copy (V3-06):
//   Use profile.overall_confidence and profile.total_signals to
//   generate "Save your Personal Health Profile" messaging
//   instead of generic "Save your progress".
// ─────────────────────────────────────────────────────────────────────────────

export type {
  PersonalHealthProfile,
  DomainProfile,
  HealthSignal,
  Contradiction,
  TimelineEntry,
  MissingInsight,
  HealthDomain,
  FinanceDomain,
  ProfileDomain,
  SignalStatus,
  DomainStatus,
  TimelineRange,
  InstrumentProfileConfig,
} from './types'

export type { ProfileEvent } from './events'
export { emitProfileEvent } from './events'
export { DOMAIN_META, DOMAIN_META_MAP, HEALTH_DOMAINS, FINANCE_DOMAINS, ALL_DOMAINS } from './domains'
export { ProfileEngine } from './engine'
export { extractSignals } from './signals'
export { detectContradictions } from './contradictions'

// ── Singleton ─────────────────────────────────────────────────────────────────

import { ProfileEngine } from './engine'
import { createStorageProvider } from '../user/storage'

let _profileEngine: ProfileEngine | null = null

export function getProfileEngine(): ProfileEngine | null {
  if (typeof window === 'undefined') return null
  if (!_profileEngine) _profileEngine = new ProfileEngine(createStorageProvider())
  return _profileEngine
}
