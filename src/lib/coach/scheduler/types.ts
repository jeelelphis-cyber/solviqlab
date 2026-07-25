// ─────────────────────────────────────────────────────────────────────────────
// Coach Scheduler — Domain Types
//
// Pure type definitions for the timezone-aware notification scheduler.
// No imports from brain, planner, or any other coach sub-system.
// ─────────────────────────────────────────────────────────────────────────────

/** Schedule entry for one user × one routine type. */
export interface ScheduleEntry {
  readonly userId:      string
  readonly type:        'morning' | 'evening'
  readonly timezone:    string
  readonly localTime:   string    // 'HH:MM'
  readonly weekendMode: 'same' | 'lighter' | 'off'
  readonly enabled:     boolean
}

/** What the scheduler produces per tick. */
export interface ScheduleTrigger {
  readonly userId:   string
  readonly type:     'morning' | 'evening'
  readonly firedAt:  string   // ISO-8601 UTC
  readonly localDay: 'weekday' | 'weekend'
}

/** Scheduler configuration — injected, not hardcoded. */
export interface SchedulerConfig {
  /** How many minutes of tolerance around preferred time (e.g. ±7 minutes). */
  readonly windowMinutes: number
  /** Cron runs every N minutes — used to calculate windows. */
  readonly cronIntervalMinutes: number
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0=Sunday
