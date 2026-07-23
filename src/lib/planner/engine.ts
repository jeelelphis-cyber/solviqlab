// ─────────────────────────────────────────────────────────────────────────────
// PlannerEngine — Adaptive Plan Lifecycle
//
// Implements the closed loop:
//   IntentState → build() → AdaptivePlan (with Milestones)
//       ↑                          ↓
//       |              Execution (weekly check-ins)
//       |                          ↓
//       |        adapt(plan, checkIn) → revised AdaptivePlan
//       |                          ↓
//       └── UserEngine.storeAdaptivePlan() → IntentState updated
//
// Design invariants:
//   1. build() is deterministic: same input → same output.
//   2. adapt() never mutates — returns a new AdaptivePlan.
//   3. check_ins are append-only — the history is permanent.
//   4. Milestones are rebuilt on adapt() based on current progress.
//   5. No side effects. UserEngine is the only writer.
// ─────────────────────────────────────────────────────────────────────────────

import type { ActivePlan, CheckIn, Milestone } from '../domain/active-plan'
import type { AdaptationSignal, PlannerInput } from './types'
import { WEIGHT_STRATEGIES } from './types'

// ── ID generation ─────────────────────────────────────────────────────────────

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0]!
}

// ── Milestone Builder ─────────────────────────────────────────────────────────

function buildMilestones(
  planId: string,
  currentValue: number,
  goalValue: number,
  startDate: Date,
  weeklyChangeRate: number,
  checkInIntervalWeeks: number,
  durationWeeks: number,
  unit: string,
): Milestone[] {
  const milestones: Milestone[] = []
  let projectedValue = currentValue

  for (let week = checkInIntervalWeeks; week <= durationWeeks; week += checkInIntervalWeeks) {
    projectedValue = currentValue + (weeklyChangeRate * week)
    // Cap at goal — don't overshoot
    const targetValue = weeklyChangeRate < 0
      ? Math.max(projectedValue, goalValue)
      : Math.min(projectedValue, goalValue)

    const targetDate = new Date(startDate)
    targetDate.setDate(targetDate.getDate() + week * 7)

    milestones.push({
      milestone_id: uid(),
      plan_id:      planId,
      week,
      target_value: Math.round(targetValue * 10) / 10,
      description:  `Week ${week}: reach ${Math.round(targetValue * 10) / 10} ${unit}`,
      is_completed: false,
      completed_at: null,
      actual_value: null,
    })

    // If we've reached the goal early, stop generating milestones
    if (Math.abs(projectedValue - goalValue) < 0.1) break
  }

  return milestones
}

// ── Duration Calculator ───────────────────────────────────────────────────────

function calculateDurationWeeks(
  currentValue: number,
  goalValue: number,
  weeklyChangeRate: number,
): number {
  const totalChange = Math.abs(goalValue - currentValue)
  const weeksNeeded = Math.ceil(totalChange / Math.abs(weeklyChangeRate))
  return Math.max(weeksNeeded, 4) // minimum 4 weeks
}

// ── PlannerEngine ─────────────────────────────────────────────────────────────

export class PlannerEngine {

  // ── build() ──────────────────────────────────────────────────────────────────
  // Creates an AdaptivePlan from IntentState + StrategyDecision.
  // Called once when user confirms their strategy.

  build(input: PlannerInput): ActivePlan {
    const strategy = WEIGHT_STRATEGIES[input.strategyId] ?? WEIGHT_STRATEGIES['balanced']!
    const planId = uid()
    const startDate = new Date(input.startedAt)

    const durationWeeks = calculateDurationWeeks(
      input.currentValue,
      input.goalValue,
      strategy.weeklyChangeRate,
    )

    const targetDate = new Date(startDate)
    targetDate.setDate(targetDate.getDate() + durationWeeks * 7)

    const milestones = buildMilestones(
      planId,
      input.currentValue,
      input.goalValue,
      startDate,
      strategy.weeklyChangeRate,
      strategy.checkInIntervalWeeks,
      durationWeeks,
      input.unit,
    )

    // Always add a final milestone at the goal value (duration_weeks) if not already there
    const lastMilestone = milestones[milestones.length - 1]
    if (!lastMilestone || lastMilestone.week < durationWeeks) {
      const finalDate = new Date(startDate)
      finalDate.setDate(finalDate.getDate() + durationWeeks * 7)
      milestones.push({
        milestone_id: uid(),
        plan_id:      planId,
        week:         durationWeeks,
        target_value: input.goalValue,
        description:  `Week ${durationWeeks}: reach goal — ${input.goalValue} ${input.unit}`,
        is_completed: false,
        completed_at: null,
        actual_value: null,
      })
    }

    const deltaKg = Math.round(Math.abs(input.currentValue - input.goalValue) * 10) / 10
    const targetYear = targetDate.getFullYear()
    const targetMonth = targetDate.toLocaleString('en', { month: 'long' })

    return {
      plan_id:          planId,
      cluster:          input.cluster,
      strategy_id:      strategy.id,
      assessment_id:    input.assessmentId,
      goal:             `Reach ${input.goalValue} ${input.unit} by ${targetMonth} ${targetYear}`,
      goal_value:       input.goalValue,
      current_value:    input.currentValue,
      start_date:       isoDate(startDate),
      target_date:      isoDate(targetDate),
      duration_weeks:   durationWeeks,
      status:           'active',
      milestones,
      check_ins:        [],
      last_adapted_at:  null,
      created_at:       input.startedAt,
      adaptation_count: 0,
    }
  }

  // ── adapt() ───────────────────────────────────────────────────────────────────
  // Called after each weekly check-in. Returns a revised AdaptivePlan.
  // Appends the check-in (immutable history).
  // Rebuilds future milestones based on current actual progress.
  // Returns an AdaptationSignal explaining what changed.

  adapt(
    plan: ActivePlan,
    checkIn: Omit<CheckIn, 'check_in_id' | 'plan_id' | 'on_track' | 'deviation_percent' | 'recorded_at'>,
  ): { plan: ActivePlan; signal: AdaptationSignal } {
    const strategy = WEIGHT_STRATEGIES[plan.strategy_id] ?? WEIGHT_STRATEGIES['balanced']!
    const now = new Date().toISOString()

    // Compute deviation based on progress vs expected progress
    // (not absolute value — 10% of 83 kg is 8.3 kg, way too lenient for weekly tracking)
    const expectedMilestone = plan.milestones.find(m => m.week >= checkIn.week)
    const expectedValue = expectedMilestone?.target_value ?? plan.goal_value
    const expectedProgress = expectedValue - plan.current_value     // e.g. 83-85 = -2 (negative)
    const actualProgress   = checkIn.actual_value - plan.current_value  // e.g. 84.5-85 = -0.5
    const progressRatio    = expectedProgress !== 0 ? actualProgress / expectedProgress : 1
    const onTrack = progressRatio >= 0.7  // achieved at least 70% of expected progress
    const deviationPercent = Math.round(Math.max(0, (1 - progressRatio)) * 100 * 10) / 10

    const newCheckIn: CheckIn = {
      check_in_id:       uid(),
      plan_id:           plan.plan_id,
      week:              checkIn.week,
      actual_value:      checkIn.actual_value,
      subjective_score:  checkIn.subjective_score,
      notes:             checkIn.notes,
      on_track:          onTrack,
      deviation_percent: Math.round(deviationPercent * 10) / 10,
      recorded_at:       now,
    }

    // Determine if we need to adapt the milestones
    const recentCheckIns = [...plan.check_ins, newCheckIn].slice(-3)
    const offTrackCount = recentCheckIns.filter(ci => !ci.on_track).length
    const shouldAdapt = offTrackCount >= 2  // 2+ off-track check-ins in last 3 weeks

    let milestonesRevised = 0
    let newTargetDate = null

    const updatedMilestones: Milestone[] = plan.milestones.map(m => {
      if (m.week <= checkIn.week && !m.is_completed) {
        // Mark past milestone as completed with actual value
        return { ...m, is_completed: true, completed_at: now, actual_value: checkIn.actual_value }
      }
      return m
    })

    let finalMilestones = updatedMilestones

    if (shouldAdapt) {
      // Recalculate remaining milestones from current actual value
      const latestActual = checkIn.actual_value
      const remainingWeeks = plan.duration_weeks - checkIn.week
      const startDate = new Date()

      const remainingWeeksNeeded = calculateDurationWeeks(
        latestActual,
        plan.goal_value,
        strategy.weeklyChangeRate,
      )

      const extended = remainingWeeksNeeded > remainingWeeks
      const newDuration = checkIn.week + remainingWeeksNeeded

      const futureMilestones = buildMilestones(
        plan.plan_id,
        latestActual,
        plan.goal_value,
        startDate,
        strategy.weeklyChangeRate,
        strategy.checkInIntervalWeeks,
        remainingWeeksNeeded,
        'kg',
      ).map(m => ({ ...m, week: m.week + checkIn.week }))

      finalMilestones = [
        ...updatedMilestones.filter(m => m.is_completed),
        ...futureMilestones,
      ]
      milestonesRevised = futureMilestones.length

      if (extended) {
        const nd = new Date()
        nd.setDate(nd.getDate() + remainingWeeksNeeded * 7)
        newTargetDate = isoDate(nd)
      }
    }

    const adaptedPlan: ActivePlan = {
      ...plan,
      milestones:       finalMilestones,
      check_ins:        [...plan.check_ins, newCheckIn],
      last_adapted_at:  shouldAdapt ? now : plan.last_adapted_at,
      target_date:      newTargetDate ?? plan.target_date,
      adaptation_count: plan.adaptation_count + (shouldAdapt ? 1 : 0),
    }

    const signal: AdaptationSignal = {
      adapted:            shouldAdapt,
      reason:             shouldAdapt ? 'off_track_consecutive_weeks' : null,
      milestones_revised: milestonesRevised,
      new_target_date:    newTargetDate,
    }

    return { plan: adaptedPlan, signal }
  }

  // ── getRecommendedAction() ────────────────────────────────────────────────────
  // What should the user do right now based on their plan state?
  // Used by RecommendationEngine to factor in active plan context.

  getRecommendedAction(plan: ActivePlan): {
    action: 'check_in' | 'next_milestone' | 'celebrate' | 'replan'
    message: string
    urgency: 'low' | 'medium' | 'high'
  } {
    if (plan.status === 'completed') {
      return { action: 'celebrate', message: 'You reached your goal!', urgency: 'low' }
    }

    const lastCheckIn = plan.check_ins[plan.check_ins.length - 1]
    const weeksSinceLastCheckIn = lastCheckIn
      ? Math.floor((Date.now() - new Date(lastCheckIn.recorded_at).getTime()) / (7 * 24 * 3600_000))
      : 99

    if (weeksSinceLastCheckIn >= 1) {
      return {
        action:  'check_in',
        message: 'Time for your weekly check-in',
        urgency: weeksSinceLastCheckIn >= 2 ? 'high' : 'medium',
      }
    }

    const recentOffTrack = plan.check_ins.slice(-3).filter(ci => !ci.on_track).length
    if (recentOffTrack >= 2) {
      return {
        action:  'replan',
        message: 'Your plan needs adjustment — you\'ve been off-track recently',
        urgency: 'high',
      }
    }

    const nextMilestone = plan.milestones.find(m => !m.is_completed)
    return {
      action:  'next_milestone',
      message: nextMilestone ? `Next goal: ${nextMilestone.description}` : 'Keep going!',
      urgency: 'low',
    }
  }
}
