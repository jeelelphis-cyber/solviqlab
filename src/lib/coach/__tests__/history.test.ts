import { describe, it, expect, beforeEach } from 'vitest'
import { CoachHistoryRepository, buildHistoryEntry } from '../history'
import { MemoryProvider } from '../../user/storage'
import type { CoachMessage } from '../types'

function makeMessage(overrides: Partial<CoachMessage> = {}): CoachMessage {
  return {
    message_id:   'assessment:completed:weight:a1',
    cluster:      'weight',
    phase:        'planning',
    decision:     { trigger: 'assessment:completed', reason: 'good_score' },
    type:         'insight',
    priority:     'normal',
    title:        'Solid score.',
    body:         'You scored 72/100.',
    actions:      [{ label: 'See My Strategy', actionId: 'see_strategy', type: 'primary' }],
    generated_at: new Date().toISOString(),
    data_snapshot: { score: 72 },
    ...overrides,
  }
}

describe('CoachHistoryRepository', () => {
  let repo: CoachHistoryRepository

  beforeEach(() => {
    repo = new CoachHistoryRepository(new MemoryProvider())
  })

  it('starts empty', () => {
    expect(repo.getAll()).toHaveLength(0)
    expect(repo.getTotalShown()).toBe(0)
  })

  it('appends an entry', () => {
    const entry = buildHistoryEntry(makeMessage(), 'en', '1.2')
    repo.append(entry)
    expect(repo.getAll()).toHaveLength(1)
    expect(repo.getAll()[0]?.message_id).toBe('assessment:completed:weight:a1')
  })

  it('buildHistoryEntry captures rendered text snapshot', () => {
    const msg   = makeMessage()
    const entry = buildHistoryEntry(msg, 'en', '1.2')
    expect(entry.title).toBe('Solid score.')
    expect(entry.body).toBe('You scored 72/100.')
    expect(entry.lang).toBe('en')
    expect(entry.coach_version).toBe('1.2')
    expect(entry.clicked).toBe(false)
    expect(entry.dismissed).toBe(false)
    expect(entry.action_clicked).toBeNull()
  })

  it('getForCluster filters by cluster', () => {
    repo.append(buildHistoryEntry(makeMessage({ cluster: 'weight' }), 'en', '1.2'))
    repo.append(buildHistoryEntry(makeMessage({ cluster: 'sleep', message_id: 'msg-2',
      decision: { trigger: 'assessment:completed', reason: 'good_score' } }), 'en', '1.2'))
    expect(repo.getForCluster('weight')).toHaveLength(1)
    expect(repo.getForCluster('sleep')).toHaveLength(1)
    expect(repo.getForCluster('finance')).toHaveLength(0)
  })

  it('getRecent returns last N entries', () => {
    repo.append(buildHistoryEntry(makeMessage({ message_id: 'msg-1' }), 'en', '1.2'))
    repo.append(buildHistoryEntry(makeMessage({ message_id: 'msg-2' }), 'en', '1.2'))
    repo.append(buildHistoryEntry(makeMessage({ message_id: 'msg-3' }), 'en', '1.2'))
    const recent = repo.getRecent(2)
    expect(recent).toHaveLength(2)
    expect(recent[0]?.message_id).toBe('msg-2')
    expect(recent[1]?.message_id).toBe('msg-3')
  })

  it('getByTrigger filters by trigger', () => {
    repo.append(buildHistoryEntry(makeMessage({ message_id: 'msg-1',
      decision: { trigger: 'assessment:completed', reason: 'good_score' } }), 'en', '1.2'))
    repo.append(buildHistoryEntry(makeMessage({ message_id: 'msg-2',
      decision: { trigger: 'plan:created', reason: 'first_plan' } }), 'en', '1.2'))
    expect(repo.getByTrigger('assessment:completed')).toHaveLength(1)
    expect(repo.getByTrigger('plan:created')).toHaveLength(1)
    expect(repo.getByTrigger('plan:check_in')).toHaveLength(0)
  })

  it('markClicked updates the entry', () => {
    repo.append(buildHistoryEntry(makeMessage(), 'en', '1.2'))
    repo.markClicked('assessment:completed:weight:a1', 'see_strategy')
    const entry = repo.getAll()[0]!
    expect(entry.clicked).toBe(true)
    expect(entry.action_clicked).toBe('see_strategy')
    expect(entry.dismissed).toBe(false)
  })

  it('markDismissed updates the entry', () => {
    repo.append(buildHistoryEntry(makeMessage(), 'en', '1.2'))
    repo.markDismissed('assessment:completed:weight:a1')
    expect(repo.getAll()[0]!.dismissed).toBe(true)
    expect(repo.getAll()[0]!.clicked).toBe(false)
  })

  it('getClickRate returns ratio of clicked messages', () => {
    repo.append(buildHistoryEntry(makeMessage({ message_id: 'msg-1' }), 'en', '1.2'))
    repo.append(buildHistoryEntry(makeMessage({ message_id: 'msg-2' }), 'en', '1.2'))
    repo.markClicked('msg-1', 'see_plan')
    expect(repo.getClickRate()).toBe(0.5)
  })

  it('getClickRate returns 0 when no entries', () => {
    expect(repo.getClickRate()).toBe(0)
  })

  it('clear removes all entries', () => {
    repo.append(buildHistoryEntry(makeMessage(), 'en', '1.2'))
    repo.clear()
    expect(repo.getAll()).toHaveLength(0)
  })

  it('persists across repository instances with same storage', () => {
    const storage = new MemoryProvider()
    const repo1   = new CoachHistoryRepository(storage)
    const repo2   = new CoachHistoryRepository(storage)
    repo1.append(buildHistoryEntry(makeMessage(), 'en', '1.2'))
    expect(repo2.getAll()).toHaveLength(1)
  })
})
