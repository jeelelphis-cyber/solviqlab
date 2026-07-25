// ─────────────────────────────────────────────────────────────────────────────
// Coach Scheduler — Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

import type { SchedulerConfig } from './types'

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  /** ±7 minutes tolerance around the user's preferred time. */
  windowMinutes: 7,
  /** Vercel Cron fires every 15 minutes. */
  cronIntervalMinutes: 15,
}
