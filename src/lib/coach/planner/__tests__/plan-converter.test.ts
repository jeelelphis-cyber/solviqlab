// ─────────────────────────────────────────────────────────────────────────────
// plan-converter — unit tests
//
// Pure function tests — no side effects, no mocks needed.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'

import type { ActivePlan, Milestone } from '../../../domain/active-plan'
import type { CoachGoal, CoachPlan, CoachPlanId, CoachGoalId, CoachPersonaId } from '../../domain/types'
import {
  adaptivePlanToCoachPlan,
  milestoneToCoachTask,
  planToSummary,
} from '../plan-converter'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    milestone_id: 'ms-1',
    plan_id:      'plan-1',
    week:         4,
    target_value: 83.0,
    description:  'Week 4: reach 83.0 kg',
    is_completed: false,
    completed_at: null,
    actual_value: null,
    ...overrides,
  }
}

function makeActivePlan(overrides: Partial<ActivePlan> = {}): ActivePlan {
  return {
    plan_id:          'plan-1',
    cluster:          'weight',
    strategy_id:      'balanced',
    assessment_id:    'assess-1',
    goal:             'Reach 74 kg by January 2027',
    goal_value:       74,
    current_value:    85,
    start_date:       '2026-07-01',
    target_date:      '2026-12-31',
    duration_weeks:   22,
    status:           'active',
    milestones:       [makeMilestone()],
    check_ins:        [],
    last_adapted_at:  null,
    created_at:       '2026-07-01T00:00:00.000Z',
    adaptation_count: 0,
    ...overrides,
  }
}

function makeCoachGoal(overrides: Partial<CoachGoal> = {}): CoachGoal {
  return {
    id:              'goal-1' as unknown as CoachGoalId,
    userId:          'user-1',
    planId:          'plan-1' as unknown as CoachPlanId,
    description:     'Lose weight to 74kg',
    primaryMetric:   'weight_kg',
    targetValue:     74,
    currentValue:    85,
    unit:            'kg',
    status:          'active',
    progressPercent: 0,
    startedAt:       '2026-07-01T00:00:00.000Z',
    targetDate:      '2026-12-31T00:00:00.000Z',
    achievedAt:      null,
    ...overrides,
  }
}

const PERSONA_ID = 'mia' as unknown as CoachPersonaId

// ── milestoneToCoachTask ──────────────────────────────────────────────────────

describe('milestoneToCoachTask', () => {
  it('converts a milestone to a CoachTask correctly', () => {
    const milestone = makeMilestone()
    const planId    = 'plan-1' as unknown as CoachPlanId

    const task = milestoneToCoachTask(milestone, planId, '2026-07-01')

    expect(task.id).toBe('ms-1')
    expect(task.planId).toBe('plan-1')
    expect(task.description).toBe('Week 4: reach 83.0 kg')
    expect(task.category).toBe('movement')
    expect(task.estimatedMinutes).toBe(20)
    expect(task.status).toBe('assigned')
    expect(task.completedAt).toBeNull()
  })

  it('marks task as completed when milestone is_completed = true', () => {
    const milestone = makeMilestone({
      is_completed: true,
      completed_at: '2026-07-28T10:00:00.000Z',
    })
    const planId = 'plan-1' as unknown as CoachPlanId

    const task = milestoneToCoachTask(milestone, planId, '2026-07-01')

    expect(task.status).toBe('completed')
    expect(task.completedAt).toBe('2026-07-28T10:00:00.000Z')
  })

  it('projects the correct date: start + week * 7 days', () => {
    const milestone = makeMilestone({ week: 2 })
    const planId    = 'plan-1' as unknown as CoachPlanId

    const task = milestoneToCoachTask(milestone, planId, '2026-07-01')

    // Week 2 from 2026-07-01 = 2026-07-15
    expect(task.date).toBe('2026-07-15')
  })

  it('accepts a custom category', () => {
    const milestone = makeMilestone()
    const planId    = 'plan-1' as unknown as CoachPlanId

    const task = milestoneToCoachTask(milestone, planId, '2026-07-01', 'nutrition')

    expect(task.category).toBe('nutrition')
  })
})

// ── adaptivePlanToCoachPlan ───────────────────────────────────────────────────

describe('adaptivePlanToCoachPlan', () => {
  it('maps all fields correctly', () => {
    const plan      = makeActivePlan()
    const goal      = makeCoachGoal()

    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    expect(coachPlan.id).toBe('plan-1')
    expect(coachPlan.userId).toBe('user-1')
    expect(coachPlan.personaId).toBe('mia')
    expect(coachPlan.activePlanId).toBe('plan-1')
    expect(coachPlan.goalId).toBe('goal-1')
    expect(coachPlan.status).toBe('active')
    expect(coachPlan.adaptationCount).toBe(0)
    expect(coachPlan.lastAdaptedAt).toBeNull()
  })

  it('assigns durationDays=7 for plans under 14 days (1 week)', () => {
    const plan = makeActivePlan({ duration_weeks: 1 })
    const goal = makeCoachGoal()

    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    expect(coachPlan.durationDays).toBe(7)
  })

  it('assigns durationDays=30 for plans between 14 and 59 days (2-8 weeks)', () => {
    const plan = makeActivePlan({ duration_weeks: 4 })
    const goal = makeCoachGoal()

    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    expect(coachPlan.durationDays).toBe(30)
  })

  it('assigns durationDays=90 for long plans (13+ weeks)', () => {
    const plan = makeActivePlan({ duration_weeks: 22 })
    const goal = makeCoachGoal()

    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    expect(coachPlan.durationDays).toBe(90)
  })

  it('converts milestones to tasks', () => {
    const plan = makeActivePlan({
      milestones: [makeMilestone({ milestone_id: 'ms-a' }), makeMilestone({ milestone_id: 'ms-b', week: 8 })],
    })
    const goal = makeCoachGoal()

    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    expect(coachPlan.tasks).toHaveLength(2)
    expect(coachPlan.tasks[0]!.id).toBe('ms-a')
    expect(coachPlan.tasks[1]!.id).toBe('ms-b')
  })

  it('sets status=completed for completed plans', () => {
    const plan = makeActivePlan({ status: 'completed' })
    const goal = makeCoachGoal()

    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    expect(coachPlan.status).toBe('completed')
    expect(coachPlan.phase).toBe('transformation')
  })

  it('sets status=abandoned for abandoned plans', () => {
    const plan = makeActivePlan({ status: 'abandoned' })
    const goal = makeCoachGoal()

    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    expect(coachPlan.status).toBe('abandoned')
  })
})

// ── planToSummary ─────────────────────────────────────────────────────────────

describe('planToSummary', () => {
  it('returns a non-empty string', () => {
    const plan      = makeActivePlan()
    const goal      = makeCoachGoal()
    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    const summary = planToSummary(coachPlan)

    expect(typeof summary).toBe('string')
    expect(summary.length).toBeGreaterThan(10)
  })

  it('includes the duration in days', () => {
    const plan      = makeActivePlan({ duration_weeks: 22 })
    const goal      = makeCoachGoal()
    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    const summary = planToSummary(coachPlan)

    expect(summary).toContain('90-day')
  })

  it('includes the task count', () => {
    const plan = makeActivePlan({
      milestones: [makeMilestone(), makeMilestone({ milestone_id: 'ms-2', week: 8 })],
    })
    const goal      = makeCoachGoal()
    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    const summary = planToSummary(coachPlan)

    expect(summary).toContain('2 task')
  })

  it('includes the start date', () => {
    const plan      = makeActivePlan({ start_date: '2026-07-01' })
    const goal      = makeCoachGoal()
    const coachPlan = adaptivePlanToCoachPlan(plan, 'user-1', goal, PERSONA_ID)

    const summary = planToSummary(coachPlan)

    expect(summary).toContain('2026-07-01')
  })
})
