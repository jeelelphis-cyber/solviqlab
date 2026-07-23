// ─────────────────────────────────────────────────────────────────────────────
// RecommendationEngine — Core
//
// Answers the single most important question in SolviqLab:
//   "What is the single best next step for this specific user right now?"
//
// The engine is deterministic and stateless. It produces the same output
// for the same input. This makes it safe to call from any context:
//   - Server Components (SSG — no user state → fallback recommendations)
//   - Client Components (with real UserEngine data)
//   - AI Coach (AI reads recommendations, doesn't replace them)
//   - Future: REST API, Dashboard, email notifications
//
// AI INTEGRATION STRATEGY (V3-07):
//   The AI Coach does NOT generate recommendations — it explains them.
//   Workflow:
//     1. AI Coach calls engine.recommend(context)
//     2. AI gets Recommendation.reason + Recommendation.scoring.factors
//     3. AI generates natural language from these machine-produced facts
//     4. User sees: personalized, explainable, data-driven response
//   This ensures recommendations are always grounded in real data,
//   not hallucinated by the AI.
//
// DevOS EXTRACTION (Sprint D-01):
//   This class moves to packages/recommendation-engine unchanged.
//   The imports from ../journey/* also move with it.
//   Zero web-specific dependencies.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Candidate,
  Recommendation,
  RecommendationContext,
  RecommendationResult,
  ScoringBreakdown,
} from './types'
import type { RecommendationDecision, AlternativeDecision } from './decision'
import { generateCandidates } from './candidates'
import { scoreCandidate, computeComposite } from './scoring'
import { emitRecommendationEvent } from './events'

const ENGINE_VERSION = '1.0.0'

// ── Decision ID ───────────────────────────────────────────────────────────────

function decisionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// ── Build RecommendationDecision ──────────────────────────────────────────────

function buildDecision(
  triggeredBy: string,
  scored: Array<{ candidate: Candidate; scoring: ScoringBreakdown }>,
  contextSummary: string,
  ctx: RecommendationContext,
): RecommendationDecision {
  const primary = scored[0]
  const alternatives: AlternativeDecision[] = scored.slice(1).map(({ candidate, scoring }) => ({
    slug:                candidate.instrument_slug,
    name:                candidate.instrument_name,
    type:                candidate.type,
    score:               scoring.composite,
    reasons:             scoring.factors,
    disqualified:        false,
    disqualified_reason: null,
  }))

  return {
    decision_id:     decisionId(),
    triggered_by:    triggeredBy,
    slug:            primary?.candidate.instrument_slug ?? null,
    name:            primary?.candidate.instrument_name ?? null,
    type:            primary?.candidate.type ?? 'next_calculator',
    score:           primary?.scoring.composite ?? 0,
    reasons:         primary?.scoring.factors ?? [],
    alternatives,
    context_summary: contextSummary,
    generated_at:    ctx.current_timestamp,
    engine_version:  ENGINE_VERSION,
  }
}

// ── Deterministic ID ───────────────────────────────────────────────────────────

function makeId(type: string, slug: string | null, userId: string | null): string {
  const raw = `${type}:${slug ?? 'none'}:${userId ?? 'anon'}`
  return raw.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0).toString(36)
}

// ── Expected Value Mapping ────────────────────────────────────────────────────

function mapExpectedValue(score: number): Recommendation['expected_value'] {
  if (score >= 70) return 'very_high'
  if (score >= 50) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

// ── Context Summary ───────────────────────────────────────────────────────────

function buildContextSummary(ctx: RecommendationContext): string {
  const parts: string[] = []
  const primary = ctx.journey_states[0]
  if (primary) {
    parts.push(`${primary.journey_id} ${primary.progress_percent}%`)
    parts.push(`${primary.completed_count}/${primary.total_steps} steps`)
    parts.push(`AI ${primary.ai_readiness}%`)
  }
  parts.push(`${ctx.result_count} results`)
  if (ctx.user_type) parts.push(ctx.user_type)
  return parts.join(' · ')
}

// ── Build Recommendation from Candidate + Score ───────────────────────────────

function buildRecommendation(
  candidate: Candidate,
  scoring: ScoringBreakdown,
  priority: Recommendation['priority'],
  lang: string,
  ctx: RecommendationContext
): Recommendation {
  const now = ctx.current_timestamp

  // Localize href if instrument slug present
  const href = candidate.cta_href && candidate.instrument_slug
    ? `/${lang}${candidate.cta_href}`
    : candidate.cta_href

  // Expiry: time-sensitive recommendations expire sooner
  const expiresAt = candidate.type === 'return_tomorrow'
    ? new Date(Date.now() + 24 * 60 * 60_000).toISOString()
    : candidate.type === 'ai_consultation'
      ? null
      : null

  return {
    id:               makeId(candidate.type, candidate.instrument_slug, ctx.user_id),
    type:             candidate.type,
    priority,
    instrument_slug:  candidate.instrument_slug,
    instrument_name:  candidate.instrument_name,
    title:            candidate.title,
    reason:           candidate.reason,
    detail:           candidate.detail,
    estimated_minutes: candidate.estimated_minutes,
    expected_value:   mapExpectedValue(scoring.composite),
    score:            scoring.composite,
    scoring,
    generated_at:     now,
    expires_at:       expiresAt,
    cta_label:        candidate.cta_label,
    cta_href:         href,
  }
}

// ── RecommendationEngine ──────────────────────────────────────────────────────

export class RecommendationEngine {

  recommend(ctx: RecommendationContext, lang = 'en'): RecommendationResult {
    const candidates = generateCandidates(ctx)

    if (candidates.length === 0) {
      return this.fallback(ctx, lang)
    }

    // Score all candidates
    const scored = candidates
      .map(c => ({
        candidate: c,
        scoring: scoreCandidate(c),
      }))
      .sort((a, b) => b.scoring.composite - a.scoring.composite)

    const [first, second, third] = scored

    const primary   = buildRecommendation(first!.candidate, first!.scoring, 'primary', lang, ctx)
    const secondary = second
      ? buildRecommendation(second.candidate, second.scoring, 'secondary', lang, ctx)
      : null
    const tertiary = third
      ? buildRecommendation(third.candidate, third.scoring, 'tertiary', lang, ctx)
      : null

    const contextSummary = buildContextSummary(ctx)

    // P-17: build durable decision record with full provenance
    const decision = buildDecision(ctx.current_slug, scored, contextSummary, ctx)

    // Emit analytics
    emitRecommendationEvent({
      type:                 'RecommendationGenerated',
      user_id:              ctx.user_id,
      recommendation_type:  primary.type,
      instrument_slug:      primary.instrument_slug,
      score:                primary.score,
      context_slug:         ctx.current_slug,
      timestamp:            ctx.current_timestamp,
    })

    return {
      primary,
      secondary,
      tertiary,
      context_summary:             contextSummary,
      total_candidates_evaluated:  candidates.length,
      engine_version:              ENGINE_VERSION,
      decision,
    }
  }

  // ── Fallback (no journey, new user) ────────────────────────────────────────

  private fallback(ctx: RecommendationContext, lang: string): RecommendationResult {
    const primary: Recommendation = {
      id:               makeId('next_calculator', 'bmi-calculator', ctx.user_id),
      type:             'next_calculator',
      priority:         'primary',
      instrument_slug:  'bmi-calculator',
      instrument_name:  'BMI Calculator',
      title:            'Start Your Health Journey',
      reason:           'BMI is the foundation of understanding your body. It takes 30 seconds and unlocks your Health Profile.',
      detail:           'Used by WHO and NHS as the primary screening tool for weight-related health risks.',
      estimated_minutes: 1,
      expected_value:   'high',
      score:            55,
      scoring: {
        need:                   0.80,
        confidence:             0.80,
        journey_importance:     0.75,
        completion_probability: 0.90,
        composite:              55,
        factors:                ['popular starting point', 'broad health relevance'],
      },
      generated_at:  ctx.current_timestamp,
      expires_at:    null,
      cta_label:     'Start Health Journey',
      cta_href:      `/${lang}/calculators/bmi-calculator`,
    }

    const fallbackDecision: RecommendationDecision = {
      decision_id:     decisionId(),
      triggered_by:    ctx.current_slug,
      slug:            'bmi-calculator',
      name:            'BMI Calculator',
      type:            'next_calculator',
      score:           55,
      reasons:         ['popular starting point', 'broad health relevance'],
      alternatives:    [],
      context_summary: 'new user · no active journey',
      generated_at:    ctx.current_timestamp,
      engine_version:  ENGINE_VERSION,
    }

    return {
      primary,
      secondary:                   null,
      tertiary:                    null,
      context_summary:             'new user · no active journey',
      total_candidates_evaluated:  0,
      engine_version:              ENGINE_VERSION,
      decision:                    fallbackDecision,
    }
  }
}
