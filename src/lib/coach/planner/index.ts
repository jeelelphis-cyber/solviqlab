// ─────────────────────────────────────────────────────────────────────────────
// Coach Planner — Sprint C-1.4
//
// Barrel export for the CoachPlanner adapter layer.
// ─────────────────────────────────────────────────────────────────────────────

export { CoachPlannerImpl }          from './coach-planner'
export type { PlanAdaptationReason } from './coach-planner'

export {
  adaptivePlanToCoachPlan,
  milestoneToCoachTask,
  planToSummary,
}                                    from './plan-converter'
