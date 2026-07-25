import { describe, it, expect, beforeEach } from 'vitest'
import { SessionFlowEngine } from '../engine'
import type { StorageProvider } from '../../user/storage'

// In-memory storage for tests
class MemoryStorage implements StorageProvider {
  private store = new Map<string, unknown>()
  get<T>(key: string): T | null { return (this.store.get(key) as T) ?? null }
  set<T>(key: string, value: T): void { this.store.set(key, value) }
  remove(key: string): void { this.store.delete(key) }
  clear(): void { this.store.clear() }
  isAvailable(): boolean { return true }
}

describe('SessionFlowEngine', () => {
  let storage: MemoryStorage
  let engine:  SessionFlowEngine

  beforeEach(() => {
    storage = new MemoryStorage()
    engine  = new SessionFlowEngine(storage, 'user-1')
  })

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts at landing', () => {
    expect(engine.getState()).toBe('landing')
  })

  it('data defaults are null', () => {
    const d = engine.getData()
    expect(d.name).toBeNull()
    expect(d.goal).toBeNull()
    expect(d.videoId).toBeNull()
    expect(d.assessmentScore).toBeNull()
  })

  it('generates a sessionId', () => {
    expect(engine.getSessionId()).toHaveLength(8)
  })

  // ── Advance ───────────────────────────────────────────────────────────────

  it('advance moves through linear flow', () => {
    expect(engine.advance()).toBe('calculator')
    expect(engine.advance()).toBe('assessment')
    expect(engine.advance()).toBe('result')
    expect(engine.advance()).toBe('mia_intro')
  })

  it('advance with patch merges data', () => {
    engine.advance({ name: 'Alex' })
    expect(engine.getData().name).toBe('Alex')
  })

  it('advance marks current state as completed', () => {
    engine.advance()
    expect(engine.isCompleted('landing')).toBe(true)
  })

  // ── Goto ──────────────────────────────────────────────────────────────────

  it('goto jumps to explicit state', () => {
    engine.goto('mia_intro')
    expect(engine.getState()).toBe('mia_intro')
  })

  it('goto with patch merges data', () => {
    engine.goto('result', { assessmentScore: 72 })
    expect(engine.getData().assessmentScore).toBe(72)
  })

  // ── setData ───────────────────────────────────────────────────────────────

  it('setData merges without changing state', () => {
    engine.setData({ name: 'Maria', goal: 'lose_weight' })
    expect(engine.getState()).toBe('landing')
    expect(engine.getData().name).toBe('Maria')
    expect(engine.getData().goal).toBe('lose_weight')
  })

  it('setData updates lastSeenAt', () => {
    const before = new Date(engine.getData().lastSeenAt).getTime()
    engine.setData({ name: 'test' })
    const after  = new Date(engine.getData().lastSeenAt).getTime()
    expect(after).toBeGreaterThanOrEqual(before)
  })

  // ── Persistence ───────────────────────────────────────────────────────────

  it('persists snapshot to storage', () => {
    engine.goto('result', { assessmentScore: 65 })
    const restored = new SessionFlowEngine(storage, 'user-1')
    expect(restored.getState()).toBe('result')
    expect(restored.getData().assessmentScore).toBe(65)
  })

  it('fresh session for different userId', () => {
    engine.goto('video')
    const other = new SessionFlowEngine(storage, 'user-2')
    expect(other.getState()).toBe('landing')
  })

  // ── Reset ─────────────────────────────────────────────────────────────────

  it('reset starts a fresh session', () => {
    engine.goto('premium', { name: 'Alex' })
    engine.reset()
    expect(engine.getState()).toBe('landing')
    expect(engine.getData().name).toBeNull()
    expect(engine.isCompleted('premium')).toBe(false)
  })

  it('reset generates a new sessionId', () => {
    const id1 = engine.getSessionId()
    engine.reset()
    const id2 = engine.getSessionId()
    expect(id1).not.toBe(id2)
  })

  // ── Snapshot ──────────────────────────────────────────────────────────────

  it('snapshot reflects history', () => {
    engine.advance()
    engine.advance()
    const snap = engine.getSnapshot()
    expect(snap.history.length).toBe(3)  // landing + calculator + assessment
    expect(snap.completedStates).toContain('landing')
    expect(snap.completedStates).toContain('calculator')
  })

  // ── Full flow ─────────────────────────────────────────────────────────────

  it('full flow completes all states', () => {
    const states: string[] = [engine.getState()]
    while (engine.getState() !== 'return_tomorrow') {
      states.push(engine.advance())
    }
    expect(states).toEqual([
      'landing', 'calculator', 'assessment', 'result',
      'mia_intro', 'onboarding', 'generating', 'video',
      'first_action', 'premium', 'return_tomorrow',
    ])
  })
})
