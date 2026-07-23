// ─────────────────────────────────────────────────────────────────────────────
// Universal Assessment Engine
//
// Reads PersonalHealthProfile via ProfileEngine.
// Evaluates AssessmentConfig (pure data) to produce AssessmentResult.
//
// Design invariants:
//   1. No DOM access, no localStorage — pure function over data.
//   2. Deterministic: same profile + config → same result.
//   3. Never throws — returns partial result on missing data.
//   4. AI Coach receives AssessmentAIContext, not the full result.
// ─────────────────────────────────────────────────────────────────────────────

import type { PersonalHealthProfile } from '../profile/types'
import type { HealthSignal } from '../profile/types'
import type {
  AssessmentConfig,
  AssessmentResult,
  AssessmentNarrative,
  AssessmentConfidence,
  AssessmentQuestion,
  AssessmentAIContext,
  ClusterCard,
  DimensionScore,
  GateResult,
  Insight,
  QuestionAnswers,
  RecommendationBoost,
  ResolvedSignals,
  ScoreTier,
} from './types'
import { buildResolvedSignals, countCompletedInCluster, extractGender, CLUSTER_INSTRUMENTS } from './profile-reader'
import { evaluateScoringRule, extractMetrics } from './scoring'
import { evaluateCondition } from './insights'
import { resolveString, scoreTier } from './strings'

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveConfidence(
  config: AssessmentConfig,
  profile: PersonalHealthProfile
): AssessmentConfidence {
  const values = config.trigger.required_domains.map(req =>
    profile.domains[req.domain]?.confidence ?? 0
  )
  const avg = values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

  if (avg >= 70) return 'comprehensive'
  if (avg >= 40) return 'established'
  if (avg >= 15) return 'preliminary'
  return 'insufficient'
}

function buildInsightParams(
  metrics: readonly string[],
  signals: ResolvedSignals
): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  for (const m of metrics) {
    const sig = signals[m]
    if (sig) {
      params[m] = sig.value != null
        ? (Number.isInteger(sig.value) ? sig.value : Math.round(sig.value * 10) / 10)
        : (sig.label ?? '')
    }
  }
  return params
}

function tierColor(tier: ScoreTier): 'emerald' | 'blue' | 'amber' | 'red' {
  if (tier === 'excellent') return 'emerald'
  if (tier === 'good')      return 'blue'
  if (tier === 'fair')      return 'amber'
  return 'red'
}

// ── AssessmentEngine ──────────────────────────────────────────────────────────

export class AssessmentEngine {

  // ── Gate Check ────────────────────────────────────────────────────────────────

  canRun(config: AssessmentConfig, profile: PersonalHealthProfile): GateResult {
    const clusterSlugs = CLUSTER_INSTRUMENTS[config.cluster] ?? []
    const completed = countCompletedInCluster(profile, clusterSlugs)

    if (completed < config.trigger.min_instruments_completed) {
      return {
        can_run: false,
        confidence: 'insufficient',
        missing_domains: config.trigger.required_domains.map(r => r.domain),
        missing_instruments: clusterSlugs.filter(
          s => !profile.timeline.some(t => t.instrument_slug === s)
        ),
        message_key: 'assessment.gate.need_more_instruments',
      }
    }

    const missingDomains: string[] = []
    for (const req of config.trigger.required_domains) {
      const conf = profile.domains[req.domain]?.confidence ?? 0
      if (conf < req.min_confidence) missingDomains.push(req.domain)
    }

    if (missingDomains.length > 0) {
      return {
        can_run: false,
        confidence: 'insufficient',
        missing_domains: missingDomains,
        missing_instruments: [],
        message_key: 'assessment.gate.need_domain_data',
      }
    }

    return {
      can_run: true,
      confidence: deriveConfidence(config, profile),
      missing_domains: [],
      missing_instruments: [],
      message_key: null,
    }
  }

  // ── Gap Questions ─────────────────────────────────────────────────────────────

  getGapQuestions(
    config: AssessmentConfig,
    signals: ResolvedSignals
  ): readonly AssessmentQuestion[] {
    return config.gap_questions.filter(q => {
      if (!q.ask_if_signal_absent) return true
      return !(q.ask_if_signal_absent in signals)
    })
  }

  // ── Main Run ──────────────────────────────────────────────────────────────────

  run(
    config: AssessmentConfig,
    profile: PersonalHealthProfile,
    answers: QuestionAnswers,
    lang: string
  ): AssessmentResult {
    const signals = buildResolvedSignals(profile)
    const gender = extractGender(signals)

    // Merge gap question answers as synthetic signal lookups
    const mergedSignals: Record<string, HealthSignal> = { ...signals }
    for (const [key, val] of Object.entries(answers)) {
      if (!(key in mergedSignals)) {
        // Create a minimal synthetic signal for scoring lookups
        mergedSignals[key] = {
          id: `answer:${key}`,
          instrument_slug: 'assessment-gap',
          domain: 'lifestyle',
          metric: key,
          value: typeof val === 'number' ? val : null,
          label: typeof val === 'string' ? val : null,
          unit: null,
          status: 'normal',
          confidence_contribution: 0,
          recorded_at: new Date().toISOString(),
        }
      }
    }

    // ── Score dimensions ────────────────────────────────────────────────────────
    const dimensionScores: DimensionScore[] = []

    for (const dim of config.dimensions) {
      const domainConf = profile.domains[dim.id.includes('composition') ? 'weight'
        : dim.id.includes('metabolism') ? 'metabolism'
        : dim.id.includes('nutrition') ? 'nutrition'
        : dim.id.includes('sleep') ? 'sleep'
        : dim.id.includes('recovery') ? 'recovery'
        : 'lifestyle']?.confidence ?? 0

      const contributingMetrics = extractMetrics(dim.scoring_rule)
      const hasAnySignal = contributingMetrics.some(m => m in mergedSignals)

      if (domainConf < dim.min_confidence && !hasAnySignal) continue

      const score = evaluateScoringRule(dim.scoring_rule, mergedSignals, gender)
      const dimConf = domainConf >= 60 ? 'comprehensive'
        : domainConf >= 35 ? 'established'
        : domainConf >= 10 ? 'preliminary'
        : 'insufficient'

      dimensionScores.push({
        dimension_id: dim.id,
        label: resolveString(dim.label_key),
        score,
        weight: dim.weight,
        confidence: dimConf,
        contributing_signals: contributingMetrics.filter(m => m in mergedSignals),
      })
    }

    // ── Overall score ────────────────────────────────────────────────────────────
    const totalWeight = dimensionScores.reduce((s, d) => s + d.weight, 0)
    const overallScore = totalWeight === 0 ? 0
      : Math.round(dimensionScores.reduce((s, d) => s + d.score * d.weight, 0) / totalWeight)

    // ── Evaluate insight rules ───────────────────────────────────────────────────
    const dimScoreMap = new Map(dimensionScores.map(d => [d.dimension_id, d.score]))
    const insights: Insight[] = []

    for (const rule of config.insight_rules) {
      if (!evaluateCondition(rule.condition, dimScoreMap, mergedSignals, overallScore)) continue
      const params = rule.insight.params_from_signals
        ? buildInsightParams(rule.insight.params_from_signals, mergedSignals)
        : undefined
      insights.push({
        id:       rule.id,
        type:     rule.insight.type,
        priority: rule.insight.priority,
        title:    resolveString(rule.insight.title_key, params),
        body:     resolveString(rule.insight.body_key, params),
      })
    }

    insights.sort((a, b) => a.priority - b.priority)

    // ── Build narrative ──────────────────────────────────────────────────────────
    const narrative = this._buildNarrative(config, overallScore, insights, mergedSignals)
    const confidence = deriveConfidence(config, profile)

    return {
      assessment_id:   `${config.id}-${Date.now()}`,
      cluster:         config.cluster,
      config_id:       config.id,
      config_version:  config.version,
      overall_score:   overallScore,
      confidence,
      dimension_scores: dimensionScores,
      insights,
      narrative,
      completed_at: new Date().toISOString(),
      lang,
    }
  }

  // ── Narrative Builder ─────────────────────────────────────────────────────────

  private _buildNarrative(
    config: AssessmentConfig,
    overallScore: number,
    insights: readonly Insight[],
    signals: ResolvedSignals
  ): AssessmentNarrative {
    const tier = scoreTier(overallScore)
    const headlineKey = config.narrative.headline_by_tier[tier]
    const headline = resolveString(headlineKey)

    // Find matching profile classifier (first match wins)
    const dimScoreMap = new Map<string, number>()
    let profileType: string | null = null
    let profileDescription: string | null = null

    for (const classifier of config.narrative.profile_classifiers) {
      if (evaluateCondition(classifier.condition, dimScoreMap, signals, overallScore)) {
        profileType = resolveString(classifier.label_key)
        profileDescription = resolveString(classifier.description_key)
        break
      }
    }

    const keyPoints = insights.slice(0, config.narrative.max_key_points)
    const ctaConfig = overallScore >= 60
      ? config.narrative.cta.high_score
      : config.narrative.cta.low_score

    return {
      headline,
      profile_type: profileType,
      profile_description: profileDescription,
      key_points: keyPoints,
      cta_label: resolveString(ctaConfig.label_key),
      cta_product_id: ctaConfig.product_id,
    }
  }

  // ── Dashboard Card ────────────────────────────────────────────────────────────

  buildDashboardCard(result: AssessmentResult): ClusterCard {
    const tier = scoreTier(result.overall_score)
    return {
      cluster:       result.cluster,
      cluster_label: result.cluster.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      overall_score: result.overall_score,
      score_tier:    tier,
      color:         tierColor(tier),
      top_insight:   result.insights[0] ?? null,
      cta_label:     result.narrative.cta_label,
      cta_product_id: result.narrative.cta_product_id,
      completed_at:  result.completed_at,
      confidence:    result.confidence,
    }
  }

  // ── AI Coach Context ──────────────────────────────────────────────────────────

  buildAIContext(
    result: AssessmentResult,
    profile: PersonalHealthProfile
  ): AssessmentAIContext {
    const signals = buildResolvedSignals(profile)

    const dataSources = result.dimension_scores.flatMap(d =>
      d.contributing_signals.map(metric => {
        const sig = signals[metric]
        return {
          instrument_slug: sig?.instrument_slug ?? 'unknown',
          metric,
          value: sig?.value ?? null,
          label: sig?.label ?? null,
          recorded_at: sig?.recorded_at ?? result.completed_at,
        }
      })
    )

    // Determine missing signals — metrics referenced by config but absent from signals
    const allConfigMetrics = new Set(
      result.dimension_scores.flatMap(d => d.contributing_signals)
    )
    const missingSignals = [...allConfigMetrics]
      .filter(m => !(m in signals))
      .map(m => ({
        metric: m,
        would_improve: `${result.cluster} assessment accuracy`,
      }))

    return {
      cluster:        result.cluster,
      assessment_id:  result.assessment_id,
      completed_at:   result.completed_at,
      summary: {
        overall_score:  result.overall_score,
        confidence:     result.confidence,
        profile_type:   result.narrative.profile_type,
        top_insights:   result.insights.slice(0, 3).map(i => ({
          type: i.type,
          text: `${i.title}: ${i.body}`,
        })),
        priority_action: result.narrative.cta_label,
      },
      data_sources: dataSources,
      missing_signals: missingSignals,
      dimension_breakdown: result.dimension_scores.map(d => ({
        dimension_id: d.dimension_id,
        label:        d.label,
        score:        d.score,
        confidence:   d.confidence,
      })),
    }
  }

  // ── Recommendation Boosts ─────────────────────────────────────────────────────

  buildRecommendationBoosts(
    result: AssessmentResult,
    config: AssessmentConfig
  ): readonly RecommendationBoost[] {
    const signals = {} as ResolvedSignals // already merged into result
    const dimScoreMap = new Map(result.dimension_scores.map(d => [d.dimension_id, d.score]))

    // Re-read signals from result's data_sources for condition evaluation
    const evalSignals: ResolvedSignals = {}
    // We don't have full signals here, but we can evaluate score/dimension conditions
    return config.recommendation_hooks
      .filter(hook =>
        evaluateCondition(hook.condition, dimScoreMap, evalSignals, result.overall_score)
      )
      .map(hook => ({
        product:     hook.boost_product,
        score_boost: hook.score_boost,
        reason:      hook.reason,
      }))
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _engine: AssessmentEngine | null = null

export function getAssessmentEngine(): AssessmentEngine {
  if (!_engine) _engine = new AssessmentEngine()
  return _engine
}
