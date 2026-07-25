// ─────────────────────────────────────────────────────────────────────────────
// Coach Scheduler — Engine
//
// Called by Vercel Cron every `cronIntervalMinutes` minutes.
// Zero knowledge of CoachBrain, CoachPlanner, or CoachDecision.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScheduleEntry, ScheduleTrigger, SchedulerConfig } from './types'
import { shouldTrigger, isWeekend } from './time-utils'

// ── Repository interface ──────────────────────────────────────────────────────

/**
 * Data access boundary for the scheduler.
 * Implementations may query a database; in tests a mock is injected.
 */
export interface ScheduleRepository {
  /**
   * Return all active ScheduleEntry records for users whose preferred local
   * time MAY fall within the provided UTC window.
   * This is a broad DB-level pre-filter; the engine applies the precise check.
   */
  getEntriesInWindow(
    windowStartUTC: Date,
    windowEndUTC:   Date,
  ): Promise<readonly ScheduleEntry[]>
}

// ── Engine ────────────────────────────────────────────────────────────────────

export class SchedulerEngine {
  constructor(
    private readonly repo:   ScheduleRepository,
    private readonly config: SchedulerConfig,
  ) {}

  /**
   * Called by Vercel Cron every `cronIntervalMinutes` minutes.
   * Returns the list of ScheduleTriggers for users who should receive a video now.
   *
   * Tick logic:
   *  1. Calculate broad window: [nowUTC − windowMinutes, nowUTC + windowMinutes]
   *  2. Query `repo.getEntriesInWindow(start, end)` — coarse DB filter
   *  3. Call `filterDue(entries, nowUTC)` — precise in-memory filter
   *  4. Return resulting triggers
   */
  async tick(nowUTC: Date): Promise<readonly ScheduleTrigger[]> {
    const windowMs    = this.config.windowMinutes * 60_000
    const windowStart = new Date(nowUTC.getTime() - windowMs)
    const windowEnd   = new Date(nowUTC.getTime() + windowMs)

    const entries = await this.repo.getEntriesInWindow(windowStart, windowEnd)
    return this.filterDue(entries, nowUTC)
  }

  /**
   * Given a list of entries, filter to those whose window overlaps `nowUTC`.
   * Pure function — exposed for unit testing without DB involvement.
   */
  filterDue(
    entries: readonly ScheduleEntry[],
    nowUTC:  Date,
  ): readonly ScheduleTrigger[] {
    const triggers: ScheduleTrigger[] = []

    for (const entry of entries) {
      if (!shouldTrigger(entry, nowUTC, this.config)) continue

      const localDay = isWeekend(entry.timezone, nowUTC) ? 'weekend' : 'weekday'

      triggers.push({
        userId:   entry.userId,
        type:     entry.type,
        firedAt:  nowUTC.toISOString(),
        localDay,
      })
    }

    return triggers
  }
}
