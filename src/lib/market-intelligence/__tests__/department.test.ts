import { describe, it, expect } from 'vitest'
import { MarketIntelligenceDepartment }                                    from '../department'
import { MockKeywordSource, MockCompetitorSource, MockTrendSource, MockCommunitySource, UnavailableSource } from '../sources/mock'
import { DataSourceRegistry } from '../sources/types'

describe('MarketIntelligenceDepartment', () => {

  // ── Setup ──────────────────────────────────────────────────────────────────

  function makeDept() {
    return new MarketIntelligenceDepartment([
      new MockKeywordSource({
        keywords:  [
          { keyword: 'sleep debt calculator', volume: 45_000, difficulty: 25, cpc: 2.0, intent: 'informational', source: 'manual', hasSnippet: false },
          { keyword: 'sleep debt', volume: 20_000, difficulty: 30, cpc: 1.5, intent: 'informational', source: 'manual', hasSnippet: false },
        ],
        questions: ['What is sleep debt?', 'How to fix sleep debt?'],
        related:   ['sleep tracker', 'sleep quality'],
      }),
      new MockCompetitorSource({
        competitors: [
          { url: 'sleepdoctor.com', domain: 'sleepdoctor.com', title: 'Sleep Guide', position: 1, da: 50,
            strengths: ['authority'], weaknesses: ['no tool', 'no AI'], gaps: ['calculator', 'AI coach'] },
        ],
        featuredSnippetExists: false,
        adCount: 2,
      }),
      new MockTrendSource({
        trend:          'rising',
        relatedQueries: ['sleep debt recovery'],
        peakMonth:      '2026-01',
      }),
      new MockCommunitySource({
        formulations: ["I wake up tired", "can't sleep well", "always exhausted"],
        mentions:     ['r/sleep', 'r/insomnia'],
        sentiment:    'negative',
      }),
    ])
  }

  // ── Core research ──────────────────────────────────────────────────────────

  it('returns a ProductResearchPackage', async () => {
    const dept = makeDept()
    const pkg  = await dept.research({ problem: "can't sleep", cluster: 'sleep' })
    expect(pkg.schemaVersion).toBe(1)
    expect(pkg.problem.coreProblem).toBe("can't sleep")
  })

  it('package has a valid id', async () => {
    const pkg = await makeDept().research({ problem: 'sleep debt', cluster: 'sleep' })
    expect(pkg.id).toMatch(/^pkg_/)
  })

  it('package priority.total is within 0–100', async () => {
    const pkg = await makeDept().research({ problem: 'sleep debt', cluster: 'sleep' })
    expect(pkg.priority.total).toBeGreaterThanOrEqual(0)
    expect(pkg.priority.total).toBeLessThanOrEqual(100)
  })

  it('high-potential sleep product gets build_now verdict', async () => {
    const pkg = await makeDept().research({ problem: "sleep debt", cluster: 'sleep' })
    expect(['build_now', 'build_soon']).toContain(pkg.priority.verdict)
  })

  it('community formulations appear in problem.userFormulations', async () => {
    const pkg = await makeDept().research({ problem: "can't sleep", cluster: 'sleep' })
    expect(pkg.problem.userFormulations.length).toBeGreaterThan(0)
  })

  it('trend is passed through from trend source', async () => {
    const pkg = await makeDept().research({ problem: "sleep debt", cluster: 'sleep' })
    expect(pkg.problem.trend).toBe('rising')
  })

  it('competitors appear in serp', async () => {
    const pkg = await makeDept().research({ problem: "sleep debt", cluster: 'sleep' })
    expect(pkg.serp.topCompetitors.length).toBe(1)
    expect(pkg.serp.topCompetitors[0]?.gaps).toContain('calculator')
  })

  it('sources list reflects all source ids', async () => {
    const pkg = await makeDept().research({ problem: "sleep debt", cluster: 'sleep' })
    expect(pkg.sources).toContain('mock-keywords')
    expect(pkg.sources).toContain('mock-competitors')
  })

  // ── Resilience ─────────────────────────────────────────────────────────────

  it('works with zero sources', async () => {
    const dept = new MarketIntelligenceDepartment([])
    const pkg  = await dept.research({ problem: 'bmi calculator', cluster: 'weight' })
    expect(pkg.priority.total).toBeGreaterThanOrEqual(0)
  })

  it('skips unavailable sources', async () => {
    const dept = new MarketIntelligenceDepartment([
      new UnavailableSource(),
      new MockTrendSource({ trend: 'rising' }),
    ])
    const pkg = await dept.research({ problem: 'bmi', cluster: 'weight' })
    expect(pkg.problem.trend).toBe('rising')
  })

  // ── Introspection ──────────────────────────────────────────────────────────

  it('sourceCount returns total registered sources', () => {
    const dept = makeDept()
    expect(dept.sourceCount).toBe(4)
  })

  it('availableSourceCount returns only available sources', () => {
    const dept = new MarketIntelligenceDepartment([
      new MockKeywordSource(),
      new UnavailableSource(),
    ])
    expect(dept.availableSourceCount).toBe(1)
  })

  it('sourceStatus returns correct availability per source', () => {
    const dept = new MarketIntelligenceDepartment([
      new MockKeywordSource(),
      new UnavailableSource(),
    ])
    const statuses = dept.sourceStatus()
    expect(statuses.find(s => s.id === 'mock-keywords')?.available).toBe(true)
    expect(statuses.find(s => s.id === 'unavailable')?.available).toBe(false)
  })

  // ── Batch ──────────────────────────────────────────────────────────────────

  it('researchBatch returns a package per query', async () => {
    const dept    = makeDept()
    const results = await dept.researchBatch([
      { problem: 'sleep debt',  cluster: 'sleep'  },
      { problem: 'bmi',         cluster: 'weight' },
    ])
    expect(results).toHaveLength(2)
    expect(results[0]?.problem.coreProblem).toBe('sleep debt')
    expect(results[1]?.problem.coreProblem).toBe('bmi')
  })

  // ── DataSourceRegistry ─────────────────────────────────────────────────────

  it('DataSourceRegistry tracks available sources', () => {
    const registry = new DataSourceRegistry()
    registry.register(new MockKeywordSource())
    registry.register(new UnavailableSource())
    expect(registry.count()).toBe(2)
    expect(registry.availableCount()).toBe(1)
  })

  it('DataSourceRegistry.getById returns the source', () => {
    const registry = new DataSourceRegistry()
    registry.register(new MockTrendSource())
    expect(registry.getById('mock-trends')).toBeTruthy()
    expect(registry.getById('nonexistent')).toBeNull()
  })
})
