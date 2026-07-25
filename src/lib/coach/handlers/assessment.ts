import type { IntentState } from '../../domain/intent-state'
import type { CoachRecommendation, CoachReason } from '../types'
import { COACH_VERSION } from '../types'

export function handleAssessmentCompleted(intent: IntentState): CoachRecommendation | null {
  const { latestAssessment } = intent
  if (!latestAssessment) return null

  const score    = latestAssessment.overall_score
  const lowestDim = [...latestAssessment.dimension_scores]
    .sort((a, b) => a.score - b.score)[0] ?? null

  const reason: CoachReason =
    score >= 80            ? 'excellent_score'
    : score >= 60          ? 'good_score'
    : lowestDim            ? 'missing_dimension'
    :                        'low_score'

  const priority =
    reason === 'excellent_score' ? 'high' as const
    : reason === 'low_score'     ? 'critical' as const
    :                              'normal' as const

  return {
    recommendation_id: `assessment:completed:${intent.clusterId}:${latestAssessment.assessment_id}`,
    cluster:      intent.clusterId,
    phase:        intent.currentPhase,
    decision:     { trigger: 'assessment:completed', reason },
    type:         score >= 60 ? 'insight' : 'explanation',
    priority,
    template_id:  reason,
    data: {
      score,
      dimension: lowestDim?.label,
      strategy:  intent.latestStrategy?.selected_strategy_name,
    },
    coach_version: COACH_VERSION,
    generated_at:  new Date().toISOString(),
  }
}
