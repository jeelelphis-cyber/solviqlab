// ─────────────────────────────────────────────────────────────────────────────
// KeywordClusterer — groups keywords into semantic problem clusters.
//
// Stage 3 of the pipeline: Cleaning → Clustering
//
// Strategy: rule-based pattern matching (fast, cheap, no LLM cost).
// Groups by: tool type, problem type, question type.
// Each cluster becomes a candidate ProductResearchPackage.
// ─────────────────────────────────────────────────────────────────────────────

import type { KeywordEntry } from '../types'

export interface KeywordCluster {
  id:         string
  label:      string
  keywords:   KeywordEntry[]
  totalVolume: number
  avgDifficulty: number | null
  avgCPC:     number | null
  topKeyword: string
}

// Cluster definitions: ordered by specificity (more specific first)
const CLUSTER_RULES: Array<{ id: string; label: string; patterns: RegExp[] }> = [
  // Problem / symptom clusters (these are the most valuable for AI Coach)
  { id: 'problem-cant-sleep',    label: "Can't Sleep / Insomnia",          patterns: [/can'?t (fall )?sleep/, /insomnia/, /trouble sleeping/, /can'?t fall asleep/] },
  { id: 'problem-wake-tired',    label: 'Wake Up Tired / Poor Sleep',      patterns: [/wake up tired/, /always tired/, /exhausted/, /fatigue/, /not rested/] },
  { id: 'problem-sleep-debt',    label: 'Sleep Debt / Deprivation',        patterns: [/sleep debt/, /sleep deprivation/, /catch up on sleep/, /sleep deficit/] },
  { id: 'problem-snoring',       label: 'Snoring / Sleep Apnea',           patterns: [/snor/, /sleep apnea/, /stop snoring/] },

  // Calculator clusters
  { id: 'calc-sleep',            label: 'Sleep Calculator',                patterns: [/sleep calculator/, /sleep cycle calculator/, /sleep hours calculator/, /how many hours of sleep/] },
  { id: 'calc-bmi',              label: 'BMI Calculator',                  patterns: [/bmi calculator/, /body mass index calculator/] },
  { id: 'calc-calorie',          label: 'Calorie Calculator',              patterns: [/calorie calculator/, /calories calculator/, /daily calorie/, /calorie counter/] },
  { id: 'calc-tdee',             label: 'TDEE / Metabolism Calculator',    patterns: [/tdee/, /total daily energy/, /metabolic rate calculator/, /bmr calculator/] },
  { id: 'calc-body-fat',         label: 'Body Fat Calculator',             patterns: [/body fat calculator/, /body fat percentage/] },
  { id: 'calc-ideal-weight',     label: 'Ideal Weight Calculator',         patterns: [/ideal weight/, /healthy weight calculator/] },
  { id: 'calc-macro',            label: 'Macro / Protein Calculator',      patterns: [/macro calculator/, /protein calculator/, /macronutrient/] },
  { id: 'calc-water',            label: 'Water Intake Calculator',         patterns: [/water intake/, /how much water/, /hydration calculator/] },

  // Planning / planner clusters
  { id: 'plan-sleep',            label: 'Sleep Schedule / Planner',        patterns: [/sleep schedule/, /sleep planner/, /sleep routine/, /bedtime calculator/, /wake up time/] },
  { id: 'plan-diet',             label: 'Meal / Diet Planner',             patterns: [/meal plan/, /diet plan/, /eating plan/] },
  { id: 'plan-workout',          label: 'Workout / Fitness Planner',       patterns: [/workout plan/, /exercise plan/, /training plan/] },

  // Quiz / test clusters
  { id: 'quiz-sleep',            label: 'Sleep Quality Quiz / Test',       patterns: [/sleep (quality|test|quiz)/, /am i (sleep deprived|tired|exhausted)/, /sleep disorder test/] },
  { id: 'quiz-body',             label: 'Body Type / Fitness Quiz',        patterns: [/body type quiz/, /fitness (quiz|test)/, /what (body|fitness) type am i/] },

  // Information / guide clusters
  { id: 'info-sleep-stages',     label: 'Sleep Stages / Science',          patterns: [/sleep stages?/, /rem sleep/, /deep sleep/, /sleep cycle/, /circadian/] },
  { id: 'info-how-much-sleep',   label: 'How Much Sleep Do I Need',        patterns: [/how much sleep/, /how many hours of sleep/, /sleep needs/, /sleep recommendations/] },
  { id: 'info-sleep-tips',       label: 'Sleep Tips / Improvement',        patterns: [/how to sleep better/, /sleep tips/, /improve sleep/, /sleep hygiene/] },
]

const OTHER_CLUSTER: { id: string; label: string } = { id: 'other', label: 'Other / Uncategorised' }

export class KeywordClusterer {
  cluster(keywords: KeywordEntry[]): KeywordCluster[] {
    const buckets = new Map<string, KeywordEntry[]>()

    for (const kw of keywords) {
      const k = kw.keyword.toLowerCase()
      let matched = false

      for (const rule of CLUSTER_RULES) {
        if (rule.patterns.some(p => p.test(k))) {
          if (!buckets.has(rule.id)) buckets.set(rule.id, [])
          buckets.get(rule.id)!.push(kw)
          matched = true
          break
        }
      }

      if (!matched) {
        if (!buckets.has(OTHER_CLUSTER.id)) buckets.set(OTHER_CLUSTER.id, [])
        buckets.get(OTHER_CLUSTER.id)!.push(kw)
      }
    }

    const clusters: KeywordCluster[] = []

    for (const [id, kws] of buckets.entries()) {
      if (kws.length === 0) continue
      const rule = CLUSTER_RULES.find(r => r.id === id) ?? OTHER_CLUSTER

      const totalVolume = kws.reduce((s, k) => s + (k.volume ?? 0), 0)
      const withDiff    = kws.filter(k => k.difficulty !== null)
      const avgDifficulty = withDiff.length > 0
        ? Math.round(withDiff.reduce((s, k) => s + k.difficulty!, 0) / withDiff.length)
        : null
      const withCPC  = kws.filter(k => k.cpc !== null)
      const avgCPC   = withCPC.length > 0
        ? Math.round(withCPC.reduce((s, k) => s + k.cpc!, 0) / withCPC.length * 100) / 100
        : null

      const topKeyword = kws.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0]?.keyword ?? ''

      clusters.push({ id, label: rule.label, keywords: kws, totalVolume, avgDifficulty, avgCPC, topKeyword })
    }

    // Sort by total volume descending
    return clusters.sort((a, b) => b.totalVolume - a.totalVolume)
  }
}
