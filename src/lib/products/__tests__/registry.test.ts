import { describe, it, expect, beforeEach } from 'vitest'
import { ProductRegistry } from '../registry'
import { BMIGraphMapper }  from '../mappers/weight'
import { WeightJourney }   from '../journeys/weight'

describe('ProductRegistry', () => {
  let registry: ProductRegistry

  beforeEach(() => {
    registry = new ProductRegistry()
  })

  // ── Registration ───────────────────────────────────────────────────────────

  it('registers a product', () => {
    registry.register({ slug: 'bmi-calculator', name: 'BMI Calculator', cluster: 'weight', category: 'calculator' })
    expect(registry.has('bmi-calculator')).toBe(true)
    expect(registry.count()).toBe(1)
  })

  it('registered product gets default coach (mia)', () => {
    registry.register({ slug: 'bmi-calculator', name: 'BMI Calculator', cluster: 'weight', category: 'calculator' })
    expect(registry.get('bmi-calculator')?.coach?.id).toBe('mia')
  })

  it('custom coach is preserved', () => {
    registry.register({ slug: 'budget-calc', name: 'Budget', cluster: 'finance', category: 'calculator', coach: { id: 'alex' } })
    expect(registry.get('budget-calc')?.coach?.id).toBe('alex')
  })

  it('registeredAt is set', () => {
    registry.register({ slug: 'test', name: 'Test', cluster: 'utility', category: 'calculator' })
    expect(registry.get('test')?.registeredAt).toBeTruthy()
  })

  // ── Lookup ─────────────────────────────────────────────────────────────────

  it('get returns null for unknown slug', () => {
    expect(registry.get('unknown')).toBeNull()
  })

  it('getByCluster filters correctly', () => {
    registry.register({ slug: 'bmi-calculator', name: 'BMI', cluster: 'weight',  category: 'calculator' })
    registry.register({ slug: 'body-fat',        name: 'BF',  cluster: 'weight',  category: 'calculator' })
    registry.register({ slug: 'sleep-calc',      name: 'Sleep', cluster: 'sleep', category: 'calculator' })

    expect(registry.getByCluster('weight').length).toBe(2)
    expect(registry.getByCluster('sleep').length).toBe(1)
    expect(registry.getByCluster('finance').length).toBe(0)
  })

  it('getAll returns all registered products', () => {
    registry.register({ slug: 'a', name: 'A', cluster: 'weight', category: 'calculator' })
    registry.register({ slug: 'b', name: 'B', cluster: 'sleep',  category: 'calculator' })
    expect(registry.getAll()).toHaveLength(2)
  })

  // ── GraphMapper ────────────────────────────────────────────────────────────

  it('graphMapper is preserved after registration', () => {
    const mapper = new BMIGraphMapper()
    registry.register({ slug: 'bmi-calculator', name: 'BMI', cluster: 'weight', category: 'calculator', graphMapper: mapper })
    expect(registry.get('bmi-calculator')?.graphMapper).toBe(mapper)
  })

  it('product without graphMapper has undefined graphMapper', () => {
    registry.register({ slug: 'tip-calc', name: 'Tip', cluster: 'utility', category: 'calculator' })
    expect(registry.get('tip-calc')?.graphMapper).toBeUndefined()
  })

  // ── Journey ────────────────────────────────────────────────────────────────

  it('journey is preserved', () => {
    registry.register({ slug: 'bmi', name: 'BMI', cluster: 'weight', category: 'calculator', journey: WeightJourney })
    expect(registry.get('bmi')?.journey?.id).toBe('weight-30')
    expect(registry.get('bmi')?.journey?.steps.length).toBeGreaterThan(5)
  })
})

// ── BMIGraphMapper ─────────────────────────────────────────────────────────

import { GraphRepository } from '../../graph/repository'
import { GraphUpdater }    from '../../graph/updater'
import type { StorageProvider } from '../../user/storage'

class MemoryStorage implements StorageProvider {
  private store = new Map<string, unknown>()
  get<T>(key: string): T | null { return (this.store.get(key) as T) ?? null }
  set<T>(key: string, v: T): void { this.store.set(key, v) }
  remove(key: string): void { this.store.delete(key) }
  clear(): void { this.store.clear() }
  isAvailable(): boolean { return true }
}

describe('BMIGraphMapper', () => {
  let updater: GraphUpdater
  let repo:    GraphRepository

  beforeEach(() => {
    const storage = new MemoryStorage()
    repo    = new GraphRepository(storage)
    updater = new GraphUpdater(repo)
  })

  it('maps normal BMI to high score', () => {
    const mapper = new BMIGraphMapper()
    mapper.map({ slug: 'bmi-calculator', name: 'BMI', value: 22.5, metadata: { bmi: 22.5, category: 'normal' } }, 'u1', updater)
    const graph = repo.get('u1')!
    expect(graph.assessments.items[0]?.score).toBeGreaterThan(75)
  })

  it('maps overweight BMI to lower score', () => {
    const mapper = new BMIGraphMapper()
    mapper.map({ slug: 'bmi-calculator', name: 'BMI', value: 28.0, metadata: { bmi: 28.0, category: 'overweight' } }, 'u1', updater)
    const graph = repo.get('u1')!
    expect(graph.assessments.items[0]?.score).toBeLessThan(65)
  })

  it('adds memory fact for non-normal BMI', () => {
    const mapper = new BMIGraphMapper()
    mapper.map({ slug: 'bmi-calculator', name: 'BMI', value: 31.0, metadata: { bmi: 31.0, category: 'obese' } }, 'u1', updater)
    const graph = repo.get('u1')!
    expect(graph.coachMemory.facts.some(f => f.id === 'bmi-category')).toBe(true)
  })

  it('does NOT add memory fact for normal BMI', () => {
    const mapper = new BMIGraphMapper()
    mapper.map({ slug: 'bmi-calculator', name: 'BMI', value: 22.0, metadata: { bmi: 22.0, category: 'normal' } }, 'u1', updater)
    const graph = repo.get('u1')!
    expect(graph.coachMemory.facts.some(f => f.id === 'bmi-category')).toBe(false)
  })
})
