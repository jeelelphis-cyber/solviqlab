// ─────────────────────────────────────────────────────────────────────────────
// Universal Assessment Engine — Core Types
//
// Assessment = synthetic product that READS ProfileEngine signals,
// synthesizes them into a narrative, and writes one output signal back.
//
// Architecture invariants:
//   1. Config is pure data — no functions, no closures. Fully serializable.
//   2. AssessmentEngine reads ProfileEngine. Never the reverse.
//   3. Hooks return data — callers decide what to do with it.
//   4. AI Coach receives AssessmentAIContext, never raw signals.
//   5. Every cluster adds one file in configs/ — the engine never changes.
//
// DevOS path: migrates to packages/assessment-engine unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  PersonalHealthProfile,
  ProfileDomain,
  HealthSignal,
  SignalStatus,
} from '../profile/types'

// ── Cluster Identity ──────────────────────────────────────────────────────────

export type IntentCluster =
  | 'weight'
  | 'sleep'
  | 'pregnancy'
  | 'finance'
  | 'nutrition'
  | 'fitness'
  | 'mental_health'
  | 'cardiovascular'

// ── Assessment Confidence ─────────────────────────────────────────────────────

/** How complete is the data the Assessment is working with. */
export type AssessmentConfidence =
  | 'insufficient'   // too few signals, cannot produce reliable Assessment
  | 'preliminary'    // some signals, result is indicative
  | 'established'    // enough signals for solid Assessment
  | 'comprehensive'  // all key signals present, highest reliability

// ── Scoring Rule DSL ──────────────────────────────────────────────────────────
//
// Scoring rules are PURE DATA — no functions allowed.
// This keeps configs serializable and testable.

export interface ScoreThreshold {
  readonly max: number   // if signal value ≤ max → use this score
  readonly score: number // 0–100
  readonly label: string // 'Optimal', 'Normal', 'Warning'
}

export type ScoringRule =
  | {
      /** Compare a numeric signal metric to threshold bands. */
      readonly type: 'signal_value_threshold'
      readonly metric: string
      readonly thresholds?: readonly ScoreThreshold[]
      readonly gender_variant?: {
        readonly male: readonly ScoreThreshold[]
        readonly female: readonly ScoreThreshold[]
      }
    }
  | {
      /** Map signal status directly to a score. */
      readonly type: 'signal_status_map'
      readonly metric: string
      readonly status_scores: Readonly<Record<SignalStatus, number>>
    }
  | {
      /** Binary: signal exists → one score, absent → another. */
      readonly type: 'signal_presence'
      readonly metric: string
      readonly score_if_present: number
      readonly score_if_absent: number
    }
  | {
      /** Weighted average of multiple sub-rules. Weights must sum to 1.0. */
      readonly type: 'composite_weighted'
      readonly rules: readonly {
        readonly rule: ScoringRule
        readonly weight: number // 0–1
      }[]
    }

// ── Insight Condition DSL ─────────────────────────────────────────────────────
//
// Conditions are PURE DATA — evaluated by insights.ts evaluator.

export type InsightCondition =
  | { readonly type: 'dimension_score_below'; readonly dimension: string; readonly threshold: number }
  | { readonly type: 'dimension_score_above'; readonly dimension: string; readonly threshold: number }
  | { readonly type: 'overall_score_below'; readonly threshold: number }
  | { readonly type: 'overall_score_above'; readonly threshold: number }
  | { readonly type: 'signal_status'; readonly metric: string; readonly status: SignalStatus }
  | { readonly type: 'signal_value_below'; readonly metric: string; readonly value: number }
  | { readonly type: 'signal_value_above'; readonly metric: string; readonly value: number }
  | { readonly type: 'signal_value_range'; readonly metric: string; readonly min?: number; readonly max?: number }
  | { readonly type: 'signal_present'; readonly metric: string }
  | { readonly type: 'signal_absent'; readonly metric: string }
  | { readonly type: 'and'; readonly conditions: readonly InsightCondition[] }
  | { readonly type: 'or'; readonly conditions: readonly InsightCondition[] }
  | { readonly type: 'not'; readonly condition: InsightCondition }

// ── Assessment Dimension ──────────────────────────────────────────────────────

export interface AssessmentDimension {
  readonly id: string                 // 'body_composition', 'metabolism', 'sleep_quality'
  readonly label_key: string          // i18n key
  readonly weight: number             // 0–1; all dimension weights must sum to 1.0
  readonly icon: string               // '⚖️', '🔥', '💪'
  readonly scoring_rule: ScoringRule
  readonly min_confidence: number     // min domain confidence to include this dimension
}

// ── Gap Questions ─────────────────────────────────────────────────────────────
//
// Asked when Profile lacks data needed for a reliable Assessment.
// Kept to ≤3 questions per Assessment to minimize friction.

export type QuestionType = 'select' | 'number' | 'boolean'

export interface QuestionOption {
  readonly value: string
  readonly label_key: string
}

export interface AssessmentQuestion {
  readonly id: string                 // 'goal', 'activity_preference'
  readonly type: QuestionType
  readonly label_key: string          // question text i18n key
  readonly required: boolean
  readonly options?: readonly QuestionOption[]    // for 'select' type
  readonly min?: number               // for 'number' type
  readonly max?: number               // for 'number' type
  readonly unit?: string              // for 'number' type display
  // Condition under which this question is shown
  // (only ask if the signal is missing from Profile)
  readonly ask_if_signal_absent?: string  // metric name
}

export type QuestionAnswers = Readonly<Record<string, string | number | boolean>>

// ── Insight Rule ──────────────────────────────────────────────────────────────

export type InsightType = 'achievement' | 'warning' | 'opportunity' | 'contradiction'

export interface InsightRule {
  readonly id: string
  readonly condition: InsightCondition
  readonly insight: {
    readonly type: InsightType
    readonly priority: 1 | 2 | 3     // 1 = highest, shown first
    readonly title_key: string
    readonly body_key: string
    // Signal metrics whose values are interpolated into the i18n body text
    readonly params_from_signals?: readonly string[]
  }
}

// ── Narrative Config ──────────────────────────────────────────────────────────

export interface NarrativeHeadlineByTier {
  readonly excellent: string    // score 80–100 i18n key
  readonly good: string         // score 60–79
  readonly fair: string         // score 40–59
  readonly poor: string         // score <40
}

export interface ProfileClassifier {
  readonly id: string                  // 'active_and_lean', 'metabolically_slow'
  readonly condition: InsightCondition
  readonly label_key: string
  readonly description_key: string
}

export interface AssessmentNarrativeConfig {
  readonly headline_by_tier: NarrativeHeadlineByTier
  readonly profile_classifiers: readonly ProfileClassifier[]
  readonly max_key_points: number      // how many insights to surface (typically 3)
  readonly cta: {
    readonly high_score: { readonly label_key: string; readonly product_id: string }
    readonly low_score: { readonly label_key: string; readonly product_id: string }
  }
}

// ── Recommendation Hooks ──────────────────────────────────────────────────────

export interface AssessmentRecommendationHook {
  readonly condition: InsightCondition // when to apply this boost
  readonly boost_product: string       // instrument slug or product_id
  readonly score_boost: number         // added to RecommendationEngine composite score
  readonly reason: string              // surfaced in scoring.factors[]
}

// ── Output Signals ────────────────────────────────────────────────────────────
//
// What Assessment writes back to ProfileEngine on completion.

export interface OutputSignalConfig {
  readonly metric: string                          // 'weight_assessment_score'
  readonly domain: ProfileDomain
  readonly value_from: 'overall_score' | 'dimension_score'
  readonly dimension_id?: string                   // required if value_from = 'dimension_score'
  readonly unit: string                            // 'score/100'
  readonly confidence_contribution: number         // points added to domain confidence
}

// ── AI Context Fields ─────────────────────────────────────────────────────────

export interface AIContextField {
  readonly include: 'overall_score' | 'dimension_scores' | 'insights' | 'profile_type' |
                    'missing_signals' | 'top_priority_action' | 'data_sources'
}

// ── Trigger Config ────────────────────────────────────────────────────────────

export interface AssessmentTrigger {
  readonly required_domains: readonly {
    readonly domain: ProfileDomain
    readonly min_confidence: number    // min domain confidence to qualify
  }[]
  readonly min_instruments_completed: number
}

// ── Assessment Config (main) ──────────────────────────────────────────────────

/**
 * The single object that defines a complete Assessment for one Intent Cluster.
 * Pure data — no functions, no closures.
 *
 * Adding a new cluster Assessment = adding one file in configs/.
 * The AssessmentEngine never changes.
 */
export interface AssessmentConfig {
  readonly id: string                        // 'weight-assessment'
  readonly cluster: IntentCluster
  readonly version: number
  readonly schema_version: 1

  readonly trigger: AssessmentTrigger
  readonly gap_questions: readonly AssessmentQuestion[]
  readonly dimensions: readonly AssessmentDimension[]
  readonly insight_rules: readonly InsightRule[]
  readonly narrative: AssessmentNarrativeConfig
  readonly recommendation_hooks: readonly AssessmentRecommendationHook[]
  readonly output_signals: readonly OutputSignalConfig[]
  readonly ai_context_fields: readonly AIContextField[]
}

// ── Gate Result ───────────────────────────────────────────────────────────────

export interface GateResult {
  readonly can_run: boolean
  readonly confidence: AssessmentConfidence
  readonly missing_domains: readonly string[]       // domain ids lacking enough data
  readonly missing_instruments: readonly string[]   // slugs to complete first
  readonly message_key: string | null               // i18n key for "complete X first" msg
}

// ── Dimension Score ───────────────────────────────────────────────────────────

export interface DimensionScore {
  readonly dimension_id: string
  readonly label: string               // resolved i18n label
  readonly score: number               // 0–100
  readonly weight: number              // 0–1, from config
  readonly confidence: AssessmentConfidence
  readonly contributing_signals: readonly string[]  // metric names used
}

// ── Insight (resolved) ────────────────────────────────────────────────────────

export interface Insight {
  readonly id: string                  // from InsightRule.id
  readonly type: InsightType
  readonly priority: 1 | 2 | 3
  readonly title: string               // resolved i18n text
  readonly body: string                // resolved i18n text with signal values interpolated
}

// ── Assessment Narrative (resolved) ───────────────────────────────────────────

export interface AssessmentNarrative {
  readonly headline: string            // resolved i18n text
  readonly profile_type: string | null // e.g. 'Metabolically Slow'
  readonly profile_description: string | null
  readonly key_points: readonly Insight[]   // top N insights
  readonly cta_label: string
  readonly cta_product_id: string
}

// ── Assessment Result (main output) ──────────────────────────────────────────

/**
 * The output of AssessmentEngine.run().
 * Consumed by: Dashboard, RecommendationEngine, AI Coach, AssessmentUI.
 */
export interface AssessmentResult {
  readonly assessment_id: string       // 'weight-assessment-{user_id}-{timestamp}'
  readonly cluster: IntentCluster
  readonly config_id: string           // which config was used
  readonly config_version: number

  readonly overall_score: number       // 0–100
  readonly confidence: AssessmentConfidence
  readonly dimension_scores: readonly DimensionScore[]
  readonly insights: readonly Insight[]
  readonly narrative: AssessmentNarrative

  readonly completed_at: string        // ISO timestamp
  readonly lang: string
}

// ── Dashboard Cluster Card ────────────────────────────────────────────────────

export type ScoreTier = 'excellent' | 'good' | 'fair' | 'poor'

export interface ClusterCard {
  readonly cluster: IntentCluster
  readonly cluster_label: string
  readonly overall_score: number
  readonly score_tier: ScoreTier
  readonly color: 'emerald' | 'blue' | 'amber' | 'red'
  readonly top_insight: Insight | null
  readonly cta_label: string
  readonly cta_product_id: string
  readonly completed_at: string
  readonly confidence: AssessmentConfidence
}

// ── AI Coach Context ──────────────────────────────────────────────────────────

export interface AssessmentAIContext {
  readonly cluster: IntentCluster
  readonly assessment_id: string
  readonly completed_at: string

  readonly summary: {
    readonly overall_score: number
    readonly confidence: AssessmentConfidence
    readonly profile_type: string | null
    readonly top_insights: readonly {
      readonly type: InsightType
      readonly text: string            // plain English, not i18n key
    }[]
    readonly priority_action: string   // what to do next
  }

  readonly data_sources: readonly {
    readonly instrument_slug: string
    readonly metric: string
    readonly value: number | null
    readonly label: string | null
    readonly recorded_at: string
  }[]

  readonly missing_signals: readonly {
    readonly metric: string
    readonly would_improve: string     // e.g. 'metabolism assessment accuracy'
  }[]

  readonly dimension_breakdown: readonly {
    readonly dimension_id: string
    readonly label: string
    readonly score: number
    readonly confidence: AssessmentConfidence
  }[]
}

// ── Recommendation Boost ──────────────────────────────────────────────────────

export interface RecommendationBoost {
  readonly product: string             // slug or product_id
  readonly score_boost: number
  readonly reason: string              // for scoring.factors[]
}

// ── Resolved Signals (internal) ───────────────────────────────────────────────
//
// Flat map of metric → latest signal. Built from ProfileEngine before scoring.

export type ResolvedSignals = Readonly<Record<string, HealthSignal>>

// ── Re-exports for consumers ──────────────────────────────────────────────────

export type { PersonalHealthProfile, ProfileDomain, HealthSignal, SignalStatus }
