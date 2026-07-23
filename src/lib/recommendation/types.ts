// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Intelligence Engine — Types
//
// The engine is the brain of SolviqLab. It answers one question:
//   "What is the single best next step for this specific user right now?"
//
// Design invariants:
//   1. Returns exactly ONE primary recommendation — never a list.
//   2. Every recommendation must explain WHY (explainability requirement).
//   3. Never calls AI. AI consumes this engine, not the reverse.
//   4. All business logic lives here — never inside React components.
//   5. Fully deterministic: same input → same output. Safe to test.
//
// DevOS path: migrates to packages/recommendation-engine unchanged.
//   Any future SolviqLab product imports this package to get intelligent
//   recommendations without rebuilding the scoring model.
// ─────────────────────────────────────────────────────────────────────────────

// ── Recommendation Types ──────────────────────────────────────────────────────

export type RecommendationType =
  | 'next_calculator'       // logical next instrument in the journey
  | 'journey_complete'      // celebrate and suggest next journey
  | 'ai_consultation'       // user has earned AI unlock
  | 'save_progress'         // anonymous user should register
  | 'registration'          // registration trigger fired
  | 'premium_unlock'        // feature requires premium
  | 'return_tomorrow'       // user has done enough today
  | 'weekly_checkin'        // revisit a completed instrument
  | 'cross_journey'         // recommend starting a new journey category

export type ExpectedValue = 'low' | 'medium' | 'high' | 'very_high'
export type RecommendationPriority = 'primary' | 'secondary' | 'tertiary'

// ── Scoring Breakdown ─────────────────────────────────────────────────────────

/**
 * Transparent scoring model. Every recommendation shows its work.
 * This is the explainability layer — AI Coach reads this to generate
 * human language explanations.
 *
 * Formula: composite = Need × Confidence × JourneyImportance × CompletionProbability
 * Range: 0–100
 */
export interface ScoringBreakdown {
  readonly need: number                  // 0–1: how much does the user need this?
  readonly confidence: number            // 0–1: how sure are we?
  readonly journey_importance: number    // 0–1: how critical to their active journey?
  readonly completion_probability: number // 0–1: how likely to actually do it now?
  readonly composite: number             // 0–100: final score
  readonly factors: readonly string[]    // human-readable factors that influenced score
}

// ── Recommendation ────────────────────────────────────────────────────────────

export interface Recommendation {
  readonly id: string                    // deterministic: hash of type+slug+user_id
  readonly type: RecommendationType
  readonly priority: RecommendationPriority
  readonly instrument_slug: string | null
  readonly instrument_name: string | null
  readonly title: string                 // short display title
  readonly reason: string                // "Because your sleep confidence is low"
  readonly detail: string                // longer explanation for card display
  readonly estimated_minutes: number | null
  readonly expected_value: ExpectedValue
  readonly score: number                 // 0–100
  readonly scoring: ScoringBreakdown
  readonly generated_at: string          // ISO timestamp
  readonly expires_at: string | null     // null = always valid
  readonly cta_label: string             // button text
  readonly cta_href: string | null       // navigation target
}

// ── Recommendation Result ─────────────────────────────────────────────────────

/**
 * The engine always returns this shape.
 * primary is guaranteed. secondary/tertiary may be null.
 */
export interface RecommendationResult {
  readonly primary: Recommendation
  readonly secondary: Recommendation | null
  readonly tertiary: Recommendation | null
  readonly context_summary: string       // "Health Journey 33% · 2 of 6 steps · AI 40%"
  readonly total_candidates_evaluated: number
  readonly engine_version: string        // '1.0.0'
}

// ── Context ───────────────────────────────────────────────────────────────────

/**
 * Everything the engine needs to make a recommendation.
 * Assembled by the caller (UserJourneySection, future Dashboard, AI Coach).
 *
 * No React, no DOM, no localStorage — pure data.
 */
export interface RecommendationContext {
  readonly user_id: string | null
  readonly user_type: 'anonymous' | 'authenticated' | null
  readonly subscription_tier: 'free' | 'pro' | 'enterprise' | null
  readonly current_slug: string
  readonly completed_slugs: readonly string[]
  readonly journey_states: readonly {
    readonly journey_id: string
    readonly completed_count: number
    readonly total_steps: number
    readonly progress_percent: number
    readonly ai_readiness: number
    readonly unlocked_rewards: readonly string[]
    readonly last_active_at: string
    readonly is_complete?: boolean
  }[]
  readonly result_count: number
  readonly last_active_at: string | null
  readonly registration_trigger_score: number   // 0–100, from checkRegistrationTrigger
  readonly current_timestamp: string
}

// ── Candidate ─────────────────────────────────────────────────────────────────

/** Internal — a potential recommendation before scoring. */
export interface Candidate {
  readonly type: RecommendationType
  readonly instrument_slug: string | null
  readonly instrument_name: string | null
  readonly title: string
  readonly reason: string
  readonly detail: string
  readonly estimated_minutes: number | null
  readonly cta_label: string
  readonly cta_href: string | null
  readonly need: number
  readonly confidence: number
  readonly journey_importance: number
  readonly completion_probability: number
  readonly factors: readonly string[]
}
