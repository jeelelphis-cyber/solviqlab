// ─────────────────────────────────────────────────────────────────────────────
// Contradiction Detection
//
// Detects inconsistencies between signals across domains.
// Rules are explicit and explainable — not inferred by AI.
//
// CRITICAL: Never diagnose. Only describe the inconsistency.
// The AI Coach may explain contradictions in natural language,
// but the detection rules live here, not in the AI.
// ─────────────────────────────────────────────────────────────────────────────

import type { HealthSignal, Contradiction } from './types'

// ── Contradiction Rule ────────────────────────────────────────────────────────

interface ContradictionRule {
  readonly id: string
  readonly check: (signals: readonly HealthSignal[]) => ContradictionMatch | null
}

interface ContradictionMatch {
  readonly severity: Contradiction['severity']
  readonly domains: Contradiction['domains']
  readonly signalIds: string[]
  readonly description: string
  readonly suggestion: string
}

function makeContradictionId(ruleId: string, signalIds: string[]): string {
  const raw = `${ruleId}:${signalIds.sort().join(':')}`
  return raw.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    .toString(36).replace('-', 'n')
}

// ── Rules ─────────────────────────────────────────────────────────────────────

const RULES: readonly ContradictionRule[] = [
  // ── R1: Healthy BMI but very high calorie intake ──────────────────────────
  {
    id: 'R1',
    check(signals) {
      const bmi = signals.find(s => s.metric === 'bmi')
      const calories = signals.find(s => s.metric === 'daily_calories_kcal')
      if (!bmi || !calories || bmi.value === null || calories.value === null) return null
      if (bmi.value <= 18.5 && calories.value > 3000) {
        return {
          severity: 'medium',
          domains: ['weight', 'nutrition'],
          signalIds: [bmi.id, calories.id],
          description: 'Underweight BMI with high calorie intake appears inconsistent.',
          suggestion: 'Double-check your height and weight in the BMI calculator, and verify your calorie total includes all meals.',
        }
      }
      return null
    },
  },

  // ── R2: Overweight BMI but very low calorie intake ───────────────────────
  {
    id: 'R2',
    check(signals) {
      const bmi = signals.find(s => s.metric === 'bmi')
      const calories = signals.find(s => s.metric === 'daily_calories_kcal')
      if (!bmi || !calories || bmi.value === null || calories.value === null) return null
      if (bmi.value >= 25 && calories.value < 1000) {
        return {
          severity: 'medium',
          domains: ['weight', 'nutrition'],
          signalIds: [bmi.id, calories.id],
          description: 'Overweight BMI with very low calorie intake may be inconsistent.',
          suggestion: 'Your calorie intake seems very low. Make sure you have included all daily meals and snacks.',
        }
      }
      return null
    },
  },

  // ── R3: High TDEE but underweight BMI ────────────────────────────────────
  {
    id: 'R3',
    check(signals) {
      const bmi  = signals.find(s => s.metric === 'bmi')
      const tdee = signals.find(s => s.metric === 'tdee_kcal')
      if (!bmi || !tdee || bmi.value === null || tdee.value === null) return null
      if (bmi.value < 18.5 && tdee.value > 3500) {
        return {
          severity: 'low',
          domains: ['weight', 'metabolism'],
          signalIds: [bmi.id, tdee.id],
          description: 'Underweight BMI with a very high energy expenditure.',
          suggestion: 'If your TDEE is this high, ensure you are consuming enough calories to support your activity level.',
        }
      }
      return null
    },
  },

  // ── R4: Very low body fat but overweight BMI ─────────────────────────────
  {
    id: 'R4',
    check(signals) {
      const bmi     = signals.find(s => s.metric === 'bmi')
      const bodyFat = signals.find(s => s.metric === 'body_fat_percent')
      if (!bmi || !bodyFat || bmi.value === null || bodyFat.value === null) return null
      if (bmi.value >= 28 && bodyFat.value < 12) {
        return {
          severity: 'low',
          domains: ['weight', 'fitness'],
          signalIds: [bmi.id, bodyFat.id],
          description: 'High BMI with very low body fat — this can occur in heavily muscled individuals.',
          suggestion: 'BMI may not be the most accurate metric if you have significant muscle mass. Body fat percentage is a better indicator for athletes.',
        }
      }
      return null
    },
  },

  // ── R5: Severe sleep deficit but "Optimal" recovery label ────────────────
  {
    id: 'R5',
    check(signals) {
      const sleep    = signals.find(s => s.metric === 'sleep_hours')
      const recovery = signals.find(s => s.metric === 'recovery_quality')
      if (!sleep || !recovery || sleep.value === null) return null
      if (sleep.value < 5 && recovery.status === 'optimal') {
        return {
          severity: 'low',
          domains: ['sleep', 'recovery'],
          signalIds: [sleep.id, recovery.id],
          description: 'Very short sleep duration may conflict with optimal recovery.',
          suggestion: 'Check that your sleep hours reflect your actual nightly sleep, not total time in bed.',
        }
      }
      return null
    },
  },
]

// ── Detector ──────────────────────────────────────────────────────────────────

export function detectContradictions(signals: readonly HealthSignal[]): readonly Contradiction[] {
  const now = new Date().toISOString()
  const found: Contradiction[] = []

  for (const rule of RULES) {
    const match = rule.check(signals)
    if (!match) continue

    found.push({
      id: makeContradictionId(rule.id, match.signalIds),
      severity: match.severity,
      domains: match.domains,
      signals: match.signalIds,
      description: match.description,
      suggestion: match.suggestion,
      detected_at: now,
    })
  }

  return found
}
