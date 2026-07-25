import { describe, it, expect, beforeEach } from 'vitest'
import { GraphRepository } from '../repository'
import { MemoryProvider } from '../../user/storage'

function makeRepo() {
  return new GraphRepository(new MemoryProvider())
}

describe('GraphRepository', () => {
  it('returns null for unknown user', () => {
    expect(makeRepo().get('unknown')).toBeNull()
  })

  it('getOrCreate returns a default graph with correct userId', () => {
    const repo  = makeRepo()
    const graph = repo.getOrCreate('u1')
    expect(graph.userId).toBe('u1')
    expect(graph.version).toBe(1)
    expect(graph.identity.userType).toBe('anonymous')
    expect(graph.goals.items).toHaveLength(0)
  })

  it('getOrCreate returns existing graph on second call', () => {
    const repo = makeRepo()
    const a    = repo.getOrCreate('u1')
    const b    = repo.getOrCreate('u1')
    expect(b.createdAt).toBe(a.createdAt)
  })

  it('save + get round-trips mutations correctly', () => {
    const repo  = makeRepo()
    const graph = repo.getOrCreate('u1')
    const modified = { ...graph, identity: { ...graph.identity, language: 'fr', updatedAt: graph.identity.updatedAt } }
    repo.save(modified)
    expect(repo.get('u1')?.identity.language).toBe('fr')
  })

  it('delete removes the graph', () => {
    const repo = makeRepo()
    repo.getOrCreate('u2')
    repo.delete('u2')
    expect(repo.get('u2')).toBeNull()
  })

  it('isolates graphs by userId', () => {
    const repo = makeRepo()
    repo.getOrCreate('u1')
    repo.getOrCreate('u2')
    expect(repo.get('u1')?.userId).toBe('u1')
    expect(repo.get('u2')?.userId).toBe('u2')
  })
})
