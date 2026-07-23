import type { PipelineDefinition } from './pipeline'
import type { UserEngine } from '../user/engine'
import type { ProfileEngine } from '../profile/engine'
import type { RecommendationEngine } from '../recommendation/engine'
import type { AssessmentEngine } from '../assessment/index'
import { ASSESSMENT_REGISTRY } from '../assessment/index'
import type { ResultEvent, HandlerContext } from '../events/types'

// ── Platform Pipeline Definition ─────────────────────────────────────────────
// The authoritative declaration of what the platform does after a result arrives.
//
// To add a new capability:
//   1. Add a stage here with the correct priority
//   2. Done. EventBus ordering is derived automatically.
//
// Priority slots (intentional gaps for future stages):
//   P10  — UserEngine (truth store)
//   P20  — ProfileEngine (domain knowledge)
//   P30  — AssessmentEngine (readiness gate)
//   P40  — StrategyEngine (plan selection)    [stub → V3-10G]
//   P50  — PolicyEngine (guard rails)         [stub → V3-10G]
//   P60  — RecommendationEngine (next action)
//   P70  — JourneyEngine (handled inside UserEngine)
//   P80  — AnalyticsEngine (fire-and-forget)

export interface PlatformEngines {
  readonly userEngine: UserEngine
  readonly profileEngine: ProfileEngine
  readonly recommendationEngine: RecommendationEngine
  readonly assessmentEngine: AssessmentEngine
}

export function createPlatformPipeline(engines: PlatformEngines): PipelineDefinition {
  const { userEngine, profileEngine, recommendationEngine, assessmentEngine } = engines

  return {
    name:    'SolviqLabPlatform',
    version: '1.0.0',
    stages: [
      // ── P10: UserEngine ─────────────────────────────────────────────────────
      {
        name:        'UserEngine.storeResult',
        priority:    10,
        description: 'Stores the result record, updates completed_slugs, rebuilds journey states.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
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
      },

      // ── P20: ProfileEngine ──────────────────────────────────────────────────
      {
        name:        'ProfileEngine.processResult',
        priority:    20,
        description: 'Extracts HealthSignals from the result, updates domain confidence.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
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
      },

      // ── P30: AssessmentEngine ───────────────────────────────────────────────
      {
        name:        'AssessmentEngine.checkTrigger',
        priority:    30,
        description: 'Checks if completing this instrument unlocks an Assessment.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
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
      },

      // ── P40: StrategyEngine (stub) ──────────────────────────────────────────
      {
        name:        'StrategyEngine.checkTrigger [stub]',
        priority:    40,
        description: 'Selects strategy after assessment completes. Implemented in V3-10G.',
        build: () => (_event, _ctx) => { /* no-op until V3-10G */ },
      },

      // ── P50: PolicyEngine (stub) ────────────────────────────────────────────
      {
        name:        'PolicyEngine.onStateChange [stub]',
        priority:    50,
        description: 'Applies guard rails and rate limits. Implemented in V3-10G.',
        build: () => (_event, _ctx) => { /* no-op until V3-10G */ },
      },

      // ── P60: RecommendationEngine ───────────────────────────────────────────
      {
        name:        'RecommendationEngine.refresh',
        priority:    60,
        description: 'Computes next action and stores RecommendationDecision (P-17).',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
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

          // P-16 + P-17: store full RecommendationDecision (slug + score + reasons + alternatives)
          userEngine.setRecommendationDecision(result.decision)

          ctx.emit({
            type:      'platform:recommendation_updated',
            eventId:   `${event.eventId}:recommendation`,
            userId,
            topSlug:   result.primary.instrument_slug,
            timestamp: Date.now(),
          })
        },
      },

      // ── P80: AnalyticsEngine (async fire-and-forget) ────────────────────────
      {
        name:        'AnalyticsEngine.track',
        priority:    80,
        description: 'GA4 tracking — fire-and-forget. Never blocks the pipeline.',
        async:       true,
        build: () => async (event: ResultEvent) => {
          if (typeof window === 'undefined') return
          if ('gtag' in window) {
            (window as { gtag: Function }).gtag('event', 'instrument_result', {
              instrument_slug: event.slug,
              result_value:    event.value,
              result_label:    event.label,
            })
          }
        },
      },
    ],
  }
}
