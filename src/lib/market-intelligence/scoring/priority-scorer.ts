// ─────────────────────────────────────────────────────────────────────────────
// PriorityScorer — converts raw research signals into a 0–100 priority score.
//
// Weights (must sum to 1.0):
//   Demand     25%  — search volume + trend momentum
//   SEO        20%  — difficulty vs opportunity ratio
//   AI Coach   20%  — personalisation + return potential
//   Competition 15% — gap vs existing solutions
//   Revenue    10%  — CPC + premium conversion potential
//   Strategic  10%  — cluster fit + journey fit + platform roadmap
//
// Verdict thresholds:
//   80–100: build_now  — clear market, strong AI fit, winnable SEO
//   60–79:  build_soon — solid opportunity, worth queuing
//   40–59:  watch      — signals are there but not urgent
//   0–39:   skip       — low demand, poor fit, or dominated SERP
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ProblemSignal, SEOPotential, AICoachPotential, SERPAnalysis,
  KeywordCluster, PriorityScore, PriorityBreakdown, PriorityVerdict,
} from '../types'

const WEIGHTS = {
  demand:      0.25,
  seo:         0.20,
  aiCoach:     0.20,
  competition: 0.15,
  revenue:     0.10,
  strategic:   0.10,
} as const

// ── Sub-scorers ────────────────────────────────────────────────────────────────

function scoreDemand(signal: ProblemSignal): number {
  const vol = signal.searchVolume
  let base: number

  if (vol === null)     base = 40   // unknown — neutral, not zero
  else if (vol > 100_000) base = 100
  else if (vol > 50_000)  base = 88
  else if (vol > 10_000)  base = 74
  else if (vol > 1_000)   base = 58
  else if (vol > 100)     base = 40
  else                    base = 22

  const trendBonus: Record<string, number> = {
    rising:   15,
    stable:   0,
    declining: -20,
    unknown:   0,
  }

  return Math.min(100, Math.max(0, base + (trendBonus[signal.trend] ?? 0)))
}

function scoreSEO(seo: SEOPotential): number {
  // Difficulty: lower is better
  let base: number
  const d = seo.avgDifficulty
  if (d < 20)      base = 95
  else if (d < 35) base = 80
  else if (d < 50) base = 63
  else if (d < 70) base = 45
  else             base = 25

  const snippetBonus    = seo.featuredSnippetOpportunity ? 12 : 0
  const multilingualBonus = Math.min(20, seo.multilingualPotential.length * 4)

  return Math.min(100, Math.max(0, base + snippetBonus + multilingualBonus))
}

function scoreAICoach(ai: AICoachPotential): number {
  const flags = [ai.personalizable, ai.returnable, ai.journeyFit, ai.upsellPotential]
  const count = flags.filter(Boolean).length
  // 4/4=100, 3/4=75, 2/4=50, 1/4=25, 0/4=0
  return count * 25
}

function scoreCompetition(serp: SERPAnalysis): number {
  if (serp.topCompetitors.length === 0) return 60   // no competitors = no market certainty

  const totalGaps = serp.topCompetitors.reduce((sum, c) => sum + c.gaps.length, 0)
  const avgGaps   = totalGaps / serp.topCompetitors.length

  // Many gaps = better opportunity
  let base: number
  if (avgGaps >= 3)  base = 90
  else if (avgGaps >= 2) base = 75
  else if (avgGaps >= 1) base = 58
  else               base = 30   // competitors cover it well — hard to differentiate

  // Low-DA competitors are easier to beat
  const avgDA = serp.topCompetitors.reduce((sum, c) => sum + (c.da ?? 50), 0) / serp.topCompetitors.length
  const daBonus = avgDA < 30 ? 10 : avgDA < 50 ? 5 : 0

  return Math.min(100, Math.max(0, base + daBonus))
}

function scoreRevenue(keywords: KeywordCluster, ai: AICoachPotential): number {
  const allKeywords = [...keywords.primary, ...keywords.longtail]
  if (allKeywords.length === 0) return 30

  const avgCPC = allKeywords.filter(k => k.cpc !== null).reduce((sum, k) => sum + k.cpc!, 0)
    / (allKeywords.filter(k => k.cpc !== null).length || 1)

  let cpcScore: number
  if (avgCPC > 3)      cpcScore = 90
  else if (avgCPC > 2) cpcScore = 75
  else if (avgCPC > 1) cpcScore = 60
  else if (avgCPC > 0.5) cpcScore = 45
  else                 cpcScore = 30

  const upsellBonus = ai.upsellPotential ? 15 : 0
  return Math.min(100, Math.max(0, cpcScore + upsellBonus))
}

function scoreStrategic(signal: ProblemSignal, ai: AICoachPotential): number {
  // Priority clusters for SolviqLAB platform — expand as new verticals added
  const PRIORITY_CLUSTERS: Record<string, number> = {
    // Health
    weight:       100,
    sleep:         95,
    pregnancy:     80,
    fitness:       75,
    nutrition:     70,
    stress:        70,
    anxiety:       72,
    mental:        68,
    // Finance
    finance:       65,
    budget:        62,
    debt:          68,
    tax:           60,
    // Legal
    legal:         55,
    contract:      52,
    // Education
    education:     50,
    learning:      48,
    // Default for unmapped — warn so we can add it
  }

  const clusterScore = PRIORITY_CLUSTERS[signal.cluster.toLowerCase()]
    ?? PRIORITY_CLUSTERS[signal.cluster.toLowerCase().split(' ')[0]!]
    ?? 50  // neutral default (was 40 — too penalising for uncategorised clusters)

  const journeyBonus  = ai.journeyFit  ? 10 : 0
  const returnBonus   = ai.returnable  ? 10 : 0

  return Math.min(100, Math.max(0, clusterScore * 0.8 + journeyBonus + returnBonus))
}

// ── Verdict ────────────────────────────────────────────────────────────────────

function toVerdict(total: number, breakdown: PriorityBreakdown): { verdict: PriorityVerdict; reason: string } {
  if (total >= 80) {
    return {
      verdict: 'build_now',
      reason:  `Strong demand (${breakdown.demand}), winnable SEO (${breakdown.seo}), high AI fit (${breakdown.aiCoach}). Build immediately.`,
    }
  }
  if (total >= 60) {
    const weakest = Object.entries(breakdown).sort(([,a],[,b]) => a - b)[0]
    return {
      verdict: 'build_soon',
      reason:  `Solid opportunity. Weakest dimension: ${weakest?.[0]} (${weakest?.[1]}). Address before launch.`,
    }
  }
  if (total >= 40) {
    return {
      verdict: 'watch',
      reason:  `Some signals but not urgent. Monitor for 90 days. If trend shifts to rising, reassess.`,
    }
  }
  return {
    verdict: 'skip',
    reason:  `Total score ${total} — low demand or poor AI fit or saturated SERP. Revisit only if signals change.`,
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface ScorerInputs {
  problem:   ProblemSignal
  seo:       SEOPotential
  aiCoach:   AICoachPotential
  serp:      SERPAnalysis
  keywords:  KeywordCluster
}

export class PriorityScorer {
  score(inputs: ScorerInputs): PriorityScore {
    const breakdown: PriorityBreakdown = {
      demand:      Math.round(scoreDemand(inputs.problem)),
      seo:         Math.round(scoreSEO(inputs.seo)),
      aiCoach:     Math.round(scoreAICoach(inputs.aiCoach)),
      competition: Math.round(scoreCompetition(inputs.serp)),
      revenue:     Math.round(scoreRevenue(inputs.keywords, inputs.aiCoach)),
      strategic:   Math.round(scoreStrategic(inputs.problem, inputs.aiCoach)),
    }

    const total = Math.round(
      breakdown.demand      * WEIGHTS.demand      +
      breakdown.seo         * WEIGHTS.seo         +
      breakdown.aiCoach     * WEIGHTS.aiCoach     +
      breakdown.competition * WEIGHTS.competition +
      breakdown.revenue     * WEIGHTS.revenue     +
      breakdown.strategic   * WEIGHTS.strategic
    )

    const { verdict, reason } = toVerdict(total, breakdown)

    return { total, breakdown, verdict, verdictReason: reason }
  }
}
