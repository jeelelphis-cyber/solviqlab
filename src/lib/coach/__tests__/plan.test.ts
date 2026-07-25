import { describe, it, expect } from 'vitest'
import { handlePlanCreated } from '../handlers/plan'
import type { IntentState } from '../../domain/intent-state'
import type { ActivePlan } from '../../domain/active-plan'

function makePlan(overrides: Partial<ActivePlan> = {}): ActivePlan {
  return {
    plan_id:          'plan-test-1',
    cluster:          'weight',
    strategy_id:      'balanced',
    assessment_id:    'assessment-test-1',
    goal:             'Lose 8kg by March 2027',
    goal_value:       72,
    current_value:    80,
    start_date:       '2026-07-23',
    target_date:      '2026-11-23',
    duration_weeks:   18,
    status:           'active',
    milestones:       [],
    check_ins:        [],
    last_adapted_at:  null,
    created_at:       new Date().toISOString(),
    adaptation_count: 0,
    ...overrides,
  }
}

function makeIntent(planOverrides: Partial<ActivePlan> = {}, strategyName?: string): IntentState {
  return {
    userId:                 'user-test',
    clusterId:              'weight',
    createdAt:              new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    completedInstruments:   [],
    latestAssessment:       null,
    latestStrategy:         strategyName ? {
      cluster:                   'weight',
      selected_strategy_id:      'balanced',
      selected_strategy_name:    strategyName,
      available_strategies:      [],
      disqualified_strategies:   [],
      decision_at:               new Date().toISOString(),
    } : null,
    activePlan:             makePlan(planOverrides),
    primaryGoal:            null,
    currentPhase:           'execution',
    lastActiveAt:           new Date().toISOString(),
    recommendationDecision: null,
  }
}

describe('handlePlanCreated', () => {
  it('returns null when no active plan', () => {
    const intent = { ...makeIntent(), activePlan: null }
    expect(handlePlanCreated(intent)).toBeNull()
  })

  it('returns conservative_start when goal is within 5% of current', () => {
    // 80 → 77: 3.75% change = conservative
    const intent = makeIntent({ current_value: 80, goal_value: 77 })
    const rec = handlePlanCreated(intent)
    expect(rec!.decision.reason).toBe('conservative_start')
    expect(rec!.decision.trigger).toBe('plan:created')
  })

  it('returns aggressive_start when goal requires >20% change', () => {
    // 80 → 60: 25% change = aggressive
    const intent = makeIntent({ current_value: 80, goal_value: 60 })
    const rec = handlePlanCreated(intent)
    expect(rec!.decision.reason).toBe('aggressive_start')
    expect(rec!.priority).toBe('high')
  })

  it('returns strategy_match when moderate change and strategy name exists', () => {
    // 80 → 72: 10% — not conservative, not aggressive
    const intent = makeIntent({ current_value: 80, goal_value: 72 }, 'Balanced Approach')
    const rec = handlePlanCreated(intent)
    expect(rec!.decision.reason).toBe('strategy_match')
    expect(rec!.data.strategy).toBe('Balanced Approach')
  })

  it('returns first_plan when moderate change and no strategy name', () => {
    const intent = makeIntent({ current_value: 80, goal_value: 72 })
    const rec = handlePlanCreated(intent)
    expect(rec!.decision.reason).toBe('first_plan')
  })

  it('includes plan data in context', () => {
    const intent = makeIntent({ current_value: 80, goal_value: 72, duration_weeks: 18, goal: 'Lose 8kg' })
    const rec = handlePlanCreated(intent)
    expect(rec!.data.goal_value).toBe(72)
    expect(rec!.data.current_value).toBe(80)
    expect(rec!.data.duration_weeks).toBe(18)
    expect(rec!.data.goal).toBe('Lose 8kg')
    // cluster_label is injected by renderer from coach-i18n, not stored in data
  })

  it('sets type to preparation', () => {
    const intent = makeIntent()
    const rec = handlePlanCreated(intent)
    expect(rec!.type).toBe('preparation')
  })

  it('includes coach_version', () => {
    const intent = makeIntent()
    const rec = handlePlanCreated(intent)
    expect(rec!.coach_version).toBeTruthy()
  })

  it('uses plan_id in recommendation_id', () => {
    const intent = makeIntent({ plan_id: 'plan-xyz' })
    const rec = handlePlanCreated(intent)
    expect(rec!.recommendation_id).toContain('plan-xyz')
  })
})
