// UserGraph → JourneyProjection

import type { UserGraph } from '../../graph/types'

export interface JourneyStep {
  readonly slug:        string
  readonly completedAt: string | null
}

export interface JourneyProjection {
  readonly activeCluster:   string | null
  readonly currentPhase:    string | null
  readonly progress:        number | null
  readonly completedSteps:  readonly string[]
  readonly assessments:     ReadonlyArray<{ clusterId: string; score: number }>
  readonly goals:           ReadonlyArray<{ text: string; status: string }>
  readonly updatedAt:       string
}

export function buildJourneyProjection(graph: UserGraph): JourneyProjection {
  return {
    activeCluster:  graph.journey.activeCluster,
    currentPhase:   graph.journey.currentPhase,
    progress:       graph.journey.progress,
    completedSteps: graph.journey.completedSteps,
    assessments:    graph.assessments.items.map(a => ({
      clusterId: a.clusterId,
      score:     a.score,
    })),
    goals: graph.goals.items
      .filter(g => g.status === 'active')
      .map(g => ({ text: g.text, status: g.status })),
    updatedAt: graph.journey.updatedAt,
  }
}
