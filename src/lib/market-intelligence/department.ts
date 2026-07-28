// ─────────────────────────────────────────────────────────────────────────────
// Market Intelligence Department — Orchestrator
//
// The public API of Department 01.
// Department 02 (Product Strategy) only talks to this class.
//
// Usage:
//   const dept = new MarketIntelligenceDepartment([
//     new DataForSEOSource(apiKey),   // added when credentials available
//     new GoogleAutocompleteSource(),  // added when integrated
//     new RedditSource(),              // added when integrated
//   ])
//
//   const pkg = await dept.research({ problem: "can't sleep", cluster: "sleep" })
//   // → ProductResearchPackage with score, recommendation, keywords, competitors
//
// Right now: works with MockDataSource in tests and stub stubs in dev.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchQuery, ProductResearchPackage } from './types'
import type { DataSource }                            from './sources/types'
import { ProductResearchPackageBuilder }              from './package-builder'

export class MarketIntelligenceDepartment {
  private readonly builder = new ProductResearchPackageBuilder()

  constructor(private readonly sources: DataSource[] = []) {}

  // ── Core: run all available sources → package ──────────────────────────────

  async research(query: ResearchQuery): Promise<ProductResearchPackage> {
    const available = this.sources.filter(s => s.isAvailable())

    const results = await Promise.allSettled(
      available.map(s => s.fetch(query))
    )

    const settled = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<DataSource['fetch']>>> =>
        r.status === 'fulfilled'
      )
      .map(r => r.value)

    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) {
      console.warn(`[MarketIntelligence] ${failed}/${available.length} sources failed — continuing with partial data`)
    }

    return this.builder.build({
      query,
      results:   settled,
      sourceIds: available.map(s => s.id),
    })
  }

  // ── Batch research ─────────────────────────────────────────────────────────

  async researchBatch(queries: ResearchQuery[]): Promise<ProductResearchPackage[]> {
    return Promise.all(queries.map(q => this.research(q)))
  }

  // ── Introspection ──────────────────────────────────────────────────────────

  get sourceCount(): number { return this.sources.length }

  get availableSourceCount(): number {
    return this.sources.filter(s => s.isAvailable()).length
  }

  sourceStatus(): Array<{ id: string; name: string; available: boolean }> {
    return this.sources.map(s => ({
      id:        s.id,
      name:      s.name,
      available: s.isAvailable(),
    }))
  }
}
