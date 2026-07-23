// ─────────────────────────────────────────────────────────────────────────────
// User Identity Foundation — Types
//
// These interfaces define the User Graph: the first persistent layer of
// SolviqLab. Every field here is designed to migrate to an authenticated
// backend without structural changes.
//
// INVARIANT: The UserEngine API never exposes the storage provider directly.
//   Today: LocalStorageProvider
//   Tomorrow: Supabase, PostgreSQL, CloudSync
//   The UI never knows the difference.
//
// FUTURE: When DevOS extracts this into packages/user-engine, these types
//   move with it unchanged. No web-specific types live here.
// ─────────────────────────────────────────────────────────────────────────────

// ── Primitives ────────────────────────────────────────────────────────────────

export type UserId    = string   // UUID v4, client-generated for anonymous
export type Timestamp = string   // ISO 8601

// ── Result Record ─────────────────────────────────────────────────────────────

/**
 * A Result Record is produced whenever a user completes a calculation.
 * The calculator generates the data. The User Engine owns the record.
 *
 * This distinction is critical (per Product Rule 9):
 *   The user owns the data.
 *   The calculator only generates it.
 */
export interface ResultRecord {
  readonly id: string                           // UUID, immutable
  readonly instrument_slug: string              // e.g. 'bmi-calculator'
  readonly instrument_name: string              // e.g. 'BMI Calculator'
  readonly completed_at: Timestamp
  readonly result_value: number | null          // primary numeric result
  readonly result_label: string | null          // e.g. 'Normal weight'
  readonly result_category: string | null       // e.g. 'normal'
  readonly unit: string | null                  // e.g. 'kg/m²', '%', '$'
  readonly algorithm_version: string            // e.g. '1.0.0'
  readonly journey_id: string | null            // which journey this belongs to
  readonly metadata: Readonly<Record<string, unknown>>  // full output, instrument-specific
}

// ── Journey State ─────────────────────────────────────────────────────────────

/**
 * A user's real progress through a specific journey.
 * Calculated from completed result records — never from config position.
 *
 * DevOS note: JourneyState will become the input to the Journey Department's
 * recommendation engine across all future products.
 */
export interface JourneyState {
  readonly journey_id: string
  readonly completed_slugs: readonly string[]
  readonly completed_count: number
  readonly total_steps: number
  readonly progress_percent: number             // 0-100, real
  readonly ai_readiness: number                 // 0-100, cumulative from rewards
  readonly unlocked_rewards: readonly string[]  // reward labels earned
  readonly started_at: Timestamp
  readonly last_active_at: Timestamp
  readonly is_complete: boolean
}

// ── User Profiles ─────────────────────────────────────────────────────────────

/**
 * An anonymous user exists before registration.
 * Created automatically on first visit.
 * Survives across sessions via localStorage.
 * Upgrades to AuthenticatedUser without data loss.
 */
export interface AnonymousUser {
  readonly id: UserId
  readonly type: 'anonymous'
  readonly created_at: Timestamp
  readonly last_active_at: Timestamp
  readonly result_history: readonly ResultRecord[]
  readonly journey_states: readonly JourneyState[]
  readonly completed_slugs: readonly string[]    // flat list for quick lookup
  readonly achievements: readonly string[]
  readonly schema_version: 1                     // for future migration
}

/**
 * Authenticated users have all anonymous data merged into their account.
 * The anonymous_id field enables deduplication and audit.
 */
export interface AuthenticatedUser extends Omit<AnonymousUser, 'type'> {
  readonly type: 'authenticated'
  readonly email: string
  readonly display_name: string | null
  readonly avatar_url: string | null
  readonly anonymous_id: UserId | null           // merged from anonymous session
  readonly auth_provider: 'google' | 'email' | 'apple' | 'github'
  readonly subscription_tier: 'free' | 'pro' | 'enterprise'
}

export type SolviqUser = AnonymousUser | AuthenticatedUser

// ── Registration Trigger ──────────────────────────────────────────────────────

export type RegistrationTriggerReason =
  | 'journey_progress_35'       // ≥ 35% journey completion
  | 'three_instruments'         // completed 3+ instruments
  | 'ai_nearly_unlocked'        // AI readiness ≥ 60%
  | 'reward_unlock_pending'     // one step from a reward
  | 'result_history_limit'      // approaching anonymous result limit (10)

export interface RegistrationTriggerResult {
  readonly shouldSuggest: boolean
  readonly reason: RegistrationTriggerReason | null
  readonly message: string | null               // human-readable trigger message
  readonly urgency: 'low' | 'medium' | 'high'
}

// ── Migration Contract ────────────────────────────────────────────────────────

/**
 * When an anonymous user registers, their history is merged.
 * This contract defines what gets transferred and how conflicts resolve.
 *
 * Implementation in V3-04. Interface defined now.
 */
export interface MergeContract {
  readonly anonymous_id: UserId
  readonly authenticated_id: UserId
  readonly result_records_to_merge: readonly ResultRecord[]
  readonly journey_states_to_merge: readonly JourneyState[]
  readonly conflict_resolution: 'anonymous_wins' | 'authenticated_wins' | 'merge_union'
  readonly executed_at: Timestamp
}
