import type { IntentCluster } from '../assessment/types'
import type { ProfileDomain, SignalStatus } from '../profile/types'

export type InstrumentType = 'calculator' | 'assessment' | 'planner' | 'tracker' | 'converter'
export type CapabilityArea = 'health' | 'finance' | 'lifestyle'

// Profile signal contributed by this instrument to the user's PersonalProfile.
// Replaces the hardcoded INSTRUMENT_PROFILE_MAP in profile/domains.ts.
export interface ProfileSignalConfig {
  readonly domain: ProfileDomain
  readonly metric: string
  readonly confidence_contribution: number   // 0-100
  readonly status_map?: Readonly<Record<string, SignalStatus>>
}

// Journey step definition — if this instrument is part of a journey
export interface JourneyStepConfig {
  readonly journeyId: string
  readonly nextSlug?: string
  readonly nextName?: string
  readonly nextPage?: string
}

// The complete self-description of an instrument (P-14).
// Pure data — no functions, fully serializable.
export interface InstrumentManifest {
  readonly slug: string
  readonly name: string
  readonly type: InstrumentType
  readonly capability: CapabilityArea
  readonly cluster: IntentCluster | null   // null for cross-cluster instruments
  readonly emits: readonly ['solviqlab:result']  // always this event

  // What this instrument needs from the user (not profile — just user inputs)
  readonly requiredInputs: readonly string[]

  // What profile signals this instrument provides
  readonly profileSignals: readonly ProfileSignalConfig[]

  // Journey integration (optional — converters don't participate)
  readonly journeyStep?: JourneyStepConfig

  // If completing this instrument gates/triggers an Assessment
  readonly triggersAssessmentFor?: IntentCluster
}

// defineInstrument() — the only way to create a manifest (P-14).
// Identity function, but typed and enforces the contract.
export function defineInstrument(manifest: InstrumentManifest): InstrumentManifest {
  return Object.freeze(manifest)
}
