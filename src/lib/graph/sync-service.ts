// ─────────────────────────────────────────────────────────────────────────────
// AssessmentGraphSync — applies a GraphUpdateSpec to UserGraph via GraphUpdater.
//
// Called by the P35 pipeline stage after an assessment result arrives.
// Single responsibility: translate interpreter output into atomic graph writes.
// ─────────────────────────────────────────────────────────────────────────────

import type { AssessmentResult } from '../assessment/types'
import { AssessmentInterpreter } from '../assessment/interpreter'
import type { GraphUpdater } from './updater'

export interface GraphSyncResult {
  readonly updated:       boolean
  readonly clusterId:     string | null
  readonly changedFields: readonly string[]
  readonly skippedReason: string | null
}

export class AssessmentGraphSync {
  private readonly interpreter = new AssessmentInterpreter()

  constructor(private readonly updater: GraphUpdater) {}

  sync(userId: string, result: AssessmentResult): GraphSyncResult {
    const spec = this.interpreter.interpret(result)

    if (!spec) {
      return { updated: false, clusterId: result.cluster, changedFields: [], skippedReason: 'insufficient_data' }
    }

    const changed: string[] = []

    // ── Assessment node ───────────────────────────────────────────────────────
    this.updater.upsertAssessment(userId, {
      clusterId:   spec.clusterId,
      score:       spec.score,
      confidence:  spec.assessmentConfidence,
      assessedAt:  result.completed_at,
    })
    changed.push('assessments')

    // ── Journey ───────────────────────────────────────────────────────────────
    this.updater.updateJourney(userId, {
      activeCluster: spec.clusterId,
      currentPhase:  spec.phase,
      progress:      0,
    })
    changed.push('journey')

    // ── Goals ─────────────────────────────────────────────────────────────────
    for (const goal of spec.goals) {
      this.updater.upsertGoal(userId, goal)
    }
    if (spec.goals.length > 0) changed.push('goals')

    // ── Coach Memory — facts ──────────────────────────────────────────────────
    for (const fact of spec.memoryFacts) {
      this.updater.addMemoryFact(userId, fact)
    }
    if (spec.memoryFacts.length > 0) changed.push('coachMemory.facts')

    // ── Coach Memory — communication style ────────────────────────────────────
    if (spec.communicationStyle) {
      this.updater.setCommunicationStyle(userId, spec.communicationStyle)
      changed.push('coachMemory.communicationStyle')
    }

    return {
      updated:       true,
      clusterId:     spec.clusterId,
      changedFields: changed,
      skippedReason: null,
    }
  }
}
