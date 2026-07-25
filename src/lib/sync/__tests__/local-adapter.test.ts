import { describe, it, expect, beforeEach } from 'vitest'
import { LocalSyncAdapter } from '../local-adapter'
import { MemoryProvider } from '../../user/storage'

interface TestItem { value: number }

describe('LocalSyncAdapter', () => {
  let adapter: LocalSyncAdapter<TestItem>
  let storage: MemoryProvider

  beforeEach(() => {
    storage = new MemoryProvider()
    adapter = new LocalSyncAdapter<TestItem>(storage, 'test')
  })

  it('get() returns null for missing key', () => {
    expect(adapter.get('foo')).toBeNull()
  })

  it('set() then get() round-trips the value', () => {
    adapter.set('foo', { value: 42 })
    expect(adapter.get('foo')).toEqual({ value: 42 })
  })

  it('set() marks key as pending', () => {
    adapter.set('foo', { value: 1 })
    expect(adapter.getPendingSyncKeys()).toContain('foo')
  })

  it('markSynced() removes key from pending', () => {
    adapter.set('foo', { value: 1 })
    adapter.markSynced('foo')
    expect(adapter.getPendingSyncKeys()).not.toContain('foo')
  })

  it('remove() deletes value from storage', () => {
    adapter.set('foo', { value: 1 })
    adapter.remove('foo')
    expect(adapter.get('foo')).toBeNull()
  })

  it('remove() removes key from pending', () => {
    adapter.set('foo', { value: 1 })
    adapter.remove('foo')
    expect(adapter.getPendingSyncKeys()).not.toContain('foo')
  })

  it('namespaces keys — different adapters do not collide', () => {
    const adapterA = new LocalSyncAdapter<TestItem>(storage, 'ns-a')
    const adapterB = new LocalSyncAdapter<TestItem>(storage, 'ns-b')
    adapterA.set('key', { value: 10 })
    adapterB.set('key', { value: 99 })
    expect(adapterA.get('key')).toEqual({ value: 10 })
    expect(adapterB.get('key')).toEqual({ value: 99 })
  })

  it('getPendingSyncKeys() starts empty', () => {
    expect(adapter.getPendingSyncKeys()).toHaveLength(0)
  })

  it('multiple sets accumulate pending keys', () => {
    adapter.set('a', { value: 1 })
    adapter.set('b', { value: 2 })
    adapter.set('c', { value: 3 })
    expect(adapter.getPendingSyncKeys()).toHaveLength(3)
  })

  it('markSynced() on unknown key is a no-op', () => {
    expect(() => adapter.markSynced('nonexistent')).not.toThrow()
  })

  it('data persists in underlying storage — two adapter instances share data', () => {
    const adapter2 = new LocalSyncAdapter<TestItem>(storage, 'test')
    adapter.set('shared', { value: 7 })
    expect(adapter2.get('shared')).toEqual({ value: 7 })
  })

  it('pending keys are per-instance — not shared', () => {
    const adapter2 = new LocalSyncAdapter<TestItem>(storage, 'test')
    adapter.set('shared', { value: 7 })
    // adapter2 did not call set(), so its pending list is empty
    expect(adapter2.getPendingSyncKeys()).toHaveLength(0)
  })
})
