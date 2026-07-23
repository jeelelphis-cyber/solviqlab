import type { RecommendationType } from './types'

// ── RecommendationDecision ────────────────────────────────────────────────────
// A persistent audit record of a recommendation.
// Answers: WHY was this instrument recommended at this moment?
//
// Stored by EventBus P60 via UserEngine. All consumers (Dashboard, AI Coach,
// Mobile, future Analytics) read from here — no recomputation needed.
//
// Differs from Recommendation: Recommendation is ephemeral display data.
// RecommendationDecision is the durable decision record with full provenance.

export interface AlternativeDecision {
  readonly slug: string | null
  readonly name: string | null
  readonly type: RecommendationType
  readonly score: number
  readonly reasons: readonly string[]      // why it scored this way
  readonly disqualified: boolean
  readonly disqualified_reason: string | null
}

export interface RecommendationDecision {
  readonly decision_id: string             // UUID
  readonly triggered_by: string            // slug that triggered this evaluation
  readonly slug: string | null             // recommended instrument
  readonly name: string | null             // instrument display name
  readonly type: RecommendationType        // recommendation type
  readonly score: number                   // 0–100
  readonly reasons: readonly string[]      // human-readable scoring factors
  readonly alternatives: readonly AlternativeDecision[]
  readonly context_summary: string         // "Health 17% · 1/6 steps · AI 20%"
  readonly generated_at: string            // ISO timestamp
  readonly engine_version: string
}
