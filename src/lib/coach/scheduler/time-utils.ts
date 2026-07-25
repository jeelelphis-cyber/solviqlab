// ─────────────────────────────────────────────────────────────────────────────
// Coach Scheduler — Time Utilities
//
// Pure functions only. No side effects. All functions accept a Date parameter
// rather than calling new Date() internally. No moment.js or date-fns.
// Timezone handling uses Intl.DateTimeFormat exclusively.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScheduleEntry, SchedulerConfig } from './types'

/**
 * Convert an 'HH:MM' local time in `timezone` to a UTC Date for `referenceDate`.
 *
 * Strategy:
 *  1. Determine the local calendar date (y/m/d) for `referenceDate` in `timezone`.
 *  2. Determine the UTC offset at that moment by comparing UTC representation
 *     of `referenceDate` against the timezone representation of `referenceDate`.
 *  3. Apply that offset to compute the UTC instant for the desired local H:M.
 *
 * This avoids day-boundary issues that occur when treating the desired H:M
 * naively as a UTC timestamp and then correcting by re-formatting.
 */
export function localTimeToUTC(localTime: string, timezone: string, referenceDate: Date): Date {
  const [hours, minutes] = localTime.split(':').map(Number)

  // Step 1: determine local calendar date in target timezone
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour12:   false,
  }).formatToParts(referenceDate)

  const year  = Number(dateParts.find(p => p.type === 'year')!.value)
  const month = Number(dateParts.find(p => p.type === 'month')!.value) - 1  // 0-indexed
  const day   = Number(dateParts.find(p => p.type === 'day')!.value)

  // Step 2: determine the UTC offset at `referenceDate` for `timezone`
  // by formatting referenceDate in the target timezone and comparing to UTC
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  }).formatToParts(referenceDate)

  const tzHour   = Number(tzParts.find(p => p.type === 'hour')!.value)
  const tzMinute = Number(tzParts.find(p => p.type === 'minute')!.value)
  const tzSecond = Number(tzParts.find(p => p.type === 'second')!.value)

  // Normalise hour=24 (Intl edge case for midnight in some environments)
  const normHour = tzHour === 24 ? 0 : tzHour

  // referenceDate expressed as minutes-since-epoch, then as local hh:mm:ss
  const utcMs           = referenceDate.getTime()
  const utcTotalMinutes = Math.floor(utcMs / 60_000)
  const tzTotalMinutes  = Math.floor(
    // Build a comparable value: (date-midnight in UTC) + local hh:mm:ss
    // We use the local date fields + local time to derive a comparable epoch
    Date.UTC(year, month, day, normHour, tzMinute, tzSecond) / 60_000,
  )

  // offsetMinutes > 0 means timezone is ahead of UTC (e.g. UTC+3 → offset = +180)
  const offsetMinutes = tzTotalMinutes - utcTotalMinutes

  // Step 3: desired UTC = (local date + desired local H:M) minus offset
  const desiredLocalMs = Date.UTC(year, month, day, hours, minutes, 0)
  return new Date(desiredLocalMs - offsetMinutes * 60_000)
}

/**
 * Determine if `date` in `timezone` falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(timezone: string, date: Date): boolean {
  const dayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday:  'short',
  }).format(date)

  return dayStr === 'Sat' || dayStr === 'Sun'
}

/**
 * Check whether `nowUTC` falls within the delivery window for the given entry.
 * Window = [localTimeToUTC − windowMinutes, localTimeToUTC + windowMinutes]
 */
export function isInDeliveryWindow(
  entry: ScheduleEntry,
  nowUTC: Date,
  config: SchedulerConfig,
): boolean {
  const targetUTC  = localTimeToUTC(entry.localTime, entry.timezone, nowUTC)
  const windowMs   = config.windowMinutes * 60_000
  const diffMs     = Math.abs(nowUTC.getTime() - targetUTC.getTime())
  return diffMs <= windowMs
}

/**
 * Determine whether this entry should produce a trigger at `nowUTC`.
 *
 * Returns false if:
 *  - entry.enabled is false
 *  - weekendMode is 'off' and today is a weekend in the user's timezone
 *  - nowUTC is not inside the delivery window
 */
export function shouldTrigger(
  entry: ScheduleEntry,
  nowUTC: Date,
  config: SchedulerConfig,
): boolean {
  if (!entry.enabled) return false

  const weekend = isWeekend(entry.timezone, nowUTC)
  if (weekend && entry.weekendMode === 'off') return false

  return isInDeliveryWindow(entry, nowUTC, config)
}

/**
 * Format a UTC Date as 'HH:MM' in the given timezone.
 */
export function toLocalTimeString(utcDate: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  }).formatToParts(utcDate)

  const hour   = parts.find(p => p.type === 'hour')!.value
  const minute = parts.find(p => p.type === 'minute')!.value

  // Normalise '24:xx' → '00:xx'
  return hour === '24' ? `00:${minute}` : `${hour}:${minute}`
}
