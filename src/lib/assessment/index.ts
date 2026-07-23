// ── Public API — Universal Assessment Engine ───────────────────────────────────

export type {
  AssessmentConfig,
  AssessmentResult,
  AssessmentNarrative,
  AssessmentAIContext,
  ClusterCard,
  GateResult,
  Insight,
  InsightType,
  DimensionScore,
  IntentCluster,
  AssessmentConfidence,
  RecommendationBoost,
  QuestionAnswers,
  ScoringRule,
  InsightCondition,
  ResolvedSignals,
  ScoreTier,
} from './types'

export { weightAssessmentConfig } from './configs/weight'
export { sleepAssessmentConfig }  from './configs/sleep'
export { getAssessmentEngine, AssessmentEngine } from './engine'
export { buildResolvedSignals } from './profile-reader'
export { resolveString } from './strings'

import type { AssessmentConfig } from './types'
import { weightAssessmentConfig } from './configs/weight'
import { sleepAssessmentConfig }  from './configs/sleep'

export const ASSESSMENT_REGISTRY: Readonly<Record<string, AssessmentConfig>> = {
  weight: weightAssessmentConfig,
  sleep:  sleepAssessmentConfig,
}

export function getAssessmentConfig(cluster: string): AssessmentConfig | null {
  return ASSESSMENT_REGISTRY[cluster] ?? null
}
