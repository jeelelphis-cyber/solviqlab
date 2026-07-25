import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncEngine } from '../engine'
import { NoOpCloudAdapter } from '../cloud-adapter'
import { LocalWinsResolver } from '../conflict'
import { MemoryProvider } from '../../user/storage'
import type { CloudSyncAdapter, CloudPushResult } from '../cloud-adapter'

function makeEngine(adapter?: CloudSyncAdapter) {
  const storage = new MemoryProvider()
  return new SyncEngine(storage, adapter ?? new NoOpCloudAdapter(), new LocalWinsResolver())
}

// Adapter that simulates an available cloud backend
function onlineAdapter(pushFails = false): CloudSyncAdapter {
  return {
    async isAvailable() { return true },
    async push<T>(_k: string, _v: T): Promise<CloudPushResult> {
      return pushFails ? { success: false, error: 'Server error' } : { success: true }
    },
    async pull<T>(_k: string): Promise<T | null> { return null },
  }
}

describe('SyncEngine', () => {
  it('getStatus() starts idle with zero pending', () => {
    const engine = makeEngine()
    const status = engine.getStatus()
    expect(status.state).toBe('idle')
    expect(status.pendingCount).toBe(0)
    expect(status.lastSyncedAt).toBeNull()
    expect(status.lastError).toBeNull()
  })

  it('schedule() enqueues into SyncQueue', () => {
    const engine = makeEngine()
    engine.schedule('user:data', { name: 'Test' })
    expect(engine.getStatus().pendingCount).toBe(1)
  })

  it('flush() marks offline when adapter is unavailable', async () => {
    const engine = makeEngine()  // NoOpCloudAdapter always unavailable
    engine.schedule('k', 'v')
    await engine.flush()
    expect(engine.getStatus().state).toBe('offline')
    expect(engine.getStatus().pendingCount).toBe(1)  // entry not removed
  })

  it('flush() processes queue when adapter is online', async () => {
    const engine = makeEngine(onlineAdapter())
    engine.schedule('user:data', { v: 1 })
    await engine.flush()
    expect(engine.getStatus().state).toBe('idle')
    expect(engine.getStatus().pendingCount).toBe(0)
    expect(engine.getStatus().lastSyncedAt).not.toBeNull()
  })

  it('flush() sets error state when push fails', async () => {
    const engine = makeEngine(onlineAdapter(true))
    engine.schedule('k', 'v')
    await engine.flush()
    expect(engine.getStatus().state).toBe('error')
    expect(engine.getStatus().lastError).toBe('Server error')
  })

  it('flush() retries entries that previously failed', async () => {
    const engine  = makeEngine(onlineAdapter(true))
    engine.schedule('k', 'v')
    await engine.flush()  // first attempt fails
    expect(engine.queue.getRetryable()).toHaveLength(1)
    expect(engine.queue.getRetryable()[0]?.attempts).toBe(1)
  })

  it('entry is not retried after 5 failures', async () => {
    const engine = makeEngine(onlineAdapter(true))
    engine.schedule('k', 'v')
    for (let i = 0; i < 5; i++) await engine.flush()
    expect(engine.queue.getRetryable()).toHaveLength(0)
    expect(engine.queue.getDead()).toHaveLength(1)
  })

  it('startBackgroundSync() returns a cancel function', () => {
    vi.useFakeTimers()
    const engine  = makeEngine(onlineAdapter())
    const cancel  = engine.startBackgroundSync(1000)
    expect(typeof cancel).toBe('function')
    cancel()
    vi.useRealTimers()
  })

  it('startBackgroundSync() triggers flush on interval', async () => {
    vi.useFakeTimers()
    const adapter = onlineAdapter()
    const pushSpy = vi.spyOn(adapter, 'push')
    const engine  = makeEngine(adapter)
    engine.schedule('k', 'v')
    const cancel  = engine.startBackgroundSync(1000)
    // Advance exactly one interval and let async microtasks settle
    await vi.advanceTimersByTimeAsync(1000)
    cancel()
    expect(pushSpy).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('flush() is idempotent on empty queue', async () => {
    const engine = makeEngine(onlineAdapter())
    await engine.flush()
    await engine.flush()
    expect(engine.getStatus().state).toBe('idle')
  })
})
