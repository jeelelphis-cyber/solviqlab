/**
 * C-18 — First Integration Test
 *
 * Verifies the full platform pipeline from instrument result to recommendation:
 *
 *   BMI result
 *     ↓ storeResult()
 *   IntentState (UserEngine) updated
 *     ↓ profileEngine.processResult()
 *   Profile weight domain confidence > 0
 *     ↓ buildRecommendationContext()
 *   RecommendationEngine.recommend()
 *     ↓
 *   Recommendation produced (primary is not null, score > 0)
 *
 * If this test PASSES, the architecture is not theory — it is a working platform.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { UserEngine } from '../user/engine'
import { ProfileEngine } from '../profile/engine'
import { RecommendationEngine } from '../recommendation/engine'
import { MemoryProvider } from '../user/storage'
import type { RecommendationContext } from '../recommendation/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildContext(
  userEngine: UserEngine,
): RecommendationContext {
  const user = userEngine.getUser()!
  const now = new Date().toISOString()

  return {
    user_id: user.id,
    user_type: user.type,
    subscription_tier: 'free',
    current_slug: 'bmi-calculator',
    completed_slugs: user.completed_slugs,
    journey_states: user.journey_states.map(js => ({
      journey_id: js.journey_id,
      completed_count: js.completed_count,
      total_steps: js.total_steps,
      progress_percent: js.progress_percent,
      ai_readiness: js.ai_readiness,
      unlocked_rewards: [...js.unlocked_rewards],
      last_active_at: js.last_active_at,
      is_complete: js.is_complete,
    })),
    result_count: user.result_history.length,
    last_active_at: user.last_active_at,
    registration_trigger_score: 0,
    current_timestamp: now,
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

let userEngine: UserEngine
let profileEngine: ProfileEngine
let recommendationEngine: RecommendationEngine

beforeEach(() => {
  // Fresh in-memory storage for each test — no localStorage pollution
  const userStorage = new MemoryProvider()
  const profileStorage = new MemoryProvider()

  profileEngine = new ProfileEngine(profileStorage)
  userEngine = new UserEngine(userStorage, profileEngine)
  recommendationEngine = new RecommendationEngine()

  userEngine.createAnonymousUser()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Platform Pipeline — BMI → IntentState → Profile → Recommendation', () => {

  it('UserEngine: storeResult() updates completed_slugs', () => {
    userEngine.storeResult({
      slug: 'bmi-calculator',
      name: 'BMI Calculator',
      value: 24.2,
      label: 'Normal Weight',
      category: 'normal',
      unit: 'kg/m²',
      metadata: { bmi: 24.2, category: 'normal' },
    })

    const completedSlugs = userEngine.getCompletedSlugs()
    expect(completedSlugs).toContain('bmi-calculator')
  })

  it('UserEngine: storeResult() updates journey state for weight-management', () => {
    userEngine.storeResult({
      slug: 'bmi-calculator',
      name: 'BMI Calculator',
      value: 24.2,
      label: 'Normal Weight',
      category: 'normal',
      unit: 'kg/m²',
      metadata: {},
    })

    const journeyState = userEngine.getJourneyState('weight-management')
    expect(journeyState).not.toBeNull()
    expect(journeyState!.completed_count).toBeGreaterThan(0)
    expect(journeyState!.progress_percent).toBeGreaterThan(0)
  })

  it('ProfileEngine: processResult() increases weight domain confidence', () => {
    const userId = userEngine.getUserId()!

    profileEngine.processResult({
      userId,
      slug: 'bmi-calculator',
      value: 24.2,
      label: 'Normal Weight',
      unit: 'kg/m²',
      completedSlugs: ['bmi-calculator'],
    })

    const profile = profileEngine.getOrCreateProfile(userId)
    expect(profile.domains.weight.confidence).toBeGreaterThan(0)
    expect(profile.domains.weight.signals.length).toBeGreaterThan(0)
    expect(profile.total_signals).toBeGreaterThan(0)
  })

  it('ProfileEngine: BMI signal has correct metric and status', () => {
    const userId = userEngine.getUserId()!

    profileEngine.processResult({
      userId,
      slug: 'bmi-calculator',
      value: 24.2,
      label: 'Normal Weight',
      unit: 'kg/m²',
      completedSlugs: ['bmi-calculator'],
    })

    const profile = profileEngine.getOrCreateProfile(userId)
    const bmiSignal = profile.domains.weight.signals.find(s => s.metric === 'bmi')

    expect(bmiSignal).toBeDefined()
    expect(bmiSignal!.value).toBe(24.2)
    expect(bmiSignal!.status).toBe('optimal')
  })

  it('RecommendationEngine: produces a primary recommendation after BMI stored', () => {
    userEngine.storeResult({
      slug: 'bmi-calculator',
      name: 'BMI Calculator',
      value: 24.2,
      label: 'Normal Weight',
      category: 'normal',
      unit: 'kg/m²',
      metadata: {},
    })

    const ctx = buildContext(userEngine)
    const result = recommendationEngine.recommend(ctx, 'en')

    expect(result.primary).not.toBeNull()
    expect(result.primary.score).toBeGreaterThan(0)
    expect(result.primary.instrument_slug).not.toBeNull()
  })

  it('RecommendationEngine: next step after BMI is in weight cluster', () => {
    userEngine.storeResult({
      slug: 'bmi-calculator',
      name: 'BMI Calculator',
      value: 24.2,
      label: 'Normal Weight',
      category: 'normal',
      unit: 'kg/m²',
      metadata: {},
    })

    const ctx = buildContext(userEngine)
    const result = recommendationEngine.recommend(ctx, 'en')

    // Recommendation should point to a health/weight instrument, not start over
    expect(result.primary.type).toBe('next_calculator')
    // Should explain why this was recommended
    expect(result.primary.reason.length).toBeGreaterThan(0)
    expect(result.primary.scoring.composite).toBeGreaterThan(0)
  })

  it('FULL PIPELINE: BMI → store → profile → recommendation in one flow', () => {
    // ── Step 1: Instrument emits result ────────────────────────────────────────
    userEngine.storeResult({
      slug: 'bmi-calculator',
      name: 'BMI Calculator',
      value: 27.8,   // overweight — more interesting case
      label: 'Overweight',
      category: 'overweight',
      unit: 'kg/m²',
      metadata: { bmi: 27.8 },
    })

    // ── Step 2: IntentState updated ────────────────────────────────────────────
    expect(userEngine.getCompletedSlugs()).toContain('bmi-calculator')
    expect(userEngine.getResultHistory().length).toBe(1)

    const journeyState = userEngine.getJourneyState('weight-management')
    expect(journeyState).not.toBeNull()
    expect(journeyState!.progress_percent).toBeGreaterThan(0)

    // ── Step 3: Profile has weight signal ──────────────────────────────────────
    const profile = profileEngine.getOrCreateProfile(userEngine.getUserId())
    expect(profile.domains.weight.confidence).toBeGreaterThan(0)

    const weightSignal = profile.domains.weight.signals.find(s => s.metric === 'bmi')
    expect(weightSignal).toBeDefined()
    expect(weightSignal!.status).toBe('warning')   // overweight → warning

    // ── Step 4: Recommendation produced ───────────────────────────────────────
    const ctx = buildContext(userEngine)
    const recommendation = recommendationEngine.recommend(ctx, 'en')

    expect(recommendation.primary).not.toBeNull()
    expect(recommendation.primary.score).toBeGreaterThan(0)
    expect(recommendation.total_candidates_evaluated).toBeGreaterThan(0)

    // Pipeline is working end-to-end
    console.log('✅ Pipeline PASS:', {
      bmi: 27.8,
      weightConfidence: profile.domains.weight.confidence,
      journeyProgress: journeyState!.progress_percent + '%',
      recommendation: recommendation.primary.type,
      recommendedSlug: recommendation.primary.instrument_slug,
      score: recommendation.primary.score,
    })
  })

})
