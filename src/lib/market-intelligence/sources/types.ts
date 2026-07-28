// ─────────────────────────────────────────────────────────────────────────────
// Data Source Interface — contract for all Market Intelligence data providers.
//
// Every data source (DataForSEO, Google Autocomplete, Reddit, etc.) must
// implement DataSource. The department calls all available sources and merges
// the results into a ProductResearchPackage.
//
// Adding a new source = implement DataSource, inject into department. Zero changes
// to scoring, packaging, or downstream departments.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchQuery, KeywordEntry, CompetitorInsight, TrendDirection } from '../types'

// ── Source Result Types ────────────────────────────────────────────────────────

export interface KeywordSourceResult {
  type: 'keywords'
  sourceId: string
  keywords: KeywordEntry[]
  questions: string[]
  related: string[]
}

export interface CompetitorSourceResult {
  type: 'competitors'
  sourceId: string
  competitors: CompetitorInsight[]
  featuredSnippetExists: boolean
  adCount: number
}

export interface TrendSourceResult {
  type: 'trend'
  sourceId: string
  trend: TrendDirection
  relatedQueries: string[]
  peakMonth: string | null
}

export interface CommunitySourceResult {
  type: 'community'
  sourceId: string
  formulations: string[]   // exact phrases real users write
  mentions: string[]       // subreddits, forums
  sentiment: 'positive' | 'negative' | 'mixed' | 'unknown'
}

export type SourceResult =
  | KeywordSourceResult
  | CompetitorSourceResult
  | TrendSourceResult
  | CommunitySourceResult

// ── Data Source Interface ─────────────────────────────────────────────────────

export interface DataSource {
  readonly id: string
  readonly name: string
  readonly resultType: SourceResult['type']

  /** Returns false if credentials are missing or quota is exceeded. */
  isAvailable(): boolean

  /** Fetches data for a query. Must not throw — return empty results on error. */
  fetch(query: ResearchQuery): Promise<SourceResult>
}

// ── Source Registry ───────────────────────────────────────────────────────────

export class DataSourceRegistry {
  private readonly sources = new Map<string, DataSource>()

  register(source: DataSource): void {
    this.sources.set(source.id, source)
  }

  getAvailable(): DataSource[] {
    return Array.from(this.sources.values()).filter(s => s.isAvailable())
  }

  getById(id: string): DataSource | null {
    return this.sources.get(id) ?? null
  }

  count(): number {
    return this.sources.size
  }

  availableCount(): number {
    return this.getAvailable().length
  }
}
