// ─────────────────────────────────────────────────────────────────────────────
// time-utils.test.ts — Sprint C-1.5
//
// Tests for pure time utility functions.
// Real IANA timezone names are used throughout (no mocking of Intl).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  localTimeToUTC,
  isWeekend,
  isInDeliveryWindow,
  shouldTrigger,
  toLocalTimeString,
} from '../time-utils'
import type { ScheduleEntry, SchedulerConfig } from '../types'

const DEFAULT_CONFIG: SchedulerConfig = { windowMinutes: 7, cronIntervalMinutes: 15 }

// ── Helper to build a minimal ScheduleEntry ───────────────────────────────────
function makeEntry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    userId:      'u1',
    type:        'morning',
    timezone:    'Europe/Kyiv',
    localTime:   '07:00',
    weekendMode: 'same',
    enabled:     true,
    ...overrides,
  }
}

// ── localTimeToUTC ────────────────────────────────────────────────────────────
describe('localTimeToUTC', () => {
  it('converts Kyiv 07:00 to correct UTC (UTC+2 in winter)', () => {
    // Use noon UTC so Jan 15 is unambiguous in all timezones.
    // At T12:00Z, Kyiv (UTC+2 in Jan) is 14:00 local — still Jan 15.
    const ref    = new Date('2024-01-15T12:00:00Z')
    const result = localTimeToUTC('07:00', 'Europe/Kyiv', ref)
    // 07:00 EET (UTC+2) = 05:00 UTC Jan 15
    expect(result.toISOString()).toBe('2024-01-15T05:00:00.000Z')
  })

  it('converts New_York 06:00 to correct UTC (UTC-5 in winter)', () => {
    // At T12:00Z, New York (UTC-5) is 07:00 — still Jan 15.
    const ref    = new Date('2024-01-15T12:00:00Z')
    const result = localTimeToUTC('06:00', 'America/New_York', ref)
    // 06:00 EST (UTC-5) = 11:00 UTC Jan 15
    expect(result.toISOString()).toBe('2024-01-15T11:00:00.000Z')
  })

  it('converts Tokyo 22:00 to correct UTC (UTC+9)', () => {
    // At T12:00Z, Tokyo (UTC+9) is 21:00 — still Jan 15.
    const ref    = new Date('2024-01-15T12:00:00Z')
    const result = localTimeToUTC('22:00', 'Asia/Tokyo', ref)
    // 22:00 JST (UTC+9) = 13:00 UTC Jan 15
    expect(result.toISOString()).toBe('2024-01-15T13:00:00.000Z')
  })

  it('handles midnight (00:00) in New_York correctly', () => {
    // At T12:00Z, New York (UTC-5) is 07:00 — still Jan 15.
    const ref    = new Date('2024-01-15T12:00:00Z')
    const result = localTimeToUTC('00:00', 'America/New_York', ref)
    // 00:00 EST (UTC-5) = 05:00 UTC Jan 15
    expect(result.toISOString()).toBe('2024-01-15T05:00:00.000Z')
  })
})

// ── isWeekend ─────────────────────────────────────────────────────────────────
describe('isWeekend', () => {
  it('returns true for Saturday in Europe/Kyiv', () => {
    // 2024-01-20 is a Saturday
    const sat = new Date('2024-01-20T10:00:00Z')
    expect(isWeekend('Europe/Kyiv', sat)).toBe(true)
  })

  it('returns true for Sunday in America/New_York', () => {
    // 2024-01-21 is a Sunday
    const sun = new Date('2024-01-21T10:00:00Z')
    expect(isWeekend('America/New_York', sun)).toBe(true)
  })

  it('returns false for Monday in Asia/Tokyo', () => {
    // 2024-01-22 is a Monday
    const mon = new Date('2024-01-22T10:00:00Z')
    expect(isWeekend('Asia/Tokyo', mon)).toBe(false)
  })

  it('returns false for Friday in Europe/Kyiv', () => {
    // 2024-01-19 is a Friday
    const fri = new Date('2024-01-19T10:00:00Z')
    expect(isWeekend('Europe/Kyiv', fri)).toBe(false)
  })
})

// ── isInDeliveryWindow ────────────────────────────────────────────────────────
describe('isInDeliveryWindow', () => {
  // Kyiv Jan-15 = UTC+2. 07:00 local = 05:00 UTC.
  it('returns true when cron fires 4 min after preferred time (Kyiv 07:00)', () => {
    // 05:04 UTC → 07:04 Kyiv local — within ±7 min window
    const nowUTC = new Date('2024-01-15T05:04:00Z')
    const entry  = makeEntry({ timezone: 'Europe/Kyiv', localTime: '07:00' })
    expect(isInDeliveryWindow(entry, nowUTC, DEFAULT_CONFIG)).toBe(true)
  })

  it('returns true when cron fires exactly on time (New_York 06:00)', () => {
    // 06:00 EST (UTC-5) = 11:00 UTC
    const nowUTC = new Date('2024-01-15T11:00:00Z')
    const entry  = makeEntry({ timezone: 'America/New_York', localTime: '06:00' })
    expect(isInDeliveryWindow(entry, nowUTC, DEFAULT_CONFIG)).toBe(true)
  })

  it('returns true when cron fires 5 min before preferred time', () => {
    // 04:55 UTC → 06:55 Kyiv — 5 min early, within ±7 min
    const nowUTC = new Date('2024-01-15T04:55:00Z')
    const entry  = makeEntry({ timezone: 'Europe/Kyiv', localTime: '07:00' })
    expect(isInDeliveryWindow(entry, nowUTC, DEFAULT_CONFIG)).toBe(true)
  })

  it('returns false when cron fires 20 minutes late', () => {
    // 05:20 UTC → 07:20 Kyiv local — 20 min late, outside ±7 min
    const nowUTC = new Date('2024-01-15T05:20:00Z')
    const entry  = makeEntry({ timezone: 'Europe/Kyiv', localTime: '07:00' })
    expect(isInDeliveryWindow(entry, nowUTC, DEFAULT_CONFIG)).toBe(false)
  })

  it('returns false when cron fires 15 min early (New_York 06:00)', () => {
    // 10:45 UTC → 05:45 EST — 15 min early, outside ±7 min
    const nowUTC = new Date('2024-01-15T10:45:00Z')
    const entry  = makeEntry({ timezone: 'America/New_York', localTime: '06:00' })
    expect(isInDeliveryWindow(entry, nowUTC, DEFAULT_CONFIG)).toBe(false)
  })

  it('returns true at exactly +windowMinutes boundary', () => {
    // 05:07 UTC = exactly +7 min from 05:00 UTC target — should be IN window
    const nowUTC = new Date('2024-01-15T05:07:00Z')
    const entry  = makeEntry({ timezone: 'Europe/Kyiv', localTime: '07:00' })
    expect(isInDeliveryWindow(entry, nowUTC, DEFAULT_CONFIG)).toBe(true)
  })
})

// ── shouldTrigger ─────────────────────────────────────────────────────────────
describe('shouldTrigger', () => {
  it('returns false when entry is disabled', () => {
    const nowUTC = new Date('2024-01-15T05:04:00Z')
    const entry  = makeEntry({ enabled: false })
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(false)
  })

  it('returns false for weekend when weekendMode="off"', () => {
    // 2024-01-20 = Saturday; 07:00 Kyiv = 05:00 UTC
    const nowUTC = new Date('2024-01-20T05:04:00Z')
    const entry  = makeEntry({ weekendMode: 'off' })
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(false)
  })

  it('returns true for weekend when weekendMode="same"', () => {
    // 2024-01-20 = Saturday; within window
    const nowUTC = new Date('2024-01-20T05:04:00Z')
    const entry  = makeEntry({ weekendMode: 'same' })
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(true)
  })

  it('returns true for weekend when weekendMode="lighter"', () => {
    const nowUTC = new Date('2024-01-20T05:04:00Z')
    const entry  = makeEntry({ weekendMode: 'lighter' })
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(true)
  })

  it('returns false when in window on weekday but disabled', () => {
    const nowUTC = new Date('2024-01-15T05:04:00Z')  // Monday
    const entry  = makeEntry({ enabled: false, weekendMode: 'same' })
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(false)
  })

  it('returns false when enabled and weekday but outside window', () => {
    const nowUTC = new Date('2024-01-15T06:00:00Z')  // 08:00 Kyiv — 60 min late
    const entry  = makeEntry()
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(false)
  })

  it('returns true on weekday within window (New_York 06:00, in window)', () => {
    // 2024-01-15 Monday. 06:00 EST = 11:00 UTC
    const nowUTC = new Date('2024-01-15T11:03:00Z')  // 3 min late
    const entry  = makeEntry({ timezone: 'America/New_York', localTime: '06:00' })
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(true)
  })

  it('returns false on Sunday with weekendMode="off" even if in window', () => {
    // 2024-01-21 = Sunday; 06:00 EST = 11:00 UTC
    const nowUTC = new Date('2024-01-21T11:02:00Z')
    const entry  = makeEntry({
      timezone:    'America/New_York',
      localTime:   '06:00',
      weekendMode: 'off',
    })
    expect(shouldTrigger(entry, nowUTC, DEFAULT_CONFIG)).toBe(false)
  })
})

// ── toLocalTimeString ─────────────────────────────────────────────────────────
describe('toLocalTimeString', () => {
  it('formats UTC as Kyiv local time', () => {
    // 05:00 UTC = 07:00 Kyiv (UTC+2 in January)
    const utc    = new Date('2024-01-15T05:00:00Z')
    const result = toLocalTimeString(utc, 'Europe/Kyiv')
    expect(result).toBe('07:00')
  })

  it('formats UTC as New_York local time', () => {
    // 11:00 UTC = 06:00 EST
    const utc    = new Date('2024-01-15T11:00:00Z')
    const result = toLocalTimeString(utc, 'America/New_York')
    expect(result).toBe('06:00')
  })
})
