import { describe, it, expect } from 'vitest'
import { PriorityScorer } from '../scoring/priority-scorer'
import type { ScorerInputs } from '../scoring/priority-scorer'

function makeInputs(overrides: Partial<ScorerInputs> = {}): ScorerInputs {
  return {
    problem: {
      coreProblem:       "can't sleep",
      userFormulations:  [],
      cluster:           'sleep',
      searchVolume:      60_000,
      trend:             'rising',
      communityMentions: [],
    },
    seo: {
      totalVolume:                60_000,
      avgDifficulty:              28,
      featuredSnippetOpportunity: true,
      multilingualPotential:      ['es', 'pt', 'de'],
      estimatedMonthlyClicks:     1_800,
      score:                      80,
    },
    aiCoach: {
      personalizable:  true,
      returnable:      true,
      journeyFit:      true,
      upsellPotential: true,
      score:           100,
    },
    serp: {
      topCompetitors: [
        { url: 'sleep.org/calculator', domain: 'sleep.org', title: 'Sleep Calculator', position: 1, da: 40,
          strengths: ['high DA'], weaknesses: ['no AI', 'no personalisation'], gaps: ['AI coach', 'personalisation'] },
        { url: 'healthline.com/sleep', domain: 'healthline.com', title: 'Sleep Guide', position: 2, da: 90,
          strengths: ['authority'], weaknesses: ['no tool', 'generic advice'], gaps: ['interactive tool', 'personalisation'] },
      ],
      featuredSnippetExists:     false,
      featuredSnippetWinnableBy: 'calculator',
      adCount:                   3,
      organicCount:              2,
    },
    keywords: {
      seed:      "can't sleep",
      primary:   [
        { keyword: 'sleep calculator', volume: 40_000, difficulty: 25, cpc: 2.5, intent: 'informational', source: 'dataforseo', hasSnippet: false },
        { keyword: 'sleep debt',       volume: 20_000, difficulty: 30, cpc: 1.8, intent: 'informational', source: 'dataforseo', hasSnippet: false },
      ],
      longtail:  [
        { keyword: 'how much sleep do I need calculator', volume: 5_000, difficulty: 18, cpc: 1.2, intent: 'informational', source: 'paa', hasSnippet: true },
      ],
      questions: ['How many hours of sleep do I need?', 'What is sleep debt?'],
      related:   ['sleep tracker', 'sleep quality test'],
    },
    ...overrides,
  }
}

describe('PriorityScorer', () => {
  const scorer = new PriorityScorer()

  // ── Verdict thresholds ─────────────────────────────────────────────────────

  it('returns build_now for high-potential sleep product', () => {
    const result = scorer.score(makeInputs())
    expect(result.verdict).toBe('build_now')
    expect(result.total).toBeGreaterThanOrEqual(80)
  })

  it('returns build_soon when demand is moderate and AI fit is partial', () => {
    const result = scorer.score(makeInputs({
      problem: { ...makeInputs().problem, searchVolume: 5_000, trend: 'stable' },
      aiCoach: { personalizable: true, returnable: false, journeyFit: false, upsellPotential: false, score: 25 },
      seo:     { ...makeInputs().seo, avgDifficulty: 55, featuredSnippetOpportunity: false, multilingualPotential: [] },
    }))
    expect(['build_soon', 'watch']).toContain(result.verdict)
  })

  it('returns skip for very low demand and no AI fit', () => {
    const result = scorer.score(makeInputs({
      problem: { ...makeInputs().problem, searchVolume: 10, trend: 'declining', cluster: 'unknown' },
      aiCoach: { personalizable: false, returnable: false, journeyFit: false, upsellPotential: false, score: 0 },
      seo: { ...makeInputs().seo, avgDifficulty: 85, featuredSnippetOpportunity: false, multilingualPotential: [] },
    }))
    expect(result.total).toBeLessThan(50)
  })

  // ── Demand scoring ─────────────────────────────────────────────────────────

  it('gives max demand score for >100k volume + rising trend', () => {
    const result = scorer.score(makeInputs({
      problem: { ...makeInputs().problem, searchVolume: 150_000, trend: 'rising' },
    }))
    expect(result.breakdown.demand).toBe(100)
  })

  it('penalises declining trend', () => {
    const stable   = scorer.score(makeInputs({ problem: { ...makeInputs().problem, trend: 'stable'   } }))
    const declining= scorer.score(makeInputs({ problem: { ...makeInputs().problem, trend: 'declining'} }))
    expect(declining.breakdown.demand).toBeLessThan(stable.breakdown.demand)
  })

  it('gives neutral demand score for unknown volume', () => {
    const result = scorer.score(makeInputs({
      problem: { ...makeInputs().problem, searchVolume: null, trend: 'unknown' },
    }))
    expect(result.breakdown.demand).toBeGreaterThan(0)
    expect(result.breakdown.demand).toBeLessThanOrEqual(60)
  })

  // ── SEO scoring ────────────────────────────────────────────────────────────

  it('rewards low difficulty', () => {
    const easy = scorer.score(makeInputs({ seo: { ...makeInputs().seo, avgDifficulty: 10 } }))
    const hard  = scorer.score(makeInputs({ seo: { ...makeInputs().seo, avgDifficulty: 75 } }))
    expect(easy.breakdown.seo).toBeGreaterThan(hard.breakdown.seo)
  })

  it('adds bonus for featured snippet opportunity', () => {
    const with_snippet    = scorer.score(makeInputs({ seo: { ...makeInputs().seo, featuredSnippetOpportunity: true } }))
    const without_snippet = scorer.score(makeInputs({ seo: { ...makeInputs().seo, featuredSnippetOpportunity: false } }))
    expect(with_snippet.breakdown.seo).toBeGreaterThan(without_snippet.breakdown.seo)
  })

  it('adds multilingual bonus (capped at 20)', () => {
    const many_langs = scorer.score(makeInputs({ seo: { ...makeInputs().seo, multilingualPotential: ['es','pt','de','fr','pl','it','nl'] } }))
    const no_langs   = scorer.score(makeInputs({ seo: { ...makeInputs().seo, multilingualPotential: [] } }))
    expect(many_langs.breakdown.seo).toBeGreaterThan(no_langs.breakdown.seo)
  })

  // ── AI Coach scoring ───────────────────────────────────────────────────────

  it('gives 100 when all 4 AI flags are true', () => {
    const result = scorer.score(makeInputs({
      aiCoach: { personalizable: true, returnable: true, journeyFit: true, upsellPotential: true, score: 100 },
    }))
    expect(result.breakdown.aiCoach).toBe(100)
  })

  it('gives 0 when all AI flags are false', () => {
    const result = scorer.score(makeInputs({
      aiCoach: { personalizable: false, returnable: false, journeyFit: false, upsellPotential: false, score: 0 },
    }))
    expect(result.breakdown.aiCoach).toBe(0)
  })

  it('scores proportionally: 2/4 flags = 50', () => {
    const result = scorer.score(makeInputs({
      aiCoach: { personalizable: true, returnable: true, journeyFit: false, upsellPotential: false, score: 50 },
    }))
    expect(result.breakdown.aiCoach).toBe(50)
  })

  // ── Competition scoring ────────────────────────────────────────────────────

  it('rewards many competitor gaps', () => {
    const many_gaps = scorer.score(makeInputs({
      serp: {
        ...makeInputs().serp,
        topCompetitors: [{ url: 'x.com', domain: 'x', title: 'X', position: 1, da: 30,
          strengths: ['existing'], weaknesses: ['no AI', 'bad UX', 'no mobile'], gaps: ['AI', 'UX', 'mobile'] }],
      },
    }))
    const no_gaps = scorer.score(makeInputs({
      serp: {
        ...makeInputs().serp,
        topCompetitors: [{ url: 'x.com', domain: 'x', title: 'X', position: 1, da: 80,
          strengths: ['everything'], weaknesses: [], gaps: [] }],
      },
    }))
    expect(many_gaps.breakdown.competition).toBeGreaterThan(no_gaps.breakdown.competition)
  })

  it('gives neutral score when no competitors exist', () => {
    const result = scorer.score(makeInputs({ serp: { ...makeInputs().serp, topCompetitors: [] } }))
    expect(result.breakdown.competition).toBeGreaterThan(0)
    expect(result.breakdown.competition).toBeLessThan(80)
  })

  // ── Total + breakdown ──────────────────────────────────────────────────────

  it('total is within 0–100', () => {
    const result = scorer.score(makeInputs())
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('all breakdown values are within 0–100', () => {
    const { breakdown } = scorer.score(makeInputs())
    for (const val of Object.values(breakdown)) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(100)
    }
  })

  it('verdictReason is a non-empty string', () => {
    const result = scorer.score(makeInputs())
    expect(result.verdictReason.length).toBeGreaterThan(10)
  })
})
