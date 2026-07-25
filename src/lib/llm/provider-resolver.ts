// ─────────────────────────────────────────────────────────────────────────────
// ProviderResolver — selects LLMProvider without changing the API route.
//
// Sprint 10 PD recommendation: decouple provider selection from the route so
// that fallback, A/B testing, and multi-model support can be added in one place.
//
// Resolution order:
//   1. Explicit name override
//   2. Primary provider (first available)
//   3. Fallback providers (tried in order)
// ─────────────────────────────────────────────────────────────────────────────

import type { LLMProvider } from './provider'

export type ProviderName = string

export interface ProviderEntry {
  readonly name:     ProviderName
  readonly provider: LLMProvider
}

export class ProviderResolver {
  constructor(private readonly entries: readonly ProviderEntry[]) {}

  async resolve(preferredName?: ProviderName): Promise<LLMProvider> {
    if (preferredName) {
      const match = this.entries.find(e => e.name === preferredName)
      if (match && await match.provider.isAvailable()) return match.provider
    }

    // Try entries in priority order
    for (const entry of this.entries) {
      if (await entry.provider.isAvailable()) return entry.provider
    }

    throw new Error('No LLM provider available')
  }

  listNames(): readonly ProviderName[] {
    return this.entries.map(e => e.name)
  }
}
