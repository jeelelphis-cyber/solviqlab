import { describe, it, expect } from 'vitest'
import { NavigationResolver } from '../navigation'

describe('NavigationResolver', () => {
  const resolver = new NavigationResolver()

  it('resolves see_plan to /lang/plan/cluster', () => {
    expect(resolver.resolve('see_plan', 'weight', 'en')).toBe('/en/plan/weight')
  })

  it('resolves see_strategy to /lang/plan/cluster', () => {
    expect(resolver.resolve('see_strategy', 'sleep', 'fr')).toBe('/fr/plan/sleep')
  })

  it('resolves see_dashboard to /lang/dashboard', () => {
    expect(resolver.resolve('see_dashboard', 'weight', 'en')).toBe('/en/dashboard')
  })

  it('resolves see_assessment to /lang/assessment/cluster', () => {
    expect(resolver.resolve('see_assessment', 'finance', 'es')).toBe('/es/assessment/finance')
  })

  it('respects lang prefix across all action types', () => {
    expect(resolver.resolve('see_plan', 'fitness', 'de')).toBe('/de/plan/fitness')
  })
})
