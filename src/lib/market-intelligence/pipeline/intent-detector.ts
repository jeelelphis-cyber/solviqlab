// ─────────────────────────────────────────────────────────────────────────────
// IntentDetector — classifies each keyword cluster by product intent.
//
// Stage 4 of the pipeline: Clustering → Intent Detection
//
// Given a cluster of keywords, decides:
//   - Primary intent (calculator / quiz / planner / guide / assessment)
//   - Secondary intents
//   - AI Coach opportunity score
// ─────────────────────────────────────────────────────────────────────────────

import type { IntentType } from '../types'
import type { KeywordCluster } from './clusterer'

export interface IntentResult {
  primary:     IntentType
  secondary:   IntentType[]
  confidence:  number
  aiScore:     number         // 0-100: how strong is the Mia AI opportunity?
  aiRationale: string
}

// Cluster-id → known best intent (built from domain knowledge)
const CLUSTER_INTENT_MAP: Record<string, IntentType> = {
  'problem-cant-sleep':  'quiz',
  'problem-wake-tired':  'quiz',
  'problem-sleep-debt':  'calculator',
  'problem-snoring':     'assessment',
  'calc-sleep':          'calculator',
  'calc-bmi':            'calculator',
  'calc-calorie':        'calculator',
  'calc-tdee':           'calculator',
  'calc-body-fat':       'calculator',
  'calc-ideal-weight':   'calculator',
  'calc-macro':          'calculator',
  'calc-water':          'calculator',
  'plan-sleep':          'planner',
  'plan-diet':           'planner',
  'plan-workout':        'planner',
  'quiz-sleep':          'quiz',
  'quiz-body':           'quiz',
  'info-sleep-stages':   'guide',
  'info-how-much-sleep': 'calculator',
  'info-sleep-tips':     'guide',
}

// Secondary intents per primary
const SECONDARY_INTENTS: Record<IntentType, IntentType[]> = {
  calculator:  ['planner', 'ai_coach'],
  quiz:        ['assessment', 'ai_coach'],
  planner:     ['calculator', 'ai_coach'],
  guide:       ['calculator', 'quiz'],
  assessment:  ['calculator', 'ai_coach'],
  ai_coach:    ['calculator', 'planner'],
}

// AI opportunity score by cluster
const AI_SCORES: Record<string, number> = {
  'problem-cant-sleep':  95,
  'problem-wake-tired':  90,
  'problem-sleep-debt':  98,
  'problem-snoring':     70,
  'calc-sleep':          85,
  'calc-bmi':            90,
  'calc-calorie':        80,
  'calc-tdee':           75,
  'calc-body-fat':       80,
  'calc-ideal-weight':   82,
  'calc-macro':          70,
  'calc-water':          60,
  'plan-sleep':          92,
  'plan-diet':           80,
  'plan-workout':        75,
  'quiz-sleep':          90,
  'quiz-body':           72,
  'info-sleep-stages':   50,
  'info-how-much-sleep': 75,
  'info-sleep-tips':     65,
}

const AI_RATIONALE: Record<string, string> = {
  'problem-cant-sleep': 'User has an acute problem — Mia can ask targeted questions, detect anxiety patterns, and provide personalised sleep hygiene plan. Strong return potential.',
  'problem-sleep-debt': 'Highly quantifiable. Mia can calculate recovery timeline, set daily targets, connect to other clusters (weight, stress). Best journey fit.',
  'calc-sleep':         'After calculating optimal bedtime, Mia can build a personalised sleep schedule, track compliance, and adapt recommendations over time.',
  'calc-bmi':           'BMI alone is not actionable. Mia turns it into a personal story — "your BMI is X, here is what it means for your energy/sleep/weight goal".',
  'plan-sleep':         'Planner is inherently journey-based. Mia owns the 30-day arc. Premium upsell is natural (daily check-ins).',
}

export class IntentDetector {
  detect(cluster: KeywordCluster): IntentResult {
    const primaryFromMap = CLUSTER_INTENT_MAP[cluster.id]

    // Fallback: infer from keyword patterns
    const primary: IntentType = primaryFromMap ?? this.inferFromKeywords(cluster)
    const secondary = SECONDARY_INTENTS[primary] ?? []
    const aiScore   = AI_SCORES[cluster.id] ?? this.estimateAIScore(primary, cluster)
    const aiRationale = AI_RATIONALE[cluster.id]
      ?? `${primary} intent — ${aiScore > 80 ? 'strong' : aiScore > 60 ? 'moderate' : 'limited'} AI coaching opportunity.`

    return { primary, secondary, confidence: primaryFromMap ? 0.95 : 0.70, aiScore, aiRationale }
  }

  private inferFromKeywords(cluster: KeywordCluster): IntentType {
    const text = cluster.keywords.map(k => k.keyword).join(' ').toLowerCase()
    if (/quiz|test|am i/.test(text))                          return 'quiz'
    if (/plan|schedule|routine|planner/.test(text))           return 'planner'
    if (/calculator|calculate|how much|how many/.test(text))  return 'calculator'
    if (/assessment|risk|score/.test(text))                   return 'assessment'
    return 'guide'
  }

  private estimateAIScore(primary: IntentType, cluster: KeywordCluster): number {
    const base: Record<IntentType, number> = {
      calculator:  75,
      quiz:        80,
      planner:     85,
      guide:       45,
      assessment:  78,
      ai_coach:    95,
    }
    // Problem clusters (id starts with 'problem-') get a bonus
    const problemBonus = cluster.id.startsWith('problem-') ? 15 : 0
    return Math.min(100, (base[primary] ?? 60) + problemBonus)
  }
}
