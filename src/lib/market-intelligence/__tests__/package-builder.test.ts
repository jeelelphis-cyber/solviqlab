import { describe, it, expect } from 'vitest'
import { ProductResearchPackageBuilder } from '../package-builder'
import type { SourceResult } from '../sources/types'

function makeSleepResults(): SourceResult[] {
  return [
    {
      type:      'keywords',
      sourceId:  'dataforseo',
      keywords:  [
        { keyword: 'sleep debt calculator', volume: 40_000, difficulty: 22, cpc: 2.1, intent: 'informational', source: 'dataforseo', hasSnippet: false },
        { keyword: 'sleep debt',            volume: 30_000, difficulty: 28, cpc: 1.5, intent: 'informational', source: 'dataforseo', hasSnippet: false },
        { keyword: 'how much sleep do I need to catch up on sleep debt', volume: 4_000, difficulty: 15, cpc: 0.8, intent: 'informational', source: 'paa', hasSnippet: true },
      ],
      questions: ['How do you calculate sleep debt?', 'Is sleep debt real?'],
      related:   ['sleep tracker', 'sleep quality quiz'],
    },
    {
      type:                  'competitors',
      sourceId:              'serp-scraper',
      competitors: [
        { url: 'sleepdoctor.com/debt', domain: 'sleepdoctor.com', title: 'Sleep Debt', position: 1, da: 45,
          strengths: ['authority'], weaknesses: ['no calculator', 'no AI'], gaps: ['calculator', 'personalised advice'] },
      ],
      featuredSnippetExists: false,
      adCount:               2,
    },
    {
      type:           'trend',
      sourceId:       'google-trends',
      trend:          'rising',
      relatedQueries: ['sleep debt recovery', 'catch up on sleep'],
      peakMonth:      '2026-01',
    },
    {
      type:          'community',
      sourceId:      'reddit',
      formulations:  ["I wake up tired even after 8h", "why do I need 10h of sleep", "can't fall asleep anymore"],
      mentions:      ['r/sleep', 'r/askdoctors', 'r/fatigue'],
      sentiment:     'negative',
    },
  ]
}

describe('ProductResearchPackageBuilder', () => {
  const builder = new ProductResearchPackageBuilder()

  it('builds a package with correct schema version', () => {
    const pkg = builder.build({
      query:     { problem: "sleep debt", cluster: 'sleep' },
      results:   makeSleepResults(),
      sourceIds: ['dataforseo', 'serp-scraper', 'google-trends', 'reddit'],
    })
    expect(pkg.schemaVersion).toBe(1)
  })

  it('package id includes the problem slug', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.id).toContain('sleep-debt')
  })

  it('createdAt is a valid ISO string', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(() => new Date(pkg.createdAt)).not.toThrow()
    expect(new Date(pkg.createdAt).getTime()).toBeGreaterThan(0)
  })

  it('problem.coreProblem matches query.problem', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.problem.coreProblem).toBe('sleep debt')
  })

  it('problem.trend comes from trend source', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.problem.trend).toBe('rising')
  })

  it('problem.userFormulations come from community source', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.problem.userFormulations.length).toBeGreaterThan(0)
    expect(pkg.problem.userFormulations[0]).toContain('wake up tired')
  })

  it('keywords.primary contains short keywords', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    // "sleep debt calculator" = 3 words → primary; "how much sleep do I need..." = longtail
    expect(pkg.keywords.primary.length).toBeGreaterThan(0)
    pkg.keywords.primary.forEach(k => {
      expect(k.keyword.split(' ').length).toBeLessThanOrEqual(3)
    })
  })

  it('keywords.longtail contains multi-word keywords', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.keywords.longtail.length).toBeGreaterThan(0)
    pkg.keywords.longtail.forEach(k => {
      expect(k.keyword.split(' ').length).toBeGreaterThan(3)
    })
  })

  it('questions come from keyword source', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.keywords.questions).toContain('How do you calculate sleep debt?')
  })

  it('serp.topCompetitors has correct data', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.serp.topCompetitors.length).toBe(1)
    expect(pkg.serp.topCompetitors[0]?.gaps).toContain('calculator')
  })

  it('seo.totalVolume sums all keyword volumes', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.seo.totalVolume).toBe(74_000)  // 40k + 30k + 4k
  })

  it('aiCoach.personalizable is true for sleep cluster', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.aiCoach.personalizable).toBe(true)
    expect(pkg.aiCoach.returnable).toBe(true)
    expect(pkg.aiCoach.journeyFit).toBe(true)
  })

  it('aiCoach.personalizable is false for utility cluster', () => {
    const pkg = builder.build({
      query:     { problem: 'tip calculator', cluster: 'utility' },
      results:   [],
      sourceIds: [],
    })
    expect(pkg.aiCoach.personalizable).toBe(false)
  })

  it('recommendation.slug is url-safe', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.recommendation.slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('recommendation.mvpScope includes AI steps for health cluster', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.recommendation.mvpScope).toContain('Mia intro block')
    expect(pkg.recommendation.mvpScope).toContain('UserGraph mapping')
  })

  it('recommendation.aiJourneySteps is 7 for health cluster', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.recommendation.aiJourneySteps).toBe(7)
  })

  it('priority.total is within 0–100', () => {
    const pkg = builder.build({ query: { problem: 'sleep debt', cluster: 'sleep' }, results: makeSleepResults(), sourceIds: [] })
    expect(pkg.priority.total).toBeGreaterThanOrEqual(0)
    expect(pkg.priority.total).toBeLessThanOrEqual(100)
  })

  it('builds package with no sources gracefully', () => {
    const pkg = builder.build({ query: { problem: 'unknown problem', cluster: 'utility' }, results: [], sourceIds: [] })
    expect(pkg.priority.total).toBeGreaterThanOrEqual(0)
    expect(pkg.priority.verdict).toBeDefined()
  })

  it('sources list is stored in package', () => {
    const pkg = builder.build({
      query:     { problem: 'sleep debt', cluster: 'sleep' },
      results:   makeSleepResults(),
      sourceIds: ['dataforseo', 'reddit'],
    })
    expect(pkg.sources).toContain('dataforseo')
    expect(pkg.sources).toContain('reddit')
  })
})
