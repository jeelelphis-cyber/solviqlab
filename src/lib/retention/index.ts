export { RetentionEngine }          from './engine'
export { DormancyDetector, dormancyDetector } from './detector'
export { ReminderPolicy, reminderPolicy }     from './policy'
export { RetentionScheduler, retentionScheduler } from './scheduler'
export { RetentionAnalytics, retentionAnalytics } from './analytics'
export { getRetentionTemplate }     from './i18n'
export type {
  DormancyLevel,
  RetentionActionType,
  RetentionRule,
  RetentionSuggestion,
  RetentionMemory,
  RetentionRuleRecord,
  RetentionContext,
} from './types'
