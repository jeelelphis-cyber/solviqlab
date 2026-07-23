// ─────────────────────────────────────────────────────────────────────────────
// Profile Engine — Core Types
//
// The Personal Health Profile is the user's permanent digital health identity.
// Every completed instrument contributes signals. Signals build confidence.
// Confidence drives recommendations. Contradictions flag inconsistencies.
//
// Architecture invariants:
//   1. Never diagnose. Only describe and detect inconsistencies.
//   2. Every signal is timestamped — the profile is a timeline, not a snapshot.
//   3. Confidence is earned, not assumed. Unknown = low confidence.
//   4. AI Coach receives this profile, not raw calculator history.
//   5. DevOS path: migrates to packages/profile-engine unchanged.
// ─────────────────────────────────────────────────────────────────────────────

// ── Health Domains ────────────────────────────────────────────────────────────

export type HealthDomain =
  | 'weight'
  | 'nutrition'
  | 'metabolism'
  | 'fitness'
  | 'sleep'
  | 'recovery'
  | 'hydration'
  | 'cardiovascular'
  | 'mental_wellness'
  | 'womens_health'
  | 'pregnancy'
  | 'lifestyle'

export type FinanceDomain =
  | 'savings'
  | 'investment'
  | 'debt'
  | 'retirement'
  | 'income'

export type ProfileDomain = HealthDomain | FinanceDomain

// ── Signal Status ─────────────────────────────────────────────────────────────

export type SignalStatus =
  | 'optimal'   // in healthy/ideal range
  | 'normal'    // within acceptable range
  | 'warning'   // outside recommended range
  | 'critical'  // significantly outside range
  | 'unknown'   // cannot classify (unit mismatch, missing data)

// ── Health Signal ─────────────────────────────────────────────────────────────

/**
 * A single data point contributed by one calculator result.
 * Signals accumulate over time to build domain confidence.
 */
export interface HealthSignal {
  readonly id: string                        // deterministic: `${slug}:${timestamp}`
  readonly instrument_slug: string
  readonly domain: ProfileDomain
  readonly metric: string                    // e.g. 'bmi', 'daily_calories', 'sleep_hours'
  readonly value: number | null
  readonly label: string | null              // 'Overweight', 'Normal Weight', etc.
  readonly unit: string | null               // 'kg/m²', 'kcal', 'hours', etc.
  readonly status: SignalStatus
  readonly confidence_contribution: number   // 0–100, how much this adds to domain confidence
  readonly recorded_at: string               // ISO timestamp
}

// ── Domain Profile ────────────────────────────────────────────────────────────

export type DomainStatus = 'unknown' | 'building' | 'established' | 'needs_update'

export interface DomainProfile {
  readonly domain: ProfileDomain
  readonly confidence: number           // 0–100
  readonly status: DomainStatus
  readonly signals: readonly HealthSignal[]
  readonly last_updated: string | null  // ISO timestamp of most recent signal
  readonly missing_instruments: readonly string[]  // slugs that would improve confidence
}

// ── Contradiction ─────────────────────────────────────────────────────────────

export type ContradictionSeverity = 'low' | 'medium' | 'high'

export interface Contradiction {
  readonly id: string
  readonly severity: ContradictionSeverity
  readonly domains: readonly ProfileDomain[]
  readonly signals: readonly string[]    // signal ids involved
  readonly description: string           // "Healthy BMI conflicts with very low calorie intake"
  readonly suggestion: string            // "Consider re-checking your calorie calculation"
  readonly detected_at: string
}

// ── Timeline Entry ────────────────────────────────────────────────────────────

export type TimelineRange = 'today' | 'this_week' | 'this_month' | 'older'

export interface TimelineEntry {
  readonly instrument_slug: string
  readonly instrument_name: string
  readonly domain: ProfileDomain
  readonly metric: string
  readonly value: number | null
  readonly label: string | null
  readonly status: SignalStatus
  readonly recorded_at: string
  readonly range: TimelineRange
}

// ── Missing Insight ───────────────────────────────────────────────────────────

export interface MissingInsight {
  readonly domain: ProfileDomain
  readonly domain_label: string
  readonly instrument_slug: string
  readonly instrument_name: string
  readonly reason: string               // "Complete this to establish your Sleep profile"
  readonly confidence_gain: number      // how much confidence this would add (0–100)
  readonly priority: 'high' | 'medium' | 'low'
}

// ── Personal Health Profile ───────────────────────────────────────────────────

/**
 * The user's complete health identity.
 * Built incrementally as they complete instruments.
 * This is what the AI Coach receives — never raw calculator history.
 */
export interface PersonalHealthProfile {
  readonly user_id: string | null
  readonly schema_version: 1
  readonly domains: Readonly<Record<ProfileDomain, DomainProfile>>
  readonly contradictions: readonly Contradiction[]
  readonly timeline: readonly TimelineEntry[]
  readonly missing_insights: readonly MissingInsight[]
  readonly overall_confidence: number   // 0–100, weighted average across health domains
  readonly total_signals: number
  readonly profile_completeness: number // 0–100, % of high-priority instruments completed
  readonly created_at: string
  readonly updated_at: string
}

// ── Signal Extraction Map ─────────────────────────────────────────────────────

/** Describes how one instrument maps to profile signals. */
export interface InstrumentProfileConfig {
  readonly slug: string
  readonly name: string
  readonly domains: readonly {
    readonly domain: ProfileDomain
    readonly metric: string
    readonly confidence_contribution: number   // points added to domain confidence
    readonly status_map?: Readonly<Record<string, SignalStatus>>  // label → status
  }[]
}
