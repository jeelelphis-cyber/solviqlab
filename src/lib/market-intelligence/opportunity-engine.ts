// ─────────────────────────────────────────────────────────────────────────────
// OpportunityDiscoveryEngine — finds the best markets in a vertical.
//
// Two-pass approach:
//   Pass 1 (free):  UniverseMapper → extract all topics → LLM quick-score each
//   Pass 2 ($):     Top N topics → full ResearchEngine with DataForSEO
//
// INPUT:  vertical ("health")
// OUTPUT: OpportunityPortfolio — ranked list of BUILD/HOLD/SKIP opportunities
// ─────────────────────────────────────────────────────────────────────────────

import { ResearchLLM }    from './llm/research-llm'
import { UniverseMapper } from './universe/universe-mapper'
import { ResearchEngine } from './research-engine'
import type { UniverseNode } from './universe/universe-mapper'
import type { ProductBlueprint } from './synthesis/blueprint-generator'

export interface OpportunityPortfolio {
  vertical:         string
  discoveredAt:     string
  totalTopics:      number
  researchedTopics: number
  opportunities:    RankedOpportunity[]
  summary: {
    buildNow:  number
    buildSoon: number
    watch:     number
    skip:      number
  }
  totalDurationMs: number
}

export interface RankedOpportunity {
  rank:         number
  topic:        string
  topicId:      string
  score:        number
  verdict:      string
  searchVolume: number | null
  topGap:       string
  topProduct:   string
  blueprint:    ProductBlueprint
}

export interface DiscoveryOptions {
  maxTopics?:       number    // max topics to deep-research (default 20)
  skipValidation?:  boolean   // skip DataForSEO (free mode)
  minPriority?:     'high' | 'medium' | 'low'   // filter universe nodes
  concurrency?:     number    // parallel research sessions (default 3)
  onProgress?:      (msg: string, done: number, total: number) => void
}

export class OpportunityDiscoveryEngine {
  private readonly llm:    ResearchLLM
  private readonly mapper: UniverseMapper
  private readonly engine: ResearchEngine

  constructor(private readonly config: {
    deepseekApiKey:  string
    dataforseApiKey: string
  }) {
    this.llm    = new ResearchLLM(config.deepseekApiKey)
    this.mapper = new UniverseMapper(this.llm)
    this.engine = new ResearchEngine(config)
  }

  async discover(vertical: string, opts: DiscoveryOptions = {}): Promise<OpportunityPortfolio> {
    const t0          = Date.now()
    const maxTopics   = opts.maxTopics   ?? 20
    const concurrency = opts.concurrency ?? 3
    const minPriority = opts.minPriority ?? 'medium'
    const onProgress  = opts.onProgress  ?? (() => {})

    // ── Pass 1: Build universe map and extract all candidate topics ────────────

    onProgress('Mapping the full universe…', 0, 0)
    const universe = await this.mapper.map(vertical)

    const allNodes = this.extractNodes(universe.verticals, minPriority)
    const candidates = allNodes.slice(0, maxTopics)

    onProgress(`Found ${candidates.length} topics to research`, 0, candidates.length)

    // ── Pass 2: Research each topic (with concurrency) ─────────────────────────

    const results: RankedOpportunity[] = []
    let done = 0

    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency)

      const batchResults = await Promise.allSettled(
        batch.map(node => this.researchTopic(vertical, node, opts.skipValidation ?? false))
      )

      for (const result of batchResults) {
        done++
        if (result.status === 'fulfilled') {
          results.push(result.value)
          onProgress(`✓ ${result.value.topic} → ${result.value.score}/100 ${result.value.verdict}`, done, candidates.length)
        } else {
          onProgress(`✗ failed (${(result.reason as Error)?.message?.slice(0, 40)})`, done, candidates.length)
        }
      }
    }

    // ── Rank and summarise ────────────────────────────────────────────────────

    const ranked = results
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }))

    const summary = {
      buildNow:  ranked.filter(r => r.score >= 80).length,
      buildSoon: ranked.filter(r => r.score >= 60 && r.score < 80).length,
      watch:     ranked.filter(r => r.score >= 40 && r.score < 60).length,
      skip:      ranked.filter(r => r.score < 40).length,
    }

    return {
      vertical,
      discoveredAt:     new Date().toISOString(),
      totalTopics:      allNodes.length,
      researchedTopics: results.length,
      opportunities:    ranked,
      summary,
      totalDurationMs:  Date.now() - t0,
    }
  }

  private async researchTopic(
    vertical: string,
    node:     UniverseNode,
    skipValidation: boolean,
  ): Promise<RankedOpportunity> {
    const result = await this.engine.research(
      { domain: vertical, topic: node.name, skipValidation },
    )

    const { blueprint } = result
    const topGap = blueprint.allGaps?.[0]?.title ?? blueprint.primaryGap?.title ?? ''

    return {
      rank:         0,  // set after sorting
      topic:        node.name,
      topicId:      node.id,
      score:        blueprint.priority.total,
      verdict:      blueprint.priority.verdict.replace('_', ' ').toUpperCase(),
      searchVolume: blueprint.searchVolume,
      topGap,
      topProduct:   blueprint.recommendations?.[0]?.name ?? '',
      blueprint,
    }
  }

  private extractNodes(
    nodes:       UniverseNode[],
    minPriority: 'high' | 'medium' | 'low',
  ): UniverseNode[] {
    const priorityRank = { high: 3, medium: 2, low: 1 }
    const minRank = priorityRank[minPriority]
    const result: UniverseNode[] = []

    for (const node of nodes) {
      if (priorityRank[node.priority] >= minRank) {
        // Prefer leaf children over parent nodes
        if (node.children.length > 0) {
          result.push(...this.extractNodes(node.children, minPriority))
        } else {
          result.push(node)
        }
        // Also include the parent itself if it's high priority (broad market)
        if (node.priority === 'high' && node.children.length > 0) {
          result.unshift(node)
        }
      }
    }

    // Deduplicate by id
    const seen = new Set<string>()
    return result.filter(n => seen.has(n.id) ? false : (seen.add(n.id), true))
  }
}
