// ─────────────────────────────────────────────────────────────────────────────
// AssessmentInterpreter — maps AssessmentResult to a structured GraphUpdateSpec.
//
// Pure function: no side effects, no I/O. The sync-service applies the spec.
// ─────────────────────────────────────────────────────────────────────────────

import type { AssessmentResult, AssessmentConfidence } from './types'
import type { GoalEntry, MemoryFact, MemoryImportance } from '../graph/types'

// ── Output types ──────────────────────────────────────────────────────────────

export type AssessmentPhase = 'awareness' | 'planning' | 'action' | 'maintenance'

export interface GraphUpdateSpec {
  readonly clusterId:          string
  readonly score:              number
  readonly assessmentConfidence: 'preliminary' | 'established' | 'confirmed'
  readonly phase:              AssessmentPhase
  readonly goals:              readonly GoalEntry[]
  readonly memoryFacts:        readonly MemoryFact[]
  readonly communicationStyle: 'direct' | 'supportive' | 'analytical' | null
}

// ── AssessmentInterpreter ─────────────────────────────────────────────────────

export class AssessmentInterpreter {
  interpret(result: AssessmentResult): GraphUpdateSpec | null {
    // Skip if data is too thin to produce a reliable update
    if (result.confidence === 'insufficient') return null

    const phase               = resolvePhase(result.overall_score)
    const assessmentConfidence = resolveConfidence(result.confidence)
    const goals               = buildGoals(result)
    const memoryFacts         = buildMemoryFacts(result)
    const communicationStyle  = resolveCommunicationStyle(result)

    return {
      clusterId: result.cluster,
      score:     result.overall_score,
      assessmentConfidence,
      phase,
      goals,
      memoryFacts,
      communicationStyle,
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolvePhase(score: number): AssessmentPhase {
  if (score >= 80) return 'maintenance'
  if (score >= 60) return 'action'
  if (score >= 40) return 'planning'
  return 'awareness'
}

function resolveConfidence(c: AssessmentConfidence): 'preliminary' | 'established' | 'confirmed' {
  if (c === 'comprehensive') return 'confirmed'
  if (c === 'established')   return 'established'
  return 'preliminary'
}

function buildGoals(result: AssessmentResult): readonly GoalEntry[] {
  // Derive primary goal from top opportunity insight or narrative profile type
  const opportunity = result.insights.find(i => i.type === 'opportunity' && i.priority === 1)
    ?? result.insights.find(i => i.type === 'opportunity')

  const text = opportunity?.title
    ?? result.narrative.profile_type
    ?? result.narrative.cta_label
    ?? `Improve ${result.cluster} health`

  return [{
    id:       `goal:${result.cluster}:${result.assessment_id}`,
    text,
    status:   'active',
    priority: result.overall_score < 60 ? 'high' : 'medium',
    addedAt:  result.completed_at,
  }]
}

function buildMemoryFacts(result: AssessmentResult): readonly MemoryFact[] {
  // Surface warning + achievement insights (priority 1 or 2) as memory facts
  const candidates = result.insights
    .filter(i => i.type === 'warning' || i.type === 'achievement')
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)

  return candidates.map(insight => ({
    id:         `fact:${result.assessment_id}:${insight.id}`,
    text:       insight.body,
    category:   (insight.type === 'warning' ? 'belief' : 'fact') as import('../graph/types').MemoryCategory,
    importance: (insight.priority === 1 ? 'high' : 'medium') as MemoryImportance,
    addedAt:    result.completed_at,
  }))
}

function resolveCommunicationStyle(
  result: AssessmentResult,
): 'direct' | 'supportive' | 'analytical' | null {
  const hasWarnings     = result.insights.some(i => i.type === 'warning' && i.priority === 1)
  const hasAchievements = result.insights.some(i => i.type === 'achievement')

  if (result.overall_score < 40 || hasWarnings) return 'supportive'
  if (result.overall_score >= 80 && hasAchievements) return 'direct'
  return 'analytical'
}
