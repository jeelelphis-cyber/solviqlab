// ─────────────────────────────────────────────────────────────────────────────
// plan-converter.ts — Sprint C-1.4
//
// Converters between PlannerEngine types (ActivePlan / Milestone) and the
// Coach domain types (CoachPlan / CoachTask).
//
// Rules:
//   - No side effects — all functions are pure.
//   - Never import React, never touch window.
//   - planToSummary() is used by Mia's script system for context injection.
// ─────────────────────────────────────────────────────────────────────────────

import type { ActivePlan, Milestone } from '../../domain/active-plan'
import type { CoachPlan, CoachTask, CoachGoal } from '../domain/types'
import type {
  CoachPlanId,
  CoachTaskId,
  CoachPersonaId,
  CoachGoalId,
} from '../domain/types'

// ── ID helpers ────────────────────────────────────────────────────────────────

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// ── milestoneToCoachTask ──────────────────────────────────────────────────────

/**
 * Convert a PlannerEngine Milestone into a CoachTask.
 *
 * Milestones are week-level checkpoints; tasks are day-level actions.
 * We derive a representative date by projecting forward from the plan start.
 */
export function milestoneToCoachTask(
  milestone: Milestone,
  planId: CoachPlanId,
  planStartDate: string,
  category: string = 'movement',
): CoachTask {
  // Project the date of this milestone: startDate + (week * 7 days)
  // Parse as local noon to avoid UTC-offset date shifting in toISOString()
  const start = new Date(planStartDate + 'T12:00:00')
  start.setDate(start.getDate() + milestone.week * 7)
  // Use local date components so the result matches the intended calendar date
  const y   = start.getFullYear()
  const mo  = String(start.getMonth() + 1).padStart(2, '0')
  const day = String(start.getDate()).padStart(2, '0')
  const dateStr = `${y}-${mo}-${day}`

  return {
    id:                milestone.milestone_id as unknown as CoachTaskId,
    planId,
    date:              dateStr,
    description:       milestone.description,
    category,
    estimatedMinutes:  20,
    status:            milestone.is_completed ? 'completed' : 'assigned',
    completedAt:       milestone.completed_at ?? null,
  }
}

// ── adaptivePlanToCoachPlan ───────────────────────────────────────────────────

/**
 * Convert a PlannerEngine ActivePlan into a CoachPlan.
 *
 * durationDays is clamped to the nearest valid coach plan length:
 *   < 14 days  → 7
 *   < 60 days  → 30
 *   anything else → 90
 */
export function adaptivePlanToCoachPlan(
  plan: ActivePlan,
  userId: string,
  goal: CoachGoal,
  personaId: CoachPersonaId,
): CoachPlan {
  const durationDays = durationWeeksToDays(plan.duration_weeks)

  const planId = plan.plan_id as unknown as CoachPlanId

  // Convert milestones → tasks. Use goal category as the task category.
  const tasks: readonly CoachTask[] = plan.milestones.map(m =>
    milestoneToCoachTask(m, planId, plan.start_date, 'movement'),
  )

  // Determine phase from plan status
  const phase =
    plan.status === 'completed'  ? 'transformation' :
    plan.status === 'paused'     ? 'paused'         :
    durationDays === 7           ? 'onboarding'     :
    durationDays === 30          ? 'planning'       :
                                   'active'

  const status =
    plan.status === 'active'     ? 'active'     :
    plan.status === 'paused'     ? 'paused'     :
    plan.status === 'completed'  ? 'completed'  :
    plan.status === 'abandoned'  ? 'abandoned'  :
                                   'building'

  return {
    id:               planId,
    userId,
    personaId,
    activePlanId:     plan.plan_id,
    goalId:           goal.id,
    durationDays,
    phase,
    status,
    tasks,
    startedAt:        plan.start_date + 'T00:00:00.000Z',
    endsAt:           plan.target_date + 'T00:00:00.000Z',
    lastAdaptedAt:    plan.last_adapted_at,
    adaptationCount:  plan.adaptation_count,
    createdAt:        plan.created_at,
  }
}

// ── planToSummary ─────────────────────────────────────────────────────────────

/**
 * Produce a short, human-readable summary of a CoachPlan.
 * Used by Mia's script system for context injection into video scripts.
 *
 * Example: "30-day weight loss plan: 3 milestones, started 2026-07-01"
 */
export function planToSummary(plan: CoachPlan): string {
  const taskCount   = plan.tasks.length
  const taskLabel   = taskCount === 1 ? 'task' : 'tasks'
  const startDate   = plan.startedAt.slice(0, 10)
  const phaseLabel  = plan.phase.replace(/_/g, ' ')

  return `${plan.durationDays}-day plan (${phaseLabel}): ${taskCount} ${taskLabel}, started ${startDate}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function durationWeeksToDays(weeks: number): 7 | 30 | 90 {
  const days = weeks * 7
  if (days < 14) return 7
  if (days < 60) return 30
  return 90
}
