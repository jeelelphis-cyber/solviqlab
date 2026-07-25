// Coach Brain — Sprint C-1.1
// Public barrel export for the Coach Brain layer.

export { CoachBrain }           from './coach-brain'
export { DecisionEngineImpl }   from './decision-engine'
export { CoachMemoryImpl }      from './coach-memory'

export type { DailyCheckIn }                       from './coach-brain'
export type {
  EvaluableDecisionRule,
  CoachPersonaConfigWithEvaluableRules,
}                                                  from './decision-engine'
