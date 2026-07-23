// ─────────────────────────────────────────────────────────────────────────────
// PlannerEngine Integration Tests — V3-10F F-3
//
// Tests the closed loop:
//   build() → AdaptivePlan with Milestones
//   adapt() → revised plan after check-in
//   getRecommendedAction() → what to do next
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { PlannerEngine } from '../planner/engine'
import type { PlannerInput } from '../planner/types'

const plannerInput: PlannerInput = {
  userId:        'test-user-1',
  cluster:       'weight',
  assessmentId:  'assessment-001',
  strategyId:    'balanced',
  strategyName:  'Balanced Approach',
  currentValue:  85,       // 85 kg
  goalValue:     74,       // 74 kg target
  unit:          'kg',
  startedAt:     new Date().toISOString(),
}

describe('PlannerEngine — build()', () => {
  it('produces a valid AdaptivePlan', () => {
    const engine = new PlannerEngine()
    const plan = engine.build(plannerInput)

    expect(plan.plan_id).toBeTruthy()
    expect(plan.status).toBe('active')
    expect(plan.strategy_id).toBe('balanced')
    expect(plan.current_value).toBe(85)
    expect(plan.goal_value).toBe(74)
    expect(plan.check_ins).toHaveLength(0)
    expect(plan.adaptation_count).toBe(0)

    console.log('✅ Plan built:', {
      goal: plan.goal,
      duration_weeks: plan.duration_weeks,
      milestones: plan.milestones.length,
      target_date: plan.target_date,
    })
  })

  it('generates milestones at 4-week intervals', () => {
    const engine = new PlannerEngine()
    const plan = engine.build(plannerInput)

    expect(plan.milestones.length).toBeGreaterThan(0)

    // All milestones except the final goal are at multiples of 4
    const interim = plan.milestones.slice(0, -1)
    interim.forEach(m => {
      expect(m.week % 4).toBe(0)
    })

    // Target values approach goal
    const last = plan.milestones[plan.milestones.length - 1]!
    expect(last.target_value).toBeCloseTo(plannerInput.goalValue, 0)

    console.log('✅ Milestones:', plan.milestones.map(m => `Week ${m.week}: ${m.target_value} kg`))
  })

  it('duration matches 0.5 kg/week rate for 11 kg loss', () => {
    const engine = new PlannerEngine()
    const plan = engine.build(plannerInput)

    // 11 kg at 0.5 kg/week = 22 weeks
    expect(plan.duration_weeks).toBe(22)
  })
})

describe('PlannerEngine — adapt()', () => {
  it('appends check-in and marks milestone complete', () => {
    const engine = new PlannerEngine()
    const plan = engine.build(plannerInput)

    const { plan: adapted, signal } = engine.adapt(plan, {
      week: 4,
      actual_value: 83.0,       // slightly off from expected 83.0
      subjective_score: 7,
      notes: 'Feeling good, exercise 3x week',
    })

    expect(adapted.check_ins).toHaveLength(1)
    expect(adapted.check_ins[0]!.week).toBe(4)
    expect(adapted.check_ins[0]!.actual_value).toBe(83.0)
    expect(signal.adapted).toBe(false) // only one check-in, no adaptation yet

    console.log('✅ Check-in recorded:', {
      on_track: adapted.check_ins[0]!.on_track,
      deviation_percent: adapted.check_ins[0]!.deviation_percent,
      signal,
    })
  })

  it('adapts plan after 2 consecutive off-track check-ins', () => {
    const engine = new PlannerEngine()
    let plan = engine.build(plannerInput)

    // Week 4: off track (expected ~83, actual 84.5)
    const r1 = engine.adapt(plan, { week: 4, actual_value: 84.5, subjective_score: 5, notes: null })
    plan = r1.plan

    // Week 8: off track again (expected ~81, actual 83.0)
    const r2 = engine.adapt(plan, { week: 8, actual_value: 83.0, subjective_score: 4, notes: null })
    plan = r2.plan

    expect(r2.signal.adapted).toBe(true)
    expect(r2.signal.reason).toBe('off_track_consecutive_weeks')
    expect(r2.signal.milestones_revised).toBeGreaterThan(0)
    expect(plan.adaptation_count).toBe(1)

    console.log('✅ Plan adapted:', {
      adaptation_count: plan.adaptation_count,
      milestones_revised: r2.signal.milestones_revised,
      reason: r2.signal.reason,
      new_target_date: r2.signal.new_target_date,
      new_milestones: plan.milestones.length,
    })
  })
})

describe('PlannerEngine — getRecommendedAction()', () => {
  it('recommends check_in when a week has passed', () => {
    const engine = new PlannerEngine()
    let plan = engine.build(plannerInput)

    // Add a check-in from 8 days ago
    const pastCheckIn = {
      check_in_id:       'old-1',
      plan_id:           plan.plan_id,
      week:              1,
      actual_value:      84,
      subjective_score:  8,
      notes:             null,
      on_track:          true,
      deviation_percent: 2.5,
      recorded_at:       new Date(Date.now() - 8 * 24 * 3600_000).toISOString(),
    }

    plan = { ...plan, check_ins: [pastCheckIn] }
    const action = engine.getRecommendedAction(plan)

    expect(action.action).toBe('check_in')
    expect(action.urgency).toBe('medium')

    console.log('✅ Recommended action:', action)
  })
})

describe('PlannerEngine — FULL LOOP', () => {
  it('build → check-in × 4 → adapt → getRecommendedAction', () => {
    const engine = new PlannerEngine()
    let plan = engine.build(plannerInput)

    console.log('── Initial Plan ──')
    console.log(`  Goal: ${plan.goal}`)
    console.log(`  Duration: ${plan.duration_weeks} weeks`)
    console.log(`  Milestones: ${plan.milestones.length}`)

    // Simulate 4 weekly check-ins with mixed adherence
    const checkIns = [
      { week: 4, actual_value: 84.5, subjective_score: 6 },  // off track
      { week: 8, actual_value: 83.5, subjective_score: 5 },  // off track
      { week: 12, actual_value: 81.0, subjective_score: 8 }, // on track
      { week: 16, actual_value: 79.0, subjective_score: 9 }, // on track
    ]

    for (const ci of checkIns) {
      const result = engine.adapt(plan, { ...ci, notes: null })
      plan = result.plan
      console.log(`  Week ${ci.week}: ${ci.actual_value} kg | on_track: ${plan.check_ins.at(-1)!.on_track} | adapted: ${result.signal.adapted}`)
    }

    const action = engine.getRecommendedAction({ ...plan, check_ins: [] }) // clear for test
    console.log(`\n── After full loop ──`)
    console.log(`  check_ins: ${plan.check_ins.length}`)
    console.log(`  adaptation_count: ${plan.adaptation_count}`)
    console.log(`  remaining_milestones: ${plan.milestones.filter(m => !m.is_completed).length}`)

    expect(plan.check_ins.length).toBe(4)
    expect(plan.adaptation_count).toBeGreaterThanOrEqual(1)
    expect(plan.milestones.length).toBeGreaterThan(0)
  })
})
