// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Intelligence Engine — Public API
//
// Usage:
//   import { getRecommendationEngine, buildContext } from '@/lib/recommendation'
//
//   const engine = getRecommendationEngine()
//   const ctx = buildContext({ userEngine, currentSlug, lang })
//   const result = engine.recommend(ctx, lang)
//   // result.primary → show this. result.secondary → show if space allows.
//
// AI Coach integration (V3-07):
//   Pass result.primary to Claude API as structured context.
//   Claude explains result.primary.reason in natural language.
//   Claude does NOT decide what to recommend — the engine does.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  Recommendation,
  RecommendationResult,
  RecommendationContext,
  RecommendationPriority,
  RecommendationType,
  ExpectedValue,
  ScoringBreakdown,
  Candidate,
} from './types'

export type { RecommendationEvent } from './events'
export { emitRecommendationEvent } from './events'
export { RecommendationEngine } from './engine'
export { scoreCandidate, computeComposite } from './scoring'

// ── Singleton ────────────────────────────────────────────────────────────────

import { RecommendationEngine } from './engine'
import type { RecommendationContext } from './types'
import type { UserEngine } from '../user/engine'
import { checkRegistrationTrigger } from '../user/registration-trigger'
import type { AnonymousUser } from '../user/types'

let _engine: RecommendationEngine | null = null

export function getRecommendationEngine(): RecommendationEngine {
  if (!_engine) _engine = new RecommendationEngine()
  return _engine
}

// ── Context Builder ────────────────────────────────────────────────────────────

/**
 * Assembles a RecommendationContext from a live UserEngine.
 * Call this in a client component where you have UserEngine access.
 */
export function buildContextFromEngine(
  userEngine: UserEngine,
  currentSlug: string
): RecommendationContext {
  const user = userEngine.getUser()
  const journeyStates = userEngine.getAllJourneyStates().map(j => ({
    journey_id:       j.journey_id,
    completed_count:  j.completed_count,
    total_steps:      j.total_steps,
    progress_percent: j.progress_percent,
    ai_readiness:     j.ai_readiness,
    unlocked_rewards: j.unlocked_rewards,
    last_active_at:   j.last_active_at,
  }))

  const triggerScore = user && user.type === 'anonymous'
    ? (checkRegistrationTrigger(user as AnonymousUser).shouldSuggest ? 60 : 0)
    : 0

  return {
    user_id:                   user?.id ?? null,
    user_type:                 user?.type ?? null,
    subscription_tier:         user?.type === 'authenticated' ? (user as { subscription_tier?: 'free' | 'pro' | 'enterprise' }).subscription_tier ?? 'free' : null,
    current_slug:              currentSlug,
    completed_slugs:           userEngine.getCompletedSlugs(),
    journey_states:            journeyStates,
    result_count:              userEngine.getResultHistory().length,
    last_active_at:            user?.last_active_at ?? null,
    registration_trigger_score: triggerScore,
    current_timestamp:         new Date().toISOString(),
  }
}

/**
 * Static context builder — for server-side or when user engine unavailable.
 * Returns a minimal context that produces a sensible fallback recommendation.
 */
export function buildStaticContext(currentSlug: string): RecommendationContext {
  return {
    user_id:                   null,
    user_type:                 null,
    subscription_tier:         null,
    current_slug:              currentSlug,
    completed_slugs:           [],
    journey_states:            [],
    result_count:              0,
    last_active_at:            null,
    registration_trigger_score: 0,
    current_timestamp:         new Date().toISOString(),
  }
}
