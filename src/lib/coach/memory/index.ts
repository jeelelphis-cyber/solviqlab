// ─────────────────────────────────────────────────────────────────────────────
// Coach Memory Module — barrel export
// Sprint C-1.3
// ─────────────────────────────────────────────────────────────────────────────

export { CoachMemoryService }                    from './coach-memory-service'
export * from './history-analyzer'
export type {
  UserInsights,
  InterventionReason,
  InterventionThresholds,
  DailyCheckIn,
} from './coach-memory-service'
// PeriodSummary and MoodTrend are already exported from history-analyzer via `export *`
