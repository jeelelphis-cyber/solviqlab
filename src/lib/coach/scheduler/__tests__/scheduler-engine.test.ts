// ─────────────────────────────────────────────────────────────────────────────
// scheduler-engine.test.ts — Sprint C-1.5
//
// Tests for SchedulerEngine.filterDue() and tick() using a mock repository.
// All timezone arithmetic uses real IANA timezone names.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest'
import { SchedulerEngine }          from '../scheduler-engine'
import type { ScheduleRepository }  from '../scheduler-engine'
import type { ScheduleEntry, SchedulerConfig } from '../types'

const DEFAULT_CONFIG: SchedulerConfig = { windowMinutes: 7, cronIntervalMinutes: 15 }

// ── Mock repository builder ───────────────────────────────────────────────────
function mockRepo(entries: readonly ScheduleEntry[]): ScheduleRepository {
  return {
    getEntriesInWindow: vi.fn().mockResolvedValue(entries),
  }
}

// ── Helper: minimal ScheduleEntry ─────────────────────────────────────────────
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

// ── filterDue — pure in-memory filter ────────────────────────────────────────
describe('SchedulerEngine.filterDue', () => {
  const engine = new SchedulerEngine(mockRepo([]), DEFAULT_CONFIG)

  it('returns empty array for empty entries', () => {
    const nowUTC = new Date('2024-01-15T05:04:00Z')
    expect(engine.filterDue([], nowUTC)).toHaveLength(0)
  })

  it('returns one trigger for one entry in window', () => {
    // Kyiv Jan-15 (Monday) = UTC+2. 07:00 Kyiv = 05:00 UTC. Cron at 05:04 → in window.
    const nowUTC  = new Date('2024-01-15T05:04:00Z')
    const entries = [makeEntry()]
    const result  = engine.filterDue(entries, nowUTC)
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('u1')
    expect(result[0].type).toBe('morning')
    expect(result[0].firedAt).toBe(nowUTC.toISOString())
    expect(result[0].localDay).toBe('weekday')
  })

  it('returns no trigger for one entry OUT of window', () => {
    // 06:00 UTC = 08:00 Kyiv — 60 minutes past preferred 07:00
    const nowUTC  = new Date('2024-01-15T06:00:00Z')
    const entries = [makeEntry()]
    expect(engine.filterDue(entries, nowUTC)).toHaveLength(0)
  })

  it('handles mix of morning/evening entries at different timezones', () => {
    // nowUTC = 2024-01-15T11:03:00Z (Monday)
    // New_York entry: 06:00 EST = 11:00 UTC → 3 min delta → IN window
    // Tokyo morning entry: 07:00 JST = 22:00 UTC previous day → OUT of window
    const nowUTC = new Date('2024-01-15T11:03:00Z')
    const entries = [
      makeEntry({ userId: 'ny',    timezone: 'America/New_York', type: 'morning', localTime: '06:00' }),
      makeEntry({ userId: 'tokyo', timezone: 'Asia/Tokyo',       type: 'morning', localTime: '07:00' }),
    ]
    const result = engine.filterDue(entries, nowUTC)
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('ny')
  })

  it('skips entry with weekendMode="off" on Saturday', () => {
    // 2024-01-20 = Saturday; Kyiv 07:00 = 05:00 UTC in January
    const nowUTC  = new Date('2024-01-20T05:03:00Z')
    const entries = [makeEntry({ weekendMode: 'off' })]
    expect(engine.filterDue(entries, nowUTC)).toHaveLength(0)
  })

  it('includes entry with weekendMode="same" on Saturday', () => {
    const nowUTC  = new Date('2024-01-20T05:03:00Z')
    const entries = [makeEntry({ weekendMode: 'same' })]
    expect(engine.filterDue(entries, nowUTC)).toHaveLength(1)
  })

  it('marks localDay as "weekend" on Saturday', () => {
    const nowUTC  = new Date('2024-01-20T05:03:00Z')
    const entries = [makeEntry({ weekendMode: 'same' })]
    const result  = engine.filterDue(entries, nowUTC)
    expect(result[0].localDay).toBe('weekend')
  })

  it('skips disabled entries regardless of window', () => {
    const nowUTC  = new Date('2024-01-15T05:04:00Z')
    const entries = [makeEntry({ enabled: false })]
    expect(engine.filterDue(entries, nowUTC)).toHaveLength(0)
  })

  it('returns multiple triggers when multiple entries qualify', () => {
    // Two users both have Kyiv 07:00 morning
    const nowUTC  = new Date('2024-01-15T05:04:00Z')
    const entries = [
      makeEntry({ userId: 'u1' }),
      makeEntry({ userId: 'u2' }),
    ]
    const result = engine.filterDue(entries, nowUTC)
    expect(result).toHaveLength(2)
    expect(result.map(t => t.userId)).toContain('u1')
    expect(result.map(t => t.userId)).toContain('u2')
  })
})

// ── tick — integration with mock repository ───────────────────────────────────
describe('SchedulerEngine.tick', () => {
  it('calls repo with correct window bounds', async () => {
    const repo   = mockRepo([])
    const engine = new SchedulerEngine(repo, DEFAULT_CONFIG)
    const nowUTC = new Date('2024-01-15T05:04:00Z')

    await engine.tick(nowUTC)

    expect(repo.getEntriesInWindow).toHaveBeenCalledWith(
      new Date(nowUTC.getTime() - 7 * 60_000),
      new Date(nowUTC.getTime() + 7 * 60_000),
    )
  })

  it('returns empty array when repo returns no entries', async () => {
    const engine = new SchedulerEngine(mockRepo([]), DEFAULT_CONFIG)
    const nowUTC = new Date('2024-01-15T05:04:00Z')
    const result = await engine.tick(nowUTC)
    expect(result).toHaveLength(0)
  })

  it('returns trigger for entry in window via tick', async () => {
    const entry  = makeEntry()
    const engine = new SchedulerEngine(mockRepo([entry]), DEFAULT_CONFIG)
    const nowUTC = new Date('2024-01-15T05:04:00Z')
    const result = await engine.tick(nowUTC)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('morning')
  })

  it('firedAt in trigger matches nowUTC ISO string', async () => {
    const entry  = makeEntry()
    const engine = new SchedulerEngine(mockRepo([entry]), DEFAULT_CONFIG)
    const nowUTC = new Date('2024-01-15T05:04:00Z')
    const result = await engine.tick(nowUTC)
    expect(result[0].firedAt).toBe('2024-01-15T05:04:00.000Z')
  })
})
