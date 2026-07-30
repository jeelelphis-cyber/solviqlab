import type { PipelineDefinition } from './pipeline'
import type { UserEngine } from '../user/engine'
import type { ProfileEngine } from '../profile/engine'
import type { RecommendationEngine } from '../recommendation/engine'
import type { AssessmentEngine } from '../assessment/index'
import { ASSESSMENT_REGISTRY } from '../assessment/index'
import { StrategyEngine } from '../strategy/engine'
import { PolicyEngine } from '../policy/engine'
import { PlannerEngine } from '../planner/engine'
import type { ResultEvent, HandlerContext } from '../events/types'
import type { AssessmentGraphSync } from '../graph/sync-service'
import { GraphRepository } from '../graph/repository'
import { GraphUpdater } from '../graph/updater'
import { LocalStorageProvider } from '../user/storage'
import { GraphGateway } from '../intelligence/graph-gateway'

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
  readonly graphSync: AssessmentGraphSync
  readonly graphRepo: GraphRepository
}

// Assessment slugs that signal completion of an assessment (trigger Strategy + Planner)
import { ASSESSMENT_SLUGS } from '../domain/intent-state'

export function createPlatformPipeline(engines: PlatformEngines): PipelineDefinition {
  const { userEngine, profileEngine, recommendationEngine, assessmentEngine, graphSync, graphRepo } = engines
  const strategyEngine = new StrategyEngine()
  const policyEngine   = new PolicyEngine()
  const plannerEngine  = new PlannerEngine()

  return {
    name:    'SolviqLabPlatform',
    version: '1.0.0',
    stages: [
      // ── P10: UserEngine + UserGraph ──────────────────────────────────────────
      {
        name:        'UserEngine.storeResult',
        priority:    10,
        description: 'Stores result in UserEngine and writes completedStep to UserGraph (SSoT).',
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

          // Sprint 4B: write completedStep to UserGraph — GraphGateway becomes SSoT
          const graph = graphRepo.get(user.id)
          if (graph) {
            graphRepo.save({
              ...graph,
              journey: {
                ...graph.journey,
                completedSteps: [...new Set([...graph.journey.completedSteps, event.slug])],
                updatedAt:      new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            })
          }

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

      // ── P25: CalculatorGraphSync ────────────────────────────────────────────
      // Reads miaFact from ResultEvent and stores in UserGraph.coachMemory.
      // Works for ALL calculators — each calculator sets its own miaFact.
      // Standard: calculator sets miaFact → P25 stores it → Mia uses it.
      {
        name:        'CalculatorGraphSync.storeMiaFact',
        priority:    25,
        description: 'Stores miaFact from any calculator into UserGraph coachMemory for Mia personalization.',
        build: () => (event: ResultEvent) => {
          if (typeof window === 'undefined') return
          if (!event.miaFact) return
          const userId = userEngine.getUserId()
          if (!userId) return

          const repo    = new GraphRepository(new LocalStorageProvider())
          const updater = new GraphUpdater(repo)

          updater.addMemoryFact(userId, {
            id:         `fact-${event.slug}`,
            text:       event.miaFact,
            category:   'fact',
            importance: 'high',
            addedAt:    new Date().toISOString(),
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

      // ── P35: GraphSync.onAssessment ─────────────────────────────────────────
      // Fires when an assessment result arrives in event.metadata.
      // Updates UserGraph before Strategy + Planner see the new state.
      {
        name:        'GraphSync.onAssessment',
        priority:    35,
        description: 'Syncs AssessmentResult into UserGraph: assessment, journey, goals, coach memory.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
          if (!ASSESSMENT_SLUGS.has(event.slug)) return

          const userId = userEngine.getUserId()
          if (!userId) return

          const assessmentResult = event.metadata as unknown as import('../assessment/types').AssessmentResult | null
          if (!assessmentResult?.overall_score === undefined) return

          const syncResult = graphSync.sync(userId, assessmentResult!)

          if (syncResult.updated) {
            ctx.emit({
              type:               'platform:assessment_completed',
              eventId:            `${event.eventId}:graph`,
              userId,
              cluster:            assessmentResult!.cluster,
              score:              assessmentResult!.overall_score,
              confidence:         assessmentResult!.confidence,
              phase:              syncResult.changedFields.includes('journey')
                                    ? (assessmentResult!.overall_score >= 80 ? 'maintenance'
                                      : assessmentResult!.overall_score >= 60 ? 'action'
                                      : assessmentResult!.overall_score >= 40 ? 'planning'
                                      : 'awareness')
                                    : 'awareness',
              graphUpdatedFields: syncResult.changedFields,
              timestamp:          Date.now(),
            })
          }
        },
      },

      // ── P40: StrategyEngine ─────────────────────────────────────────────────
      // Fires when an assessment instrument is completed.
      // Selects optimal strategy and stores StrategyDecision.
      {
        name:        'StrategyEngine.evaluate',
        priority:    40,
        description: 'Evaluates available strategies after assessment completion. Stores StrategyDecision.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
          if (!ASSESSMENT_SLUGS.has(event.slug)) return

          const userId = userEngine.getUserId()
          if (!userId) return

          const user    = userEngine.getUser()!
          const profile = profileEngine.getOrCreateProfile(userId)

          // Determine cluster from assessment slug
          const cluster = event.slug.replace('-assessment', '') as import('../assessment/types').IntentCluster

          // H-3: Persist full AssessmentResult (metadata carries the object from AssessmentClient)
          const assessmentResult = event.metadata as unknown as import('../assessment/types').AssessmentResult | null
          if (assessmentResult?.overall_score !== undefined) {
            userEngine.setAssessmentResult(cluster, assessmentResult)
          }

          const decision = strategyEngine.evaluate({
            userId,
            cluster,
            assessmentId:      event.eventId,
            assessmentScore:   event.value ?? 0,
            profileConfidence: profile.overall_confidence,
            currentValue:      extractCurrentMetric(user, cluster),
            goalValue:         null,  // user will input in PlannerClient
          })

          userEngine.setStrategyDecision(decision)

          ctx.emit({
            type:      'platform:intent_state_updated',
            eventId:   `${event.eventId}:strategy`,
            userId,
            clusterId: cluster,
            changedFields: ['latestStrategy'],
            timestamp: Date.now(),
          })
        },
      },

      // ── P45: PlannerEngine.build ────────────────────────────────────────────
      // Fires after StrategyEngine when assessment is completed.
      // Auto-builds AdaptivePlan from StrategyDecision.
      // Note: goalValue requires user input — plan is in 'pending_goal' state until provided.
      {
        name:        'PlannerEngine.build',
        priority:    45,
        description: 'Auto-builds AdaptivePlan after assessment + strategy. Stores to IntentState.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
          if (!ASSESSMENT_SLUGS.has(event.slug)) return

          const userId = userEngine.getUserId()
          if (!userId) return

          const user             = userEngine.getUser()!
          const strategyDecision = userEngine.getStrategyDecision()
          if (!strategyDecision) return

          // Skip if plan already exists for this cluster (user in execution phase)
          const existingPlan = userEngine.getActivePlan()
          if (existingPlan?.cluster === strategyDecision.cluster) return

          const cluster      = strategyDecision.cluster
          const currentValue = extractCurrentMetric(user, cluster)
          // goalValue: null until user sets it in PlannerClient
          // Use a default heuristic (target BMI 22 weight) as a placeholder
          const goalValue = computeDefaultGoal(currentValue, cluster)

          const plan = plannerEngine.build({
            userId,
            cluster,
            assessmentId:    strategyDecision.assessment_id,
            strategyId:      strategyDecision.selected_strategy_id,
            strategyName:    strategyDecision.selected_strategy_name,
            currentValue,
            goalValue,
            unit:            clusterUnit(cluster),
            startedAt:       new Date().toISOString(),
          })

          userEngine.setActivePlan(plan)

          ctx.emit({
            type:      'platform:intent_state_updated',
            eventId:   `${event.eventId}:plan`,
            userId,
            clusterId: cluster,
            changedFields: ['activePlan'],
            timestamp: Date.now(),
          })
        },
      },

      // ── P46: PlannerEngine.setGoal ──────────────────────────────────────────
      // Fires when UI dispatches slug 'planner:goal_set' (replaces direct engine call).
      // H-2: UI never imports PlannerEngine — it dispatches an event.
      {
        name:        'PlannerEngine.setGoal',
        priority:    46,
        description: 'Builds or rebuilds AdaptivePlan with the user-provided goal value.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
          if (event.slug !== 'planner:goal_set') return

          const userId = userEngine.getUserId()
          if (!userId) return

          const strategyDecision = userEngine.getStrategyDecision()
          if (!strategyDecision) return

          const user         = userEngine.getUser()!
          const cluster      = strategyDecision.cluster
          const goalValue    = (event.metadata.goalValue as number) ?? event.value ?? 0
          const currentValue = extractCurrentMetric(user, cluster)

          const plan = plannerEngine.build({
            userId,
            cluster,
            assessmentId:  strategyDecision.assessment_id,
            strategyId:    strategyDecision.selected_strategy_id,
            strategyName:  strategyDecision.selected_strategy_name,
            currentValue,
            goalValue,
            unit:          clusterUnit(cluster),
            startedAt:     new Date().toISOString(),
          })

          userEngine.setActivePlan(plan)

          ctx.emit({
            type:          'platform:intent_state_updated',
            eventId:       `${event.eventId}:goal_set`,
            userId,
            clusterId:     cluster,
            changedFields: ['activePlan'],
            timestamp:     Date.now(),
          })
        },
      },

      // ── P47: PlannerEngine.checkIn ──────────────────────────────────────────
      // Fires when UI dispatches slug 'planner:check_in' (replaces direct engine call).
      // H-2: UI never imports PlannerEngine — it dispatches an event.
      {
        name:        'PlannerEngine.checkIn',
        priority:    47,
        description: 'Adapts the active plan from a check-in. Replaces plan in UserEngine.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
          if (event.slug !== 'planner:check_in') return

          const userId = userEngine.getUserId()
          if (!userId) return

          const plan = userEngine.getActivePlan()
          if (!plan) return

          const meta = event.metadata as {
            week: number
            actual_value: number
            subjective_score: number
            notes: string | null
          }

          const { plan: adapted } = plannerEngine.adapt(plan, {
            week:             meta.week,
            actual_value:     meta.actual_value,
            subjective_score: meta.subjective_score,
            notes:            meta.notes,
          })

          userEngine.setActivePlan(adapted)

          ctx.emit({
            type:          'platform:intent_state_updated',
            eventId:       `${event.eventId}:check_in`,
            userId,
            clusterId:     plan.cluster,
            changedFields: ['activePlan'],
            timestamp:     Date.now(),
          })
        },
      },

      // ── P50: PolicyEngine ───────────────────────────────────────────────────
      {
        name:        'PolicyEngine.check',
        priority:    50,
        description: 'Applies guard rails: registration gate, rate limits, health risk flags.',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
          if (!ASSESSMENT_SLUGS.has(event.slug)) return

          const userId = userEngine.getUserId()
          if (!userId) return

          const user   = userEngine.getUser()!
          const result = policyEngine.check({
            cluster:          (event.slug.replace('-assessment', '')) as import('../assessment/types').IntentCluster,
            userType:         user.type,
            subscriptionTier: 'free',
            existingPlanCount: userEngine.getActivePlan() ? 1 : 0,
            assessmentScore:  event.value ?? 0,
          })

          if (!result.allowed) {
            // Policy blocks plan creation — emit a state update so UI can show gate
            ctx.emit({
              type:          'platform:intent_state_updated',
              eventId:       `${event.eventId}:policy_blocked`,
              userId,
              clusterId:     null,
              changedFields: ['policyViolations'],
              timestamp:     Date.now(),
            })
          }
        },
      },

      // ── P60: RecommendationEngine ───────────────────────────────────────────
      {
        name:        'RecommendationEngine.refresh',
        priority:    60,
        description: 'Computes next action and stores RecommendationDecision (P-17).',
        build: () => (event: ResultEvent, ctx: HandlerContext) => {
          const userId = userEngine.getUserId()
          if (!userId) return

          const graph   = graphRepo.get(userId) ?? graphRepo.getOrCreate(userId)
          const gateway = new GraphGateway(graph)
          const recCtx  = gateway.recommendation(event.slug)
          const result  = recommendationEngine.recommend(recCtx, 'en')

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractCurrentMetric(
  user: import('../user/types').SolviqUser,
  cluster: import('../assessment/types').IntentCluster,
): number {
  // Find the most recent result for the primary metric of this cluster
  const primarySlugs: Record<string, string[]> = {
    weight: ['bmi-calculator', 'body-fat-calculator'],
    sleep:  ['sleep-calculator', 'sleep-assessment'],
  }

  const slugs = primarySlugs[cluster] ?? []
  for (const slug of slugs) {
    const result = [...user.result_history]
      .reverse()
      .find(r => r.instrument_slug === slug && r.result_value !== null)
    if (result?.result_value !== null && result?.result_value !== undefined) {
      return result.result_value as number
    }
  }
  return 0
}

function computeDefaultGoal(currentValue: number, cluster: string): number {
  if (cluster === 'weight') {
    // Target: lose 10% of current weight as a reasonable default
    return Math.round(currentValue * 0.9 * 10) / 10
  }
  return currentValue
}

function clusterUnit(cluster: string): string {
  const units: Record<string, string> = {
    weight: 'kg',
    sleep:  'hours',
    finance: 'saved',
  }
  return units[cluster] ?? 'units'
}
