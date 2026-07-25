import { describe, it, expect, beforeEach } from 'vitest'
import { SyncQueue } from '../queue'
import { MemoryProvider } from '../../user/storage'

describe('SyncQueue', () => {
  let queue: SyncQueue

  beforeEach(() => {
    queue = new SyncQueue(new MemoryProvider())
  })

  it('starts empty', () => {
    expect(queue.size()).toBe(0)
    expect(queue.getRetryable()).toHaveLength(0)
  })

  it('enqueue() adds an entry', () => {
    queue.enqueue('user:data', { name: 'Alice' })
    expect(queue.size()).toBe(1)
    expect(queue.getRetryable()).toHaveLength(1)
  })

  it('enqueue() upserts by key — same key updates payload, no duplicate', () => {
    queue.enqueue('user:data', { v: 1 })
    queue.enqueue('user:data', { v: 2 })
    expect(queue.size()).toBe(1)
    expect(queue.getRetryable()[0]?.payload).toEqual({ v: 2 })
  })

  it('enqueue() different keys creates separate entries', () => {
    queue.enqueue('user:data', { a: 1 })
    queue.enqueue('coach:history', { b: 2 })
    expect(queue.size()).toBe(2)
  })

  it('markAttempted(success) removes the entry', () => {
    queue.enqueue('k', 'v')
    const id = queue.getRetryable()[0]!.id
    queue.markAttempted(id, true)
    expect(queue.size()).toBe(0)
  })

  it('markAttempted(failure) increments attempt count', () => {
    queue.enqueue('k', 'v')
    const id = queue.getRetryable()[0]!.id
    queue.markAttempted(id, false)
    expect(queue.getRetryable()[0]?.attempts).toBe(1)
    expect(queue.getRetryable()[0]?.last_attempt_at).not.toBeNull()
  })

  it('entry is excluded from retryable after 5 failures', () => {
    queue.enqueue('k', 'v')
    let id = queue.getRetryable()[0]!.id
    for (let i = 0; i < 5; i++) {
      queue.markAttempted(id, false)
      id = queue.getRetryable()[0]?.id ?? id
    }
    expect(queue.getRetryable()).toHaveLength(0)
    expect(queue.getDead()).toHaveLength(1)
  })

  it('getDead() returns entries with max attempts exceeded', () => {
    queue.enqueue('k', 'v')
    const id = queue.getRetryable()[0]!.id
    for (let i = 0; i < 5; i++) queue.markAttempted(id, false)
    expect(queue.getDead()).toHaveLength(1)
  })

  it('clear() empties the queue', () => {
    queue.enqueue('a', 1)
    queue.enqueue('b', 2)
    queue.clear()
    expect(queue.size()).toBe(0)
  })

  it('persists across instances with same storage', () => {
    const storage = new MemoryProvider()
    const q1      = new SyncQueue(storage)
    const q2      = new SyncQueue(storage)
    q1.enqueue('key', 'value')
    expect(q2.size()).toBe(1)
  })

  it('markAttempted() on unknown id is a no-op', () => {
    queue.enqueue('k', 'v')
    expect(() => queue.markAttempted('nonexistent-id', false)).not.toThrow()
    expect(queue.size()).toBe(1)
  })
})
