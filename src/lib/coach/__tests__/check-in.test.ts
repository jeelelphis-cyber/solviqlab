import { describe, it, expect } from 'vitest'
import { handlePlanCheckIn } from '../handlers/check-in'
import type { IntentState } from '../../domain/intent-state'
import type { ActivePlan, CheckIn, Milestone } from '../../domain/active-plan'

function makeCheckIn(overrides: Partial<CheckIn> = {}): CheckIn {
  return {
    check_in_id:       `ci-${Math.random()}`,
    plan_id:           'plan-1',
    week:              1,
    actual_value:      79,
    subjective_score:  8,
    notes:             null,
    on_track:          true,
    deviation_percent: 2,
    recorded_at:       new Date().toISOString(),
    ...overrides,
  }
}

function makeMilestone(week: number, is_completed = false): Milestone {
  return {
    milestone_id: `ms-${week}`,
    plan_id:      'plan-1',
    week,
    target_value: 78,
    description:  `Week ${week}`,
    is_completed,
    completed_at: is_completed ? new Date().toISOString() : null,
    actual_value: null,
  }
}

function makeIntent(
  checkIns: readonly CheckIn[],
  milestones: readonly Milestone[] = [],
): IntentState {
  const plan: ActivePlan = {
    plan_id:          'plan-1',
    cluster:          'weight',
    strategy_id:      'balanced',
    assessment_id:    'a1',
    goal:             'Lose 8kg',
    goal_value:       72,
    current_value:    80,
    start_date:       '2026-07-01',
    target_date:      '2026-11-01',
    duration_weeks:   18,
    status:           'active',
    milestones,
    check_ins:        checkIns,
    last_adapted_at:  null,
    created_at:       new Date().toISOString(),
    adaptation_count: 0,
  }
  return {
    userId:                 'u1',
    clusterId:              'weight',
    createdAt:              new Date().toISOString(),
    updatedAt:              new Date().toISOString(),
    completedInstruments:   [],
    latestAssessment:       null,
    latestStrategy:         null,
    activePlan:             plan,
    primaryGoal:            null,
    currentPhase:           'execution',
    lastActiveAt:           new Date().toISOString(),
    recommendationDecision: null,
  }
}

describe('handlePlanCheckIn', () => {
  it('returns null when no active plan', () => {
    const intent = { ...makeIntent([]), activePlan: null }
    expect(handlePlanCheckIn(intent)).toBeNull()
  })

  it('returns null when no check-ins yet', () => {
    const intent = makeIntent([])
    expect(handlePlanCheckIn(intent)).toBeNull()
  })

  it('returns on_track when last check-in is on track', () => {
    const intent = makeIntent([makeCheckIn({ week: 1, on_track: true, deviation_percent: 2 })])
    const rec = handlePlanCheckIn(intent)
    expect(rec!.decision.reason).toBe('on_track')
    expect(rec!.decision.trigger).toBe('plan:check_in')
    expect(rec!.type).toBe('insight')
    expect(rec!.priority).toBe('normal')
  })

  it('returns off_track when deviation exceeds threshold', () => {
    const intent = makeIntent([makeCheckIn({ week: 2, on_track: false, deviation_percent: 15 })])
    const rec = handlePlanCheckIn(intent)
    expect(rec!.decision.reason).toBe('off_track')
    expect(rec!.type).toBe('warning')
    expect(rec!.priority).toBe('critical')
  })

  it('returns milestone_approaching when next milestone is within 1 week', () => {
    const checkIn = makeCheckIn({ week: 3, on_track: true, deviation_percent: 2 })
    const ms = makeMilestone(4)  // milestone in 1 week
    const intent = makeIntent([checkIn], [ms])
    const rec = handlePlanCheckIn(intent)
    expect(rec!.decision.reason).toBe('milestone_approaching')
    expect(rec!.type).toBe('preparation')
    expect(rec!.priority).toBe('high')
    expect(rec!.data.milestone_week).toBe(4)
  })

  it('prioritizes milestone_approaching over on_track', () => {
    const checkIn = makeCheckIn({ week: 5, on_track: true, deviation_percent: 1 })
    const ms = makeMilestone(6)
    const intent = makeIntent([checkIn], [ms])
    const rec = handlePlanCheckIn(intent)
    expect(rec!.decision.reason).toBe('milestone_approaching')
  })

  it('counts consecutive on-track weeks in data', () => {
    const checkIns = [
      makeCheckIn({ week: 1, on_track: false, deviation_percent: 12 }),
      makeCheckIn({ week: 2, on_track: true,  deviation_percent: 3 }),
      makeCheckIn({ week: 3, on_track: true,  deviation_percent: 2 }),
    ]
    const intent = makeIntent(checkIns)
    const rec = handlePlanCheckIn(intent)
    expect(rec!.data.on_track_weeks).toBe(2)  // only last 2 consecutive
  })

  it('includes current week in data', () => {
    const intent = makeIntent([makeCheckIn({ week: 5 })])
    const rec = handlePlanCheckIn(intent)
    expect(rec!.data.week).toBe(5)
  })

  it('includes rounded deviation in data', () => {
    const intent = makeIntent([makeCheckIn({ week: 1, on_track: false, deviation_percent: 12.7 })])
    const rec = handlePlanCheckIn(intent)
    expect(rec!.data.deviation).toBe(13)
  })
})
