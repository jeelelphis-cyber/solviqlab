import type { IntentCluster } from '../assessment/types'

// ── PlannerInput ──────────────────────────────────────────────────────────────
// Everything PlannerEngine.build() needs to construct a plan.
// Assembled from IntentState + StrategyDecision.

export interface PlannerInput {
  readonly userId: string
  readonly cluster: IntentCluster
  readonly assessmentId: string
  readonly strategyId: string
  readonly strategyName: string
  readonly currentValue: number          // e.g. 85 kg (from latest result)
  readonly goalValue: number             // e.g. 74 kg (target)
  readonly unit: string                  // 'kg' | 'bmi' | etc.
  readonly startedAt: string             // ISO timestamp
}

// ── AdaptationSignal ─────────────────────────────────────────────────────────
// The result of PlannerEngine.adapt() — explains what changed and why.

export interface AdaptationSignal {
  readonly adapted: boolean
  readonly reason: string | null         // 'off_track_3_weeks' | 'exceeded_target' | null
  readonly milestones_revised: number    // how many future milestones changed
  readonly new_target_date: string | null // if duration extended/shortened
}

// ── Strategy Config ───────────────────────────────────────────────────────────
// Per-strategy parameters that determine how PlannerEngine builds milestones.

export interface StrategyConfig {
  readonly id: string
  readonly name: string
  readonly weeklyChangeRate: number      // absolute change per week (e.g. -0.5 kg)
  readonly checkInIntervalWeeks: number  // milestone every N weeks
  readonly description: string
}

export const WEIGHT_STRATEGIES: Record<string, StrategyConfig> = {
  'balanced': {
    id:                   'balanced',
    name:                 'Balanced Approach',
    weeklyChangeRate:     -0.5,
    checkInIntervalWeeks: 4,
    description:          'Steady 0.5 kg/week reduction — sustainable and medically recommended.',
  },
  'fast-track': {
    id:                   'fast-track',
    name:                 'Fast Track',
    weeklyChangeRate:     -0.75,
    checkInIntervalWeeks: 2,
    description:          'Aggressive 0.75 kg/week reduction — requires strict adherence.',
  },
  'muscle-preserve': {
    id:                   'muscle-preserve',
    name:                 'Muscle Preservation',
    weeklyChangeRate:     -0.35,
    checkInIntervalWeeks: 4,
    description:          'Slow 0.35 kg/week reduction with resistance training — preserves lean mass.',
  },
}
