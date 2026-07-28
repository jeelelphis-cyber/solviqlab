// ─────────────────────────────────────────────────────────────────────────────
// Mock Data Sources — used in tests and local development.
//
// Each mock implements the DataSource interface with realistic data shapes.
// Real implementations (DataForSEO, Google Autocomplete, Reddit) will replace
// these without any changes to the department or scoring logic.
// ─────────────────────────────────────────────────────────────────────────────

import type { DataSource, KeywordSourceResult, CompetitorSourceResult, TrendSourceResult, CommunitySourceResult } from './types'
import type { ResearchQuery } from '../types'

export class MockKeywordSource implements DataSource {
  readonly id      = 'mock-keywords'
  readonly name    = 'Mock Keyword Source'
  readonly resultType = 'keywords' as const

  constructor(private readonly data: Partial<KeywordSourceResult> = {}) {}

  isAvailable(): boolean { return true }

  async fetch(_query: ResearchQuery): Promise<KeywordSourceResult> {
    return {
      type:      'keywords',
      sourceId:  this.id,
      keywords:  this.data.keywords  ?? [],
      questions: this.data.questions ?? [],
      related:   this.data.related   ?? [],
    }
  }
}

export class MockCompetitorSource implements DataSource {
  readonly id      = 'mock-competitors'
  readonly name    = 'Mock Competitor Source'
  readonly resultType = 'competitors' as const

  constructor(private readonly data: Partial<CompetitorSourceResult> = {}) {}

  isAvailable(): boolean { return true }

  async fetch(_query: ResearchQuery): Promise<CompetitorSourceResult> {
    return {
      type:                  'competitors',
      sourceId:              this.id,
      competitors:           this.data.competitors           ?? [],
      featuredSnippetExists: this.data.featuredSnippetExists ?? false,
      adCount:               this.data.adCount               ?? 0,
    }
  }
}

export class MockTrendSource implements DataSource {
  readonly id      = 'mock-trends'
  readonly name    = 'Mock Trend Source'
  readonly resultType = 'trend' as const

  constructor(private readonly data: Partial<TrendSourceResult> = {}) {}

  isAvailable(): boolean { return true }

  async fetch(_query: ResearchQuery): Promise<TrendSourceResult> {
    return {
      type:           'trend',
      sourceId:       this.id,
      trend:          this.data.trend          ?? 'stable',
      relatedQueries: this.data.relatedQueries ?? [],
      peakMonth:      this.data.peakMonth      ?? null,
    }
  }
}

export class MockCommunitySource implements DataSource {
  readonly id      = 'mock-community'
  readonly name    = 'Mock Community Source'
  readonly resultType = 'community' as const

  constructor(private readonly data: Partial<CommunitySourceResult> = {}) {}

  isAvailable(): boolean { return true }

  async fetch(_query: ResearchQuery): Promise<CommunitySourceResult> {
    return {
      type:          'community',
      sourceId:      this.id,
      formulations:  this.data.formulations ?? [],
      mentions:      this.data.mentions     ?? [],
      sentiment:     this.data.sentiment    ?? 'unknown',
    }
  }
}

export class UnavailableSource implements DataSource {
  readonly id         = 'unavailable'
  readonly name       = 'Unavailable Source'
  readonly resultType = 'keywords' as const

  isAvailable(): boolean { return false }

  async fetch(_query: ResearchQuery): Promise<KeywordSourceResult> {
    throw new Error('Should never be called — isAvailable() returns false')
  }
}
