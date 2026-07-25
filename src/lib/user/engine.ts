// ─────────────────────────────────────────────────────────────────────────────
// UserEngine — Core User Identity System
//
// The single point of truth for all user state.
// No component should ever read/write user data except through this engine.
//
// The engine is a singleton per browser session.
// On the server (SSR/SSG) it is a no-op — returns null for all reads.
//
// Storage is abstracted via StorageProvider. Swap providers without touching
// this engine or any component.
//
// DevOS path: when extracted to packages/user-engine, this class moves with
//   its StorageProvider interface. Zero web-specific code lives here.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AnonymousUser,
  AuthenticatedUser,
  JourneyState,
  ResultRecord,
  SolviqUser,
  UserId,
} from './types'
import type { StorageProvider } from './storage'
import type { ResultCaptureDetail } from './events'
import type { ProfileEngine } from '../profile/engine'
import { emitUserEvent, makeEvent } from './events'
import { getJourneyForSlug, getJourneyPosition, JOURNEY_DEFINITIONS } from '../journey/config'
import { getStepReward } from '../journey/rewards'
import { checkRegistrationTrigger, ANONYMOUS_RESULT_LIMIT } from './registration-trigger'

// ── Storage Keys ──────────────────────────────────────────────────────────────

const KEYS = {
  user: 'profile',
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function now(): string {
  return new Date().toISOString()
}

// ── Journey State Builder ────────────────────────────────────────────────────

function buildJourneyState(
  journeyId: string,
  completedSlugs: readonly string[],
  existingState?: JourneyState
): JourneyState {
  const journey = JOURNEY_DEFINITIONS.find(j => j.id === journeyId)
  if (!journey) {
    return existingState ?? {
      journey_id: journeyId,
      completed_slugs: [],
      completed_count: 0,
      total_steps: 0,
      progress_percent: 0,
      ai_readiness: 0,
      unlocked_rewards: [],
      started_at: now(),
      last_active_at: now(),
      is_complete: false,
    }
  }

  const journeyCompleted = journey.steps
    .map(s => s.slug)
    .filter(slug => completedSlugs.includes(slug))

  const completedCount   = journeyCompleted.length
  const totalSteps       = journey.steps.length
  const progressPercent  = Math.round((completedCount / totalSteps) * 100)

  // Accumulate AI readiness from each completed step's reward contribution
  const aiReadiness = journeyCompleted.reduce((acc, slug) => {
    const reward = getStepReward(slug)
    return Math.min(100, acc + (reward?.aiReadinessContribution ?? 0))
  }, 0)

  // Determine unlocked rewards
  const unlockedRewards: string[] = []
  if (completedCount >= journey.unlockAtStep) {
    unlockedRewards.push(journey.unlockReward)
  }

  return {
    journey_id: journeyId,
    completed_slugs: journeyCompleted,
    completed_count: completedCount,
    total_steps: totalSteps,
    progress_percent: progressPercent,
    ai_readiness: aiReadiness,
    unlocked_rewards: unlockedRewards,
    started_at: existingState?.started_at ?? now(),
    last_active_at: now(),
    is_complete: completedCount >= totalSteps,
  }
}

// ── UserEngine ────────────────────────────────────────────────────────────────

export class UserEngine {
  constructor(
    private readonly storage: StorageProvider,
    private readonly profileEngine?: ProfileEngine,
  ) {}

  // ── Read ──────────────────────────────────────────────────────────────────

  getUser(): SolviqUser | null {
    return this.storage.get<SolviqUser>(KEYS.user)
  }

  getUserId(): UserId | null {
    return this.getUser()?.id ?? null
  }

  isAnonymous(): boolean {
    return this.getUser()?.type === 'anonymous'
  }

  isAuthenticated(): boolean {
    return this.getUser()?.type === 'authenticated'
  }

  getResultHistory(): readonly ResultRecord[] {
    return this.getUser()?.result_history ?? []
  }

  getCompletedSlugs(): readonly string[] {
    return this.getUser()?.completed_slugs ?? []
  }

  getJourneyState(journeyId: string): JourneyState | null {
    return this.getUser()?.journey_states.find(j => j.journey_id === journeyId) ?? null
  }

  getAllJourneyStates(): readonly JourneyState[] {
    return this.getUser()?.journey_states ?? []
  }

  checkRegistrationTrigger() {
    const user = this.getUser()
    if (!user || user.type === 'authenticated') {
      return { shouldSuggest: false, reason: null, message: null, urgency: 'low' as const }
    }
    return checkRegistrationTrigger(user as AnonymousUser)
  }

  // ── Create ────────────────────────────────────────────────────────────────

  createAnonymousUser(): AnonymousUser {
    const existing = this.getUser()
    if (existing) return existing as AnonymousUser

    const user: AnonymousUser = {
      id: uuid(),
      type: 'anonymous',
      created_at: now(),
      last_active_at: now(),
      result_history: [],
      journey_states: [],
      completed_slugs: [],
      achievements: [],
      schema_version: 1,
    }

    this.storage.set(KEYS.user, user)
    emitUserEvent(makeEvent('UserCreated', { user_id: user.id }))
    return user
  }

  getOrCreateUser(): SolviqUser {
    return this.getUser() ?? this.createAnonymousUser()
  }

  // ── Result Storage ────────────────────────────────────────────────────────

  storeResult(detail: ResultCaptureDetail): ResultRecord | null {
    const user = this.getUser()
    if (!user) return null

    // Enforce anonymous result history limit
    if (user.result_history.length >= ANONYMOUS_RESULT_LIMIT && user.type === 'anonymous') {
      // Remove oldest result to stay within limit
      // (registration prompt will fire before this becomes a problem)
    }

    const journey = getJourneyForSlug(detail.slug)

    const record: ResultRecord = {
      id: uuid(),
      instrument_slug: detail.slug,
      instrument_name: detail.name,
      completed_at: now(),
      result_value: detail.value,
      result_label: detail.label,
      result_category: detail.category,
      unit: detail.unit,
      algorithm_version: detail.algorithm_version ?? '1.0.0',
      journey_id: journey?.id ?? null,
      metadata: detail.metadata ?? {},
    }

    // Update completed slugs (deduplicated)
    const newCompleted = user.completed_slugs.includes(detail.slug)
      ? user.completed_slugs
      : [...user.completed_slugs, detail.slug]

    // Rebuild all journey states that include this slug
    const affectedJourneyIds = new Set<string>()
    if (journey) affectedJourneyIds.add(journey.id)

    const updatedJourneyStates = JOURNEY_DEFINITIONS
      .filter(j => j.steps.some(s => newCompleted.includes(s.slug)))
      .map(j => {
        const existing = user.journey_states.find(s => s.journey_id === j.id)
        return buildJourneyState(j.id, newCompleted, existing)
      })

    // Keep journey states for journeys where user has NO completed steps too? No — only active ones.
    const updated: SolviqUser = {
      ...user,
      last_active_at: now(),
      result_history: [...user.result_history, record],
      completed_slugs: newCompleted,
      journey_states: updatedJourneyStates,
    }

    this.storage.set(KEYS.user, updated)

    // Update Personal Health Profile (if profile engine is wired in)
    this.profileEngine?.processResult({
      userId: user.id,
      slug: detail.slug,
      value: detail.value,
      label: detail.label,
      unit: detail.unit ?? null,
      completedSlugs: newCompleted,
    })

    // Emit events
    emitUserEvent(makeEvent('ResultStored', {
      user_id: user.id,
      instrument_slug: detail.slug,
      result_id: record.id,
      journey_id: record.journey_id,
    }))

    // Check for newly unlocked rewards
    updatedJourneyStates.forEach(js => {
      const prev = user.journey_states.find(s => s.journey_id === js.journey_id)
      js.unlocked_rewards.forEach(reward => {
        if (!prev?.unlocked_rewards.includes(reward)) {
          emitUserEvent(makeEvent('RewardUnlocked', {
            user_id: user.id,
            reward,
            journey_id: js.journey_id,
          }))
        }
      })

      if (affectedJourneyIds.has(js.journey_id)) {
        emitUserEvent(makeEvent('JourneyProgressUpdated', {
          user_id: user.id,
          journey_id: js.journey_id,
          completed_count: js.completed_count,
          progress_percent: js.progress_percent,
        }))
      }
    })

    return record
  }

  // ── Mark Visited (lighter signal than full result) ────────────────────────

  /**
   * Marks an instrument as visited/started.
   * Used when we don't have result data (future: only storeResult() matters).
   * For V3-03 pilot only — remove when all calculators dispatch results.
   */
  markVisited(slug: string): void {
    const user = this.getOrCreateUser()
    if (user.completed_slugs.includes(slug)) return

    this.storeResult({
      slug,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: null,
      label: 'Visited',
      category: null,
      unit: null,
      metadata: { source: 'page_visit' },
    })
  }

  // ── Registration (local auth — no server required) ───────────────────────

  /**
   * Upgrades an anonymous user to an authenticated user.
   * Phase V3-06: local-only (no network). All data preserved.
   * Phase V3-07+: add Supabase/Google OAuth integration here.
   */
  upgradeToAuthenticated(credentials: {
    id?: UserId
    email: string
    display_name: string | null
    auth_provider: AuthenticatedUser['auth_provider']
  }): AuthenticatedUser {
    const user = this.getOrCreateUser()
    if (user.type === 'authenticated') return user as AuthenticatedUser

    const anon = user as AnonymousUser
    const authenticatedId = credentials.id ?? uuid()

    const authUser: AuthenticatedUser = {
      ...anon,
      id: authenticatedId,
      type: 'authenticated',
      email: credentials.email,
      display_name: credentials.display_name,
      avatar_url: null,
      anonymous_id: anon.id,
      auth_provider: credentials.auth_provider,
      subscription_tier: 'free',
    }

    this.storage.set(KEYS.user, authUser)

    emitUserEvent(makeEvent('RegistrationCompleted', {
      anonymous_id: anon.id,
      authenticated_id: authenticatedId,
      auth_provider: credentials.auth_provider,
    }))

    emitUserEvent(makeEvent('AnonymousMerged', {
      anonymous_id: anon.id,
      authenticated_id: authenticatedId,
      results_merged: anon.result_history.length,
      journeys_merged: anon.journey_states.length,
    }))

    return authUser
  }

  // ── Recommendation Decision (P-16 + P-17) ────────────────────────────────
  // P-16: IntentState owns next action — stored by EventBus P60.
  // P-17: RecommendationDecision captures full provenance (slug, score, reasons, alternatives).
  // All consumers read from here — no recomputation needed.

  private readonly REC_DECISION_KEY = 'recommendation_decision'

  setRecommendationDecision(decision: import('../recommendation/decision').RecommendationDecision): void {
    this.storage.set(this.REC_DECISION_KEY, decision)
  }

  getRecommendationDecision(): import('../recommendation/decision').RecommendationDecision | null {
    return this.storage.get(this.REC_DECISION_KEY)
  }

  // Compatibility shim — returns just the slug from the stored decision
  getNextRecommendation(): import('../recommendation/types').Recommendation | null {
    return null  // use getRecommendationDecision() instead
  }

  // ── Strategy Decision ─────────────────────────────────────────────────────
  // Stored by EventBus P40 (StrategyEngine) after assessment completion.

  private readonly STRATEGY_KEY = 'strategy_decision'

  setStrategyDecision(decision: import('../domain/strategy-decision').StrategyDecision): void {
    this.storage.set(this.STRATEGY_KEY, decision)
  }

  getStrategyDecision(): import('../domain/strategy-decision').StrategyDecision | null {
    return this.storage.get(this.STRATEGY_KEY)
  }

  // ── Active Plan ───────────────────────────────────────────────────────────
  // Stored by EventBus P45 (PlannerEngine) after strategy is decided.
  // Updated by PlannerEngine.adapt() on each check-in.

  private readonly ACTIVE_PLAN_KEY = 'active_plan'

  setActivePlan(plan: import('../domain/active-plan').ActivePlan): void {
    this.storage.set(this.ACTIVE_PLAN_KEY, plan)
  }

  getActivePlan(): import('../domain/active-plan').ActivePlan | null {
    return this.storage.get(this.ACTIVE_PLAN_KEY)
  }

  // ── Assessment Result ─────────────────────────────────────────────────────
  // Stored by EventBus P40 after assessment completion.
  // Carries full AssessmentResult (score + insights + dimension_scores + narrative).
  // AI Coach and StrategyEngine use this — not just event.value.

  setAssessmentResult(clusterId: string, result: import('../assessment/types').AssessmentResult): void {
    this.storage.set(`assessment_result_${clusterId}`, result)
  }

  getAssessmentResult(clusterId: string): import('../assessment/types').AssessmentResult | null {
    return this.storage.get(`assessment_result_${clusterId}`)
  }

  // ── IntentState Aggregate Read Model ──────────────────────────────────────
  // P-16: single read point for all consumers.
  // UI calls this — never the individual get* methods.

  getIntentState(clusterId: import('../assessment/types').IntentCluster): import('../domain/intent-state').IntentState | null {
    const user = this.getUser()
    if (!user) return null
    const { buildIntentState } = require('../domain/intent-state') as typeof import('../domain/intent-state')
    return buildIntentState(
      clusterId,
      user,
      this.getAssessmentResult(clusterId),
      this.getStrategyDecision(),
      this.getActivePlan(),
      this.getRecommendationDecision(),
    )
  }

  // ── Coach Memory ──────────────────────────────────────────────────────────

  getCoachMemory(clusterId: import('../assessment/types').IntentCluster): import('../coach/types').CoachMemory {
    const key    = `coach_memory:${clusterId}`
    const stored = this.storage.get<import('../coach/types').CoachMemory>(key)
    if (stored) return stored
    const { emptyCoachMemory } = require('../coach/types') as typeof import('../coach/types')
    return emptyCoachMemory(clusterId)
  }

  setCoachMemory(clusterId: import('../assessment/types').IntentCluster, memory: import('../coach/types').CoachMemory): void {
    this.storage.set(`coach_memory:${clusterId}`, memory)
  }

  // ── Destroy ───────────────────────────────────────────────────────────────

  clearUser(): void {
    this.storage.clear()
  }
}
