import type { SolviqUser } from '../user/types'

export type DormancyLevel = 'none' | 'mild' | 'moderate' | 'severe' | 'critical'

export type RetentionActionType =
  | 'coach_reminder'
  | 'journey_reminder'
  | 'recommendation'
  | 'registration_nudge'
  | 'premium_nudge'

export interface RetentionRule {
  readonly id: string
  readonly name: string
  readonly daysInactive: number
  readonly action: RetentionActionType
  readonly priority: 'high' | 'medium' | 'low'
  readonly cooldownDays: number
  readonly requiresAnonymous?: boolean
  readonly requiresAuthenticated?: boolean
}

export interface RetentionSuggestion {
  readonly ruleId: string
  readonly action: RetentionActionType
  readonly title: string
  readonly body: string
  readonly cta: string | null
  readonly urgency: 'high' | 'medium' | 'low'
  readonly generatedAt: string
}

export interface RetentionRuleRecord {
  readonly ruleId: string
  readonly firedAt: string
}

export interface RetentionMemory {
  readonly rule_history: readonly RetentionRuleRecord[]
  readonly last_check_at: string | null
}

export interface RetentionContext {
  readonly user: SolviqUser
  readonly lang: string
}
