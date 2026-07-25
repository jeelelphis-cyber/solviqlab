// ─────────────────────────────────────────────────────────────────────────────
// Quiz Registry — all 10 quiz configs indexed by slug
// ─────────────────────────────────────────────────────────────────────────────

import type { QuizConfig } from './types'
import { bmiQuiz }             from './configs/bmi-quiz'
import { sleepQuiz }           from './configs/sleep-quiz'
import { stressQuiz }          from './configs/stress-quiz'
import { burnoutQuiz }         from './configs/burnout-quiz'
import { depressionQuiz }      from './configs/depression-quiz'
import { anxietyQuiz }         from './configs/anxiety-quiz'
import { hydrationQuiz }       from './configs/hydration-quiz'
import { lifestyleQuiz }       from './configs/lifestyle-quiz'
import { weightReadinessQuiz } from './configs/weight-readiness-quiz'
import { energyQuiz }          from './configs/energy-quiz'

export const QUIZ_REGISTRY: Record<string, QuizConfig> = {
  'bmi-quiz':              bmiQuiz,
  'sleep-quiz':            sleepQuiz,
  'stress-quiz':           stressQuiz,
  'burnout-quiz':          burnoutQuiz,
  'depression-quiz':       depressionQuiz,
  'anxiety-quiz':          anxietyQuiz,
  'hydration-quiz':        hydrationQuiz,
  'lifestyle-quiz':        lifestyleQuiz,
  'weight-readiness-quiz': weightReadinessQuiz,
  'energy-quiz':           energyQuiz,
}

export const QUIZ_SLUGS = Object.keys(QUIZ_REGISTRY) as Array<keyof typeof QUIZ_REGISTRY>
