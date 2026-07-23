import { EventBus } from '../events/bus'
import type { EventHandler, HandlerContext, ResultEvent } from '../events/types'
import { UserEngine } from '../user/engine'
import { ProfileEngine } from '../profile/engine'
import { RecommendationEngine } from '../recommendation/engine'
import { AssessmentEngine, ASSESSMENT_REGISTRY } from '../assessment/index'
import { MemoryProvider, createStorageProvider } from '../user/storage'
import type { StorageProvider } from '../user/storage'

// ── Handler Priorities (from Runtime_Event_Architecture_v1.md) ────────────────
const PRIORITY = {
  USER_ENGINE:        10,
  PROFILE_ENGINE:     20,
  ASSESSMENT_TRIGGER: 30,
  STRATEGY_TRIGGER:   40,  // stub — implemented in V3-10E
  POLICY:             50,  // stub — implemented in V3-10E
  RECOMMENDATION:     60,
  JOURNEY:            70,  // already handled inside UserEngine.storeResult()
  ANALYTICS:          80,  // async fire-and-forget
} as const

// ── PlatformRuntime ───────────────────────────────────────────────────────────

export interface PlatformRuntime {
  readonly bus: EventBus
  readonly userEngine: UserEngine
  readonly profileEngine: ProfileEngine
  readonly recommendationEngine: RecommendationEngine
  readonly assessmentEngine: AssessmentEngine
}

export interface PlatformRuntimeOptions {
  readonly storage?: StorageProvider
}

// createPlatformRuntime() wires all engines to the EventBus.
// This is the single entry point for platform bootstrap.
// Tests pass MemoryProvider. Browser uses createStorageProvider().
export function createPlatformRuntime(options: PlatformRuntimeOptions = {}): PlatformRuntime {
  const storage = options.storage ?? createStorageProvider()

  const profileEngine        = new ProfileEngine(storage)
  const userEngine           = new UserEngine(storage, profileEngine)
  const recommendationEngine = new RecommendationEngine()
  const assessmentEngine     = new AssessmentEngine()
  const bus                  = new EventBus()

  // ── P10: UserEngine ────────────────────────────────────────────────────────
  // Stores the result record, updates completed_slugs, rebuilds journey states.
  bus.register({
    name: 'UserEngine.storeResult',
    priority: PRIORITY.USER_ENGINE,
    handle(event: ResultEvent, ctx: HandlerContext) {
      const user = userEngine.getUser()
      if (!user) return

      userEngine.storeResult({
        slug:     event.slug,
        name:     event.name,
        value:    event.value,
        label:    event.label,
        category: event.category,
        unit:     event.unit,
        metadata: event.metadata,
      })

      ctx.emit({
        type:          'platform:intent_state_updated',
        eventId:       `${event.eventId}:intent`,
        userId:        user.id,
        clusterId:     null,
        changedFields: ['completedInstruments', 'journeyStates'],
        timestamp:     Date.now(),
      })
    },
  })

  // ── P20: ProfileEngine ─────────────────────────────────────────────────────
  // Extracts HealthSignals from the result, updates domain confidence.
  bus.register({
    name: 'ProfileEngine.processResult',
    priority: PRIORITY.PROFILE_ENGINE,
    handle(event: ResultEvent, ctx: HandlerContext) {
      const userId = userEngine.getUserId()
      if (!userId) return

      const profileBefore = profileEngine.getOrCreateProfile(userId)
      const confidenceBefore = profileBefore.overall_confidence

      profileEngine.processResult({
        userId,
        slug:           event.slug,
        value:          event.value,
        label:          event.label,
        unit:           event.unit ?? null,
        completedSlugs: userEngine.getCompletedSlugs(),
      })

      const profileAfter = profileEngine.getOrCreateProfile(userId)
      const changedDomains = Object.entries(profileAfter.domains)
        .filter(([domain]) => {
          const before = profileBefore.domains[domain as keyof typeof profileBefore.domains]
          const after  = profileAfter.domains[domain as keyof typeof profileAfter.domains]
          return before?.confidence !== after?.confidence
        })
        .map(([domain]) => domain)

      ctx.emit({
        type:                    'platform:profile_recalculated',
        eventId:                 `${event.eventId}:profile`,
        userId,
        domainsChanged:          changedDomains,
        overallConfidenceDelta:  profileAfter.overall_confidence - confidenceBefore,
        timestamp:               Date.now(),
      })
    },
  })

  // ── P30: Assessment Trigger ────────────────────────────────────────────────
  // Checks if completing this instrument unlocks an Assessment.
  bus.register({
    name: 'AssessmentEngine.checkTrigger',
    priority: PRIORITY.ASSESSMENT_TRIGGER,
    handle(event: ResultEvent, ctx: HandlerContext) {
      const userId = userEngine.getUserId()
      if (!userId) return

      const profile = profileEngine.getOrCreateProfile(userId)

      for (const [cluster, config] of Object.entries(ASSESSMENT_REGISTRY)) {
        const gate = assessmentEngine.canRun(config, profile)
        if (gate.can_run) {
          ctx.emit({
            type:      'platform:assessment_triggered',
            eventId:   `${event.eventId}:assessment:${cluster}`,
            userId,
            cluster:   cluster as import('../assessment/types').IntentCluster,
            reason:    'threshold_met',
            timestamp: Date.now(),
          })
        }
      }
    },
  })

  // ── P40: Strategy Trigger ──────────────────────────────────────────────────
  // Stub — implemented in V3-10E (StrategyEngine runtime)
  bus.register({
    name: 'StrategyEngine.checkTrigger [stub]',
    priority: PRIORITY.STRATEGY_TRIGGER,
    handle(_event, _ctx) {
      // no-op until V3-10E
    },
  })

  // ── P50: Policy ────────────────────────────────────────────────────────────
  // Stub — implemented in V3-10E (PolicyEngine runtime)
  bus.register({
    name: 'PolicyEngine.onStateChange [stub]',
    priority: PRIORITY.POLICY,
    handle(_event, _ctx) {
      // no-op until V3-10E
    },
  })

  // ── P60: Recommendation ────────────────────────────────────────────────────
  // Signals to UI that recommendations should be refreshed.
  bus.register({
    name: 'RecommendationEngine.refresh',
    priority: PRIORITY.RECOMMENDATION,
    handle(event: ResultEvent, ctx: HandlerContext) {
      const userId = userEngine.getUserId()
      if (!userId) return

      const user = userEngine.getUser()!
      const completedSlugs = userEngine.getCompletedSlugs()
      const journeyStates  = userEngine.getAllJourneyStates()

      const recCtx = {
        user_id:                  user.id,
        user_type:                user.type,
        subscription_tier:        'free' as const,
        current_slug:             event.slug,
        completed_slugs:          completedSlugs,
        journey_states:           journeyStates.map(js => ({
          journey_id:       js.journey_id,
          completed_count:  js.completed_count,
          total_steps:      js.total_steps,
          progress_percent: js.progress_percent,
          ai_readiness:     js.ai_readiness,
          unlocked_rewards: [...js.unlocked_rewards],
          last_active_at:   js.last_active_at,
          is_complete:      js.is_complete,
        })),
        result_count:             user.result_history.length,
        last_active_at:           user.last_active_at,
        registration_trigger_score: 0,
        current_timestamp:        new Date().toISOString(),
      }

      const result = recommendationEngine.recommend(recCtx, 'en')

      ctx.emit({
        type:      'platform:recommendation_updated',
        eventId:   `${event.eventId}:recommendation`,
        userId,
        topSlug:   result.primary.instrument_slug,
        timestamp: Date.now(),
      })
    },
  })

  // ── P70: Journey already handled inside UserEngine.storeResult() ───────────

  // ── P80: Analytics (async fire-and-forget) ─────────────────────────────────
  bus.register({
    name: 'AnalyticsEngine.track',
    priority: PRIORITY.ANALYTICS,
    async: true,
    handle(event: ResultEvent, _ctx: HandlerContext) {
      if (typeof window === 'undefined') return
      // GA4
      if ('gtag' in window) {
        (window as { gtag: Function }).gtag('event', 'instrument_result', {
          instrument_slug: event.slug,
          result_value:    event.value,
          result_label:    event.label,
        })
      }
    },
  })

  return { bus, userEngine, profileEngine, recommendationEngine, assessmentEngine }
}

// ── Browser Singleton ─────────────────────────────────────────────────────────
// One runtime per browser session. Import this in components.
let _browserRuntime: PlatformRuntime | null = null

export function getBrowserRuntime(): PlatformRuntime {
  if (typeof window === 'undefined') {
    // SSR — return a fresh memory-backed runtime (no-op, not persisted)
    return createPlatformRuntime({ storage: new MemoryProvider() })
  }

  if (!_browserRuntime) {
    _browserRuntime = createPlatformRuntime()
    _browserRuntime.bus.connectToBrowser()
  }

  return _browserRuntime
}
