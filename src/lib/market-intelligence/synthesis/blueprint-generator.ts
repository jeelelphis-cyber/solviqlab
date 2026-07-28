// ─────────────────────────────────────────────────────────────────────────────
// BlueprintGenerator — Stage 6 (final): Build the Product Blueprint.
//
// INPUT:  All pipeline outputs (universe, topics, problems, gaps, validation data)
// OUTPUT: ProductBlueprint — the document Department 02 (Strategy) receives
//
// This is the inter-department CONTRACT.
// Department 02 sees only the Blueprint — not the raw data that produced it.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResearchLLM } from '../llm/research-llm'
import type { DiscoveredProblem } from '../discovery/problem-discovery'
import type { MarketGap }         from '../discovery/gap-finder'
import type { TopicExpansion }    from '../universe/topic-generator'
import type { PriorityScore }     from '../types'

export interface ProductBlueprint {
  id:            string
  createdAt:     string
  schemaVersion: 1

  // ── What we found ──────────────────────────────────────────────────────────
  topicName:     string
  coreProblem:   string          // the single most important problem
  marketSize:    'large' | 'medium' | 'niche' | 'unknown'
  searchVolume:  number | null   // from DataForSEO validation
  trend:         string

  // ── The opportunity ────────────────────────────────────────────────────────
  primaryGap:    MarketGap
  allGaps:       MarketGap[]

  // ── What to build ──────────────────────────────────────────────────────────
  recommendations: ProductRecommendation[]

  // ── Priority ───────────────────────────────────────────────────────────────
  priority:      PriorityScore

  // ── For Mia ───────────────────────────────────────────────────────────────
  miaOpportunity:  string        // how AI coaching specifically wins here
  journeyArc:      string[]      // Day 1, Day 3, Day 7, Day 14, Day 30 touchpoints

  // ── For Department 02 ─────────────────────────────────────────────────────
  strategicNote:   string        // 2-3 sentences for CEO/Strategy
  buildNow:        boolean       // true if priority >= 80
  estimatedBuildDays: number

  sources: string[]
}

export interface ProductRecommendation {
  rank:      number
  slug:      string
  name:      string
  type:      string              // calculator / quiz / planner / assessment
  rationale: string
  mvpScope:  string[]
  aiJourneySteps: number
}

const SYSTEM_PROMPT = `You are a product strategy director synthesising market research into actionable product blueprints.
You write for a product team that will BUILD these products — not for analysts.
Be specific, decisive, and practical. No hedge words.
Respond with valid JSON only.`

export class BlueprintGenerator {
  constructor(private readonly llm: ResearchLLM) {}

  async generate(inputs: {
    topicName:    string
    problems:     DiscoveredProblem[]
    gaps:         MarketGap[]
    expansion:    TopicExpansion
    searchVolume: number | null
    priority:     PriorityScore
    sources:      string[]
  }): Promise<ProductBlueprint> {

    const { topicName, problems, gaps, expansion, searchVolume, priority, sources } = inputs

    const topProblem = problems[0]
    const topGap     = gaps[0]

    const prompt = `Synthesise this market research into a Product Blueprint for "${topicName}".

TOP USER PROBLEM: ${topProblem?.coreProblem ?? 'see problems below'}
TOP MARKET GAP: ${topGap?.gap ?? 'see gaps below'}
SEARCH VOLUME: ${searchVolume?.toLocaleString() ?? 'unknown'}/month
PRIORITY SCORE: ${priority.total}/100 (${priority.verdict})

PROBLEMS DISCOVERED:
${problems.slice(0, 3).map(p => `- ${p.headline}: ${p.coreProblem}`).join('\n')}

GAPS FOUND:
${gaps.slice(0, 3).map(g => `- [${g.priority}] ${g.title}: ${g.gap}`).join('\n')}

Build 2-4 specific product recommendations (ordered by priority).
For each: what to build in MVP, why it wins, how Mia makes it uniquely powerful.
Define a 30-day AI journey arc with 5 touchpoints.

Return JSON:
{
  "coreProblem": "one sentence — the core human problem",
  "marketSize": "large|medium|niche|unknown",
  "trend": "rising|stable|declining|unknown",
  "miaOpportunity": "2 sentences — how AI coaching specifically wins in this market",
  "strategicNote": "2-3 sentences for CEO — why we should build this now",
  "estimatedBuildDays": 14,
  "journeyArc": [
    "Day 1: User calculates sleep debt — Mia reveals the real impact",
    "Day 3: Mia checks in — how did the first recovery nights go?",
    "Day 7: Week 1 review — personalised plan adjustment",
    "Day 14: Halfway milestone — measurable improvement check",
    "Day 30: Full recovery assessment — upgrade to daily Mia"
  ],
  "recommendations": [
    {
      "rank": 1,
      "slug": "sleep-debt-calculator",
      "name": "Sleep Debt Calculator",
      "type": "calculator",
      "rationale": "Directly answers the #1 user question. Unique because it leads to a personalised recovery plan, not just a number.",
      "mvpScope": ["Core calculation", "Visual debt representation", "Mia intro + recovery plan offer"],
      "aiJourneySteps": 7
    }
  ]
}`

    const result = await this.llm.callJSON<{
      coreProblem:        string
      marketSize:         ProductBlueprint['marketSize']
      trend:              string
      miaOpportunity:     string
      strategicNote:      string
      estimatedBuildDays: number
      journeyArc:         string[]
      recommendations:    ProductRecommendation[]
    }>(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt },
      ],
      { temperature: 0.3, maxTokens: 5000, maxRetries: 1 },
    )

    const id = `bp_${topicName.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`

    const primaryGap: MarketGap = topGap ?? {
      id: 'unknown',
      title: 'Gap analysis unavailable',
      gap: 'No gaps discovered in this research run',
      evidence: '',
      competitorFail: '',
      ourAdvantage: '',
      productIdea: '',
      aiPotential: 0,
      priority: 'P2',
    }

    return {
      id,
      createdAt:     new Date().toISOString(),
      schemaVersion: 1,
      topicName,
      coreProblem:        result.coreProblem        ?? topProblem?.coreProblem ?? '',
      marketSize:         result.marketSize         ?? 'unknown',
      searchVolume,
      trend:              result.trend              ?? 'unknown',
      primaryGap,
      allGaps:            gaps,
      recommendations:    (result.recommendations ?? []).sort((a, b) => a.rank - b.rank),
      priority,
      miaOpportunity:     result.miaOpportunity     ?? '',
      journeyArc:         result.journeyArc         ?? [],
      strategicNote:      result.strategicNote      ?? '',
      buildNow:           priority.total >= 80,
      estimatedBuildDays: result.estimatedBuildDays ?? 14,
      sources,
    }
  }
}
