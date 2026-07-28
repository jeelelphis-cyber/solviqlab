// ─────────────────────────────────────────────────────────────────────────────
// ResearchEngine — Department 01 orchestrator.
//
// The full pipeline, in order:
//
//   Stage 1: Universe Mapper   — "What does this market look like?" (LLM)
//   Stage 2: Topic Generator   — "What angles exist for this topic?" (LLM)
//   Stage 3: Problem Discovery — "What are the real human problems?" (LLM)
//   Stage 4: Validation        — "What's the actual search demand?" (DataForSEO)
//   Stage 5: Gap Finder        — "What is the market missing?" (LLM + SERP)
//   Stage 6: Blueprint         — "What exactly do we build?" (LLM synthesis)
//
// DataForSEO is Stage 4 only — not the starting point.
// LLM does 90% of thinking; DataForSEO validates with numbers.
// ─────────────────────────────────────────────────────────────────────────────

import { ResearchLLM }        from './llm/research-llm'
import { UniverseMapper }     from './universe/universe-mapper'
import { TopicGenerator }     from './universe/topic-generator'
import { ProblemDiscovery }   from './discovery/problem-discovery'
import { GapFinder }          from './discovery/gap-finder'
import { BlueprintGenerator } from './synthesis/blueprint-generator'
import { PriorityScorer }     from './scoring/priority-scorer'
import { CompetitiveIntelligenceEngine } from './competitive/competitive-intelligence'
import { DataForSEOKeywordSource, DataForSEOSERPSource } from './sources/dataforseo'
import type { ResearchUniverse, UniverseNode } from './universe/universe-mapper'
import type { TopicExpansion }   from './universe/topic-generator'
import type { DiscoveredProblem } from './discovery/problem-discovery'
import type { MarketGap }         from './discovery/gap-finder'
import type { ProductBlueprint }  from './synthesis/blueprint-generator'
import type { CompetitiveIntelligenceReport } from './competitive/types'
import type {
  ProblemSignal, SEOPotential, AICoachPotential, SERPAnalysis, KeywordCluster as KWCluster,
} from './types'

export interface ResearchRequest {
  domain:     string    // "health"
  topic:      string    // "sleep" — which vertical to deep-dive
  subtopic?:  string    // "sleep debt" — optional: go even deeper
  skipValidation?: boolean  // skip DataForSEO if no credits
}

export interface ResearchResult {
  blueprint:              ProductBlueprint
  universe:               ResearchUniverse
  expansion:              TopicExpansion
  problems:               DiscoveredProblem[]
  gaps:                   MarketGap[]
  competitiveIntelligence: CompetitiveIntelligenceReport | null
  stagesRan:              string[]
  duration:               number  // ms
}

export class ResearchEngine {
  private readonly llm:         ResearchLLM
  private readonly univMapper:  UniverseMapper
  private readonly topicGen:    TopicGenerator
  private readonly probDisc:    ProblemDiscovery
  private readonly gapFinder:   GapFinder
  private readonly blueprintGen: BlueprintGenerator
  private readonly scorer:      PriorityScorer
  private readonly ciEngine:    CompetitiveIntelligenceEngine

  constructor(private readonly config: {
    deepseekApiKey:  string
    dataforseApiKey: string
  }) {
    this.llm         = new ResearchLLM(config.deepseekApiKey)
    this.univMapper  = new UniverseMapper(this.llm)
    this.topicGen    = new TopicGenerator(this.llm)
    this.probDisc    = new ProblemDiscovery(this.llm)
    this.gapFinder   = new GapFinder(this.llm)
    this.blueprintGen = new BlueprintGenerator(this.llm)
    this.scorer      = new PriorityScorer()
    this.ciEngine    = new CompetitiveIntelligenceEngine(this.llm, config.dataforseApiKey)
  }

  async research(req: ResearchRequest, onStage?: (stage: string) => void): Promise<ResearchResult> {
    const t0         = Date.now()
    const stagesRan: string[] = []

    function tick(stage: string) {
      stagesRan.push(stage)
      onStage?.(stage)
    }

    // ── Stage 1: Universe Mapping ──────────────────────────────────────────

    tick('universe-mapping')
    const universe = await this.univMapper.map(req.domain, req.topic)

    // Find the target node in the universe
    const targetNode: UniverseNode = this.findNode(universe, req.subtopic ?? req.topic)
      ?? { id: req.topic, name: req.topic, description: '', priority: 'medium', children: [] }

    // ── Stage 2: Topic Expansion ───────────────────────────────────────────

    tick('topic-expansion')
    const expansion = await this.topicGen.expand(targetNode, req.topic)

    // ── Stage 3: Problem Discovery ─────────────────────────────────────────

    tick('problem-discovery')
    const problems = await this.probDisc.discover(expansion)

    // ── Stage 4: Validation (DataForSEO) ───────────────────────────────────
    // Only here do we touch DataForSEO — with specific seeds from the LLM analysis.

    let searchVolume: number | null = null
    let competitors:  SERPAnalysis['topCompetitors'] = []
    let featuredSnippet = false
    let adCount = 0
    let fetchedKeywords: import('./types').KeywordEntry[] = []
    let fetchedQuestions: string[] = []

    if (!req.skipValidation && this.config.dataforseApiKey) {
      tick('demand-validation')

      const kwSource   = new DataForSEOKeywordSource(this.config.dataforseApiKey)
      const serpSource = new DataForSEOSERPSource(this.config.dataforseApiKey)

      // Try seeds in priority order until one returns volume data
      const seedCandidates = [
        expansion.calculators[0],
        expansion.problems[0],
        req.subtopic,
        req.topic,
      ].filter(Boolean) as string[]

      const topSeed = seedCandidates[0]!

      try {
        const [kwResult, serpResult] = await Promise.allSettled([
          kwSource.fetch({ problem: topSeed, cluster: req.topic }),
          serpSource.fetch({ problem: topSeed, cluster: req.topic }),
        ])

        if (kwResult.status === 'fulfilled') {
          fetchedKeywords  = kwResult.value.keywords
          fetchedQuestions = kwResult.value.questions
          let total = fetchedKeywords.reduce((s, k) => s + (k.volume ?? 0), 0)

          // Fallback: if calculator seed returned no volume, retry with topic name
          if (total === 0 && seedCandidates.length > 1) {
            for (const fallbackSeed of seedCandidates.slice(1)) {
              try {
                const fallback = await kwSource.fetch({ problem: fallbackSeed, cluster: req.topic })
                const fallbackTotal = fallback.keywords.reduce((s, k) => s + (k.volume ?? 0), 0)
                if (fallbackTotal > 0) {
                  fetchedKeywords  = fallback.keywords
                  fetchedQuestions = fallback.questions
                  total = fallbackTotal
                  break
                }
              } catch { /* try next */ }
            }
          }

          searchVolume = total > 0 ? total : null
        }
        if (serpResult.status === 'fulfilled') {
          competitors     = serpResult.value.competitors
          featuredSnippet = serpResult.value.featuredSnippetExists
          adCount         = serpResult.value.adCount
        }
      } catch {
        // Validation failed — continue without numbers (LLM analysis is still valid)
      }
    } else {
      tick('demand-validation-skipped')
    }

    // ── Stage 3.5: Competitive Intelligence ───────────────────────────────────

    let competitiveIntelligence: CompetitiveIntelligenceReport | null = null

    if (!req.skipValidation && competitors.length > 0) {
      tick('competitive-intelligence')
      const topSeedForCI = fetchedKeywords[0]?.keyword ?? expansion.calculators[0] ?? req.topic
      try {
        competitiveIntelligence = await this.ciEngine.analyse(
          targetNode.name,
          topSeedForCI,
          competitors,
          featuredSnippet,
        )
      } catch {
        // non-fatal — CI is enhancement, not blocker
      }
    }

    // ── Stage 5: Gap Finder ────────────────────────────────────────────────

    tick('gap-finding')
    const gaps = await this.gapFinder.findGaps(problems, competitors, targetNode.name)

    // ── Priority Score ─────────────────────────────────────────────────────

    const topProblem = problems[0]
    const aiScore    = gaps[0]?.aiPotential ?? 75

    const problem: ProblemSignal = {
      coreProblem:       topProblem?.coreProblem ?? req.topic,
      userFormulations:  expansion.problems.slice(0, 5),
      cluster:           req.topic,
      searchVolume:      searchVolume,
      trend:             'unknown',
      communityMentions: [],
    }

    const seo: SEOPotential = {
      totalVolume:                searchVolume ?? 0,
      avgDifficulty:              35,
      featuredSnippetOpportunity: !featuredSnippet,
      multilingualPotential:      (searchVolume ?? 0) > 50_000 ? ['es', 'pt', 'de', 'fr'] : ['es'],
      estimatedMonthlyClicks:     searchVolume != null ? Math.round(searchVolume * 0.03) : null,
      score:                      0,
    }

    const ai: AICoachPotential = {
      personalizable:  aiScore > 60,
      returnable:      aiScore > 70,
      journeyFit:      aiScore > 75,
      upsellPotential: aiScore > 80,
      score:           aiScore,
    }

    const serpAnalysis: SERPAnalysis = {
      topCompetitors:            competitors,
      featuredSnippetExists:     featuredSnippet,
      featuredSnippetWinnableBy: featuredSnippet ? null : 'calculator',
      adCount,
      organicCount:              competitors.length,
    }

    const kwCluster: KWCluster = {
      seed:      expansion.allSeeds[0] ?? req.topic,
      primary:   fetchedKeywords.filter(k => (k.volume ?? 0) > 1_000).slice(0, 10),
      longtail:  fetchedKeywords.filter(k => (k.volume ?? 0) <= 1_000 && (k.volume ?? 0) > 0).slice(0, 20),
      questions: [...fetchedQuestions, ...expansion.questions].slice(0, 10),
      related:   expansion.allSeeds.slice(0, 20),
    }

    const priority = this.scorer.score({ problem, seo, aiCoach: ai, serp: serpAnalysis, keywords: kwCluster })

    // ── Stage 6: Blueprint Generation ─────────────────────────────────────

    tick('blueprint-generation')
    const blueprint = await this.blueprintGen.generate({
      topicName:    targetNode.name,
      problems,
      gaps,
      expansion,
      searchVolume,
      priority,
      sources: ['deepseek-llm', ...(req.skipValidation ? [] : ['dataforseo'])],
    })

    return {
      blueprint,
      universe,
      expansion,
      problems,
      gaps,
      competitiveIntelligence,
      stagesRan,
      duration: Date.now() - t0,
    }
  }

  private findNode(universe: ResearchUniverse, name: string): UniverseNode | null {
    const needle = name.toLowerCase()
    for (const v of universe.verticals) {
      if (v.name.toLowerCase().includes(needle) || v.id.includes(needle)) return v
      for (const c of v.children) {
        if (c.name.toLowerCase().includes(needle) || c.id.includes(needle)) return c
      }
    }
    return null
  }
}
