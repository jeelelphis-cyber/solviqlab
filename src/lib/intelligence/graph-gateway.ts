// ─────────────────────────────────────────────────────────────────────────────
// GraphGateway — единственная точка чтения UserGraph для Intelligence Layer.
//
// Правило: ни один компонент, engine или builder не импортирует UserEngine
// напрямую. Все intelligence-reads идут через GraphGateway.
//
// Sprint 4A: .getCompletedSteps() временно делегирует в UserEngine (Legacy).
// Sprint 4B: Legacy удаляется, completedSteps читается из UserGraph.journey.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserGraph, QuizResultEntry, QuizResultsNode } from '../graph/types'
import type { UserEngine } from '../user/engine'
import type { RecommendationContext } from '../recommendation/types'
import type { AIContext } from './ai-context-builder'
import type { JourneyProjection } from './graph-projections/journey'
import type { AnalyticsProjection } from './graph-projections/analytics'
import { buildRecommendationProjection } from './graph-projections/recommendation'
import { buildJourneyProjection }        from './graph-projections/journey'
import { buildAnalyticsProjection }      from './graph-projections/analytics'
import { buildAIContext }                from './ai-context-builder'
import type { SubscriptionInfo }         from './ai-context-builder'

export class GraphGateway {
  constructor(
    private readonly graph: UserGraph,
    // Legacy: removed in Sprint 4B when completedSteps migrates to UserGraph
    private readonly legacyEngine: UserEngine | null = null,
  ) {}

  // ── Projections ───────────────────────────────────────────────────────────

  recommendation(currentSlug: string): RecommendationContext {
    const completedSlugs = this.getCompletedSteps()
    return buildRecommendationProjection(this.graph, currentSlug, completedSlugs)
  }

  journey(): JourneyProjection {
    return buildJourneyProjection(this.graph)
  }

  analytics(): AnalyticsProjection {
    return buildAnalyticsProjection(this.graph)
  }

  aiContext(subscription: SubscriptionInfo, recentEventNames: readonly string[] = []): AIContext {
    return buildAIContext(this.graph, subscription, recentEventNames)
  }

  // ── Legacy bridge (Sprint 4A only) ───────────────────────────────────────
  // Returns completedSteps from UserGraph when available, falls back to UserEngine.
  // Sprint 4B: remove legacyEngine fallback entirely.

  getCompletedSteps(): readonly string[] {
    const fromGraph = this.graph.journey.completedSteps
    if (fromGraph.length > 0) return fromGraph
    return this.legacyEngine?.getCompletedSlugs() ?? []
  }
}

// ── Merge strategy (two devices / offline→online) ─────────────────────────────

/**
 * Field-level Last-Write-Wins merge by node.updatedAt.
 * Arrays: union + deduplicate by id. completedSteps: always union.
 */
export function mergeGraphs(local: UserGraph, remote: UserGraph): UserGraph {
  function newer<T extends { updatedAt: string }>(a: T, b: T): T {
    return a.updatedAt >= b.updatedAt ? a : b
  }

  function mergeArrayById<T extends { id: string }>(a: readonly T[], b: readonly T[]): T[] {
    const map = new Map<string, T>()
    ;[...a, ...b].forEach(item => map.set(item.id, item))
    return Array.from(map.values())
  }

  return {
    ...local,
    identity:  newer(local.identity,  remote.identity),
    goals: {
      ...newer(local.goals, remote.goals),
      items: mergeArrayById(local.goals.items, remote.goals.items),
    },
    habits: {
      ...newer(local.habits, remote.habits),
      items: mergeArrayById(local.habits.items, remote.habits.items),
    },
    assessments: {
      ...newer(local.assessments, remote.assessments),
      items: mergeArrayById(
        local.assessments.items.map(a => ({ ...a, id: a.clusterId })),
        remote.assessments.items.map(a => ({ ...a, id: a.clusterId })),
      ).map(({ id: _id, ...rest }) => rest) as typeof local.assessments.items,
    },
    journey: {
      ...newer(local.journey, remote.journey),
      // completedSteps: always union, never shrink
      completedSteps: [...new Set([...local.journey.completedSteps, ...remote.journey.completedSteps])],
    },
    coachMemory: {
      ...newer(local.coachMemory, remote.coachMemory),
      facts: mergeArrayById(local.coachMemory.facts, remote.coachMemory.facts),
    },
    preferences:  newer(local.preferences,  remote.preferences),
    retention:    newer(local.retention,     remote.retention),
    premium:      newer(local.premium,       remote.premium),
    dailyHistory: newer(local.dailyHistory,  remote.dailyHistory),
    quizResults: (() => {
      const empty: QuizResultsNode = { updatedAt: '', confidence: 'inferred', items: [] }
      const lq: QuizResultsNode = local.quizResults  ?? empty
      const rq: QuizResultsNode = remote.quizResults ?? empty
      const base = newer(lq, rq)
      const merged = mergeArrayById<QuizResultEntry & { id: string }>(
        lq.items.map((q: QuizResultEntry) => ({ ...q, id: q.slug })),
        rq.items.map((q: QuizResultEntry) => ({ ...q, id: q.slug })),
      ).map(({ id: _id, ...rest }) => rest as QuizResultEntry)
      return { ...base, items: merged }
    })(),
    updatedAt: local.updatedAt >= remote.updatedAt ? local.updatedAt : remote.updatedAt,
  }
}
