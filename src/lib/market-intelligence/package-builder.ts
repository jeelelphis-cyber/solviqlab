// ─────────────────────────────────────────────────────────────────────────────
// ProductResearchPackageBuilder
//
// Assembles a ProductResearchPackage from raw source results.
// Called by MarketIntelligenceDepartment after all sources have responded.
// Pure function logic — no I/O, fully testable.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ResearchQuery, ProductResearchPackage, ProblemSignal, ProductIntent,
  KeywordCluster, SERPAnalysis, SEOPotential, AICoachPotential,
  ProductRecommendation, PriorityScore, IntentType,
} from './types'
import type { KeywordSourceResult, CompetitorSourceResult, TrendSourceResult, CommunitySourceResult, SourceResult } from './sources/types'
import { PriorityScorer } from './scoring/priority-scorer'

function pkgId(query: ResearchQuery): string {
  const slug = query.problem.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `pkg_${slug}_${new Date().toISOString().slice(0, 10)}`
}

function detectIntentType(keywords: KeywordCluster, problem: string): IntentType {
  const allText = [
    ...keywords.questions,
    ...keywords.related,
    problem,
  ].join(' ').toLowerCase()

  if (allText.includes('quiz') || allText.includes('test') || allText.includes('am i'))    return 'quiz'
  if (allText.includes('plan') || allText.includes('schedule') || allText.includes('week')) return 'planner'
  if (allText.includes('calculator') || allText.includes('calculate') || allText.includes('how much')) return 'calculator'
  if (allText.includes('assessment') || allText.includes('score') || allText.includes('risk')) return 'assessment'
  return 'calculator'
}

function buildSEOPotential(keywords: KeywordCluster, serp: SERPAnalysis): SEOPotential {
  const allKw = [...keywords.primary, ...keywords.longtail]
  const totalVolume = allKw.reduce((s, k) => s + (k.volume ?? 0), 0)
  const difficulties = allKw.filter(k => k.difficulty !== null).map(k => k.difficulty!)
  const avgDifficulty = difficulties.length > 0
    ? Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)
    : 50

  const featuredOpportunity = serp.featuredSnippetWinnableBy !== null
  const estimatedClicks     = totalVolume > 0 ? Math.round(totalVolume * 0.03) : null

  // Infer multilingual potential from keyword sources
  const multilingual: string[] = []
  if (totalVolume > 50_000)  multilingual.push('es', 'pt', 'de', 'fr', 'pl')
  else if (totalVolume > 10_000) multilingual.push('es', 'pt')

  let score = 50
  if (avgDifficulty < 35) score += 30
  else if (avgDifficulty < 60) score += 15
  if (featuredOpportunity)    score += 12
  score += Math.min(20, multilingual.length * 4)

  return {
    totalVolume,
    avgDifficulty,
    featuredSnippetOpportunity: featuredOpportunity,
    multilingualPotential: multilingual,
    estimatedMonthlyClicks: estimatedClicks,
    score: Math.min(100, Math.max(0, score)),
  }
}

function buildAICoachPotential(intentType: IntentType, cluster: string): AICoachPotential {
  const COACH_CLUSTERS = new Set(['weight', 'sleep', 'pregnancy', 'fitness', 'nutrition', 'stress'])

  const personalizable  = COACH_CLUSTERS.has(cluster)
  const returnable      = personalizable && intentType !== 'guide'
  const journeyFit      = personalizable && intentType !== 'guide'
  const upsellPotential = returnable

  const count = [personalizable, returnable, journeyFit, upsellPotential].filter(Boolean).length
  return { personalizable, returnable, journeyFit, upsellPotential, score: count * 25 }
}

function buildRecommendation(
  query: ResearchQuery,
  intent: ProductIntent,
  cluster: string,
  aiCoach: AICoachPotential,
): ProductRecommendation {
  const slug = query.problem.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    + '-' + intent.primary

  const mvpScope = ['Core formula / question set', 'Result interpretation', 'Mobile layout']
  if (aiCoach.personalizable) mvpScope.push('Mia intro block', 'UserGraph mapping')
  if (aiCoach.journeyFit)     mvpScope.push('Journey step (Day 1)')

  return {
    slug,
    name: query.problem
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') + ' ' + intent.primary.charAt(0).toUpperCase() + intent.primary.slice(1),
    type:             intent.primary,
    cluster,
    rationale:        `High intent match for "${query.problem}". Primary intent: ${intent.primary}.`,
    mvpScope,
    aiJourneySteps:   aiCoach.journeyFit ? 7 : 0,
    relatedProducts:  [],
  }
}

// ── Builder ───────────────────────────────────────────────────────────────────

export interface BuilderInputs {
  query:      ResearchQuery
  results:    SourceResult[]
  sourceIds:  string[]
}

export class ProductResearchPackageBuilder {
  private readonly scorer = new PriorityScorer()

  build(inputs: BuilderInputs): ProductResearchPackage {
    const { query, results, sourceIds } = inputs

    // Extract typed results
    const kwResult   = results.find((r): r is KeywordSourceResult   => r.type === 'keywords')
    const compResult = results.find((r): r is CompetitorSourceResult => r.type === 'competitors')
    const trendResult= results.find((r): r is TrendSourceResult     => r.type === 'trend')
    const commResult = results.find((r): r is CommunitySourceResult  => r.type === 'community')

    const cluster = query.cluster ?? 'health'

    // Problem Signal
    const problem: ProblemSignal = {
      coreProblem:        query.problem,
      userFormulations:   commResult?.formulations ?? [],
      cluster,
      searchVolume:       kwResult ? (kwResult.keywords[0]?.volume ?? null) : null,
      trend:              trendResult?.trend ?? 'unknown',
      communityMentions:  commResult?.mentions ?? [],
    }

    // Keyword Cluster
    const keywords: KeywordCluster = {
      seed:      query.problem,
      primary:   kwResult?.keywords.filter(k => !k.keyword.includes(' ') || k.keyword.split(' ').length <= 3) ?? [],
      longtail:  kwResult?.keywords.filter(k => k.keyword.split(' ').length > 3) ?? [],
      questions: kwResult?.questions ?? [],
      related:   kwResult?.related   ?? [],
    }

    // SERP
    const serp: SERPAnalysis = {
      topCompetitors:            compResult?.competitors ?? [],
      featuredSnippetExists:     compResult?.featuredSnippetExists ?? false,
      featuredSnippetWinnableBy: compResult?.featuredSnippetExists ? null : 'calculator',
      adCount:                   compResult?.adCount ?? 0,
      organicCount:              compResult?.competitors.length ?? 0,
    }

    const intentType = detectIntentType(keywords, query.problem)
    const intent: ProductIntent = {
      primary:   intentType,
      secondary: intentType === 'calculator' ? ['quiz', 'planner'] : ['calculator'],
      confidence: 0.75,
      rationale: `Inferred from keyword patterns and problem statement.`,
    }

    const seo      = buildSEOPotential(keywords, serp)
    const aiCoach  = buildAICoachPotential(intentType, cluster)
    const recommendation = buildRecommendation(query, intent, cluster, aiCoach)

    const priority: PriorityScore = this.scorer.score({ problem, seo, aiCoach, serp, keywords })

    return {
      id:            pkgId(query),
      createdAt:     new Date().toISOString(),
      schemaVersion: 1,
      query,
      problem,
      intent,
      keywords,
      serp,
      seo,
      aiCoach,
      recommendation,
      priority,
      notes:   [],
      sources: sourceIds,
    }
  }
}
