// UserGraph → AnalyticsProjection

import type { UserGraph } from '../../graph/types'

export interface AnalyticsProjection {
  readonly userId:           string | null
  readonly tier:             string
  readonly goalsCount:       number
  readonly activeGoals:      number
  readonly assessmentsCount: number
  readonly completedSteps:   number
  readonly dormancyLevel:    string
  readonly daysSinceActive:  number
  readonly hasCoachMemory:   boolean
  readonly language:         string
  readonly updatedAt:        string
}

export function buildAnalyticsProjection(graph: UserGraph): AnalyticsProjection {
  return {
    userId:           graph.userId,
    tier:             graph.premium.tier,
    goalsCount:       graph.goals.items.length,
    activeGoals:      graph.goals.items.filter(g => g.status === 'active').length,
    assessmentsCount: graph.assessments.items.length,
    completedSteps:   graph.journey.completedSteps.length,
    dormancyLevel:    graph.retention.dormancyLevel,
    daysSinceActive:  graph.retention.daysSinceActive,
    hasCoachMemory:   graph.coachMemory.facts.length > 0,
    language:         graph.identity.language,
    updatedAt:        graph.updatedAt,
  }
}
