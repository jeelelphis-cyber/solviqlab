import { describe, it, expect } from 'vitest'
import { LocalWinsResolver, RemoteWinsResolver } from '../conflict'

const ctx = { key: 'user:data', localUpdatedAt: '2026-07-24T00:00:00.000Z', remoteUpdatedAt: null }

describe('LocalWinsResolver', () => {
  const resolver = new LocalWinsResolver()

  it('returns local when remote is null', () => {
    expect(resolver.resolve({ v: 1 }, null, ctx)).toEqual({ v: 1 })
  })

  it('returns local when remote exists (local always wins)', () => {
    expect(resolver.resolve({ v: 2 }, { v: 99 }, ctx)).toEqual({ v: 2 })
  })

  it('works with primitive values', () => {
    expect(resolver.resolve('local', 'remote', ctx)).toBe('local')
  })

  it('works with arrays', () => {
    expect(resolver.resolve([1, 2], [3, 4], ctx)).toEqual([1, 2])
  })
})

describe('RemoteWinsResolver', () => {
  const resolver = new RemoteWinsResolver()

  it('returns remote when remote exists', () => {
    expect(resolver.resolve({ v: 1 }, { v: 99 }, ctx)).toEqual({ v: 99 })
  })

  it('throws when remote is null', () => {
    expect(() => resolver.resolve({ v: 1 }, null, ctx)).toThrow()
  })
})
