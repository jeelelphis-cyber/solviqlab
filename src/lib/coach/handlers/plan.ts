import type { IntentState } from '../../domain/intent-state'
import type { CoachRecommendation, CoachReason } from '../types'
import { COACH_VERSION } from '../types'

// Conservative: goal within 5% of current; Aggressive: >20% change required
function getChangePercent(current: number, goal: number): number {
  if (current === 0) return 0
  return Math.abs((current - goal) / current) * 100
}

export function handlePlanCreated(intent: IntentState): CoachRecommendation | null {
  const { activePlan: plan, latestAssessment: assessment, latestStrategy: strategy } = intent
  if (!plan) return null

  const changePct = getChangePercent(plan.current_value, plan.goal_value)

  const reason: CoachReason =
    changePct <= 5                             ? 'conservative_start'
    : changePct > 20                           ? 'aggressive_start'
    : assessment?.confidence === 'established' ||
      assessment?.confidence === 'comprehensive' ? 'high_confidence_plan'
    : strategy?.selected_strategy_name         ? 'strategy_match'
    :                                            'first_plan'

  const priority =
    reason === 'aggressive_start'  ? 'high' as const
    : reason === 'conservative_start' ? 'normal' as const
    :                                   'normal' as const

  return {
    recommendation_id: `plan:created:${intent.clusterId}:${plan.plan_id}`,
    cluster:      intent.clusterId,
    phase:        intent.currentPhase,
    decision:     { trigger: 'plan:created', reason },
    type:         'preparation',
    priority,
    template_id:  reason,
    data: {
      strategy:       strategy?.selected_strategy_name,
      goal:           plan.goal,
      goal_value:     plan.goal_value,
      current_value:  plan.current_value,
      duration_weeks: plan.duration_weeks,
    },
    coach_version: COACH_VERSION,
    generated_at:  new Date().toISOString(),
  }
}
