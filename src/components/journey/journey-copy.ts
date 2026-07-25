import type { IntentPhase, IntentState } from '@/lib/domain/intent-state'
import type { IntentCluster } from '@/lib/assessment/types'

// ── Phase identity ────────────────────────────────────────────────────────────

export const PHASE_ICON: Record<IntentPhase, string> = {
  discovery:  '🔍',
  assessment: '📋',
  planning:   '🎯',
  execution:  '🚀',
  habit:      '⭐',
}

export const PHASE_LABEL: Record<IntentPhase, string> = {
  discovery:  'Building Your Profile',
  assessment: 'Ready for Assessment',
  planning:   'Strategy Ready',
  execution:  'On Your Journey',
  habit:      'Goal Achieved',
}

// ── Hero statements — per UX Bible Part II (Emotional Arc) ───────────────────
// Hero: 20–24px, weight 700. Sub: 14px, weight 400.
// Wrong: "Your BMI is 29.8." Right: "Your profile is taking shape."

export const PHASE_HERO: Record<IntentPhase, string> = {
  discovery:  'Your profile is taking shape.',
  assessment: "You've built enough of a profile.",
  planning:   'Your strategy is ready.',
  execution:  'Your plan is active.',
  habit:      'You did it.',
}

export function buildHeroSub(intent: IntentState): string {
  const { currentPhase, completedInstruments, activePlan, latestAssessment } = intent
  const count = completedInstruments.length

  if (currentPhase === 'habit' && activePlan) {
    return `That took discipline. Ready to explore what's next?`
  }
  if (currentPhase === 'execution' && activePlan) {
    const weeks = activePlan.check_ins.length
    return weeks > 0
      ? `Week ${weeks + 1} of your plan. Another week of data — your plan is adapting to your results.`
      : `Your plan is live. First check-in unlocks adaptive coaching.`
  }
  if (currentPhase === 'planning') {
    return `Set your goal — and the plan becomes yours.`
  }
  if (currentPhase === 'assessment' && latestAssessment) {
    return `Assessment score: ${latestAssessment.overall_score}/100. Your personal strategy is ready.`
  }
  if (currentPhase === 'assessment') {
    return `3 minutes — and we'll know exactly where to start.`
  }
  // Discovery — data-specific
  if (count === 1) return `One data point saved — let's build the full picture.`
  if (count === 2) return `${count} metrics collected. One more to unlock your personal assessment.`
  return `${count} metrics collected. Assessment ready — takes 3 minutes.`
}

// ── CTA copy — formula: [Action verb] + [Personal benefit or identity claim] ──
// Per UX Bible Part IV. Never: "Continue", "Submit", "Next", "Go", "OK"

export const CTA_PRIMARY: Record<IntentPhase, string> = {
  discovery:  'Continue My Journey',
  assessment: 'Start My Assessment',
  planning:   'Build My Plan',
  execution:  'Log My Check-In',
  habit:      'Start My Next Goal',
}

// ── Why-now hook — 1 sentence before CTA, per UX Bible Part IV ───────────────
// Explains what happens when user clicks — not what they're clicking on.

export const WHY_NOW: Record<IntentPhase, string> = {
  discovery:  'Your data is ready — personalization takes 3 minutes.',
  assessment: "Your data is ready. Don't let it sit unused.",
  planning:   'Your strategy is waiting. Setting your goal takes 1 minute.',
  execution:  'Week checkpoint reached. Check in to keep your plan adapting.',
  habit:      'Your journey is complete. The next challenge is ready.',
}

// ── Why-this — data-specific reasoning, per UX Bible Part VII ─────────────────
// Formula: "Without [X], we can't build [Y] that accounts for [Z]."
// Must be specific to user's data — never generic marketing.

export function buildWhyThis(intent: IntentState): string {
  const {
    currentPhase, completedInstruments,
    latestAssessment, activePlan, recommendationDecision, clusterId,
  } = intent
  const count = completedInstruments.length

  // Use recommendation decision reasons if specific enough
  if (recommendationDecision?.reasons[0]) {
    return recommendationDecision.reasons[0]
  }

  if (currentPhase === 'assessment') {
    if (latestAssessment) {
      return `Your score (${latestAssessment.overall_score}/100) unlocks a strategy matched to your specific profile — not a generic plan.`
    }
    return `Without this assessment, we can't build a ${clusterId} plan that fits your actual lifestyle.`
  }
  if (currentPhase === 'planning' && latestAssessment) {
    return `Your assessment is complete. This step turns your data into a goal that adapts as you progress.`
  }
  if (currentPhase === 'execution' && activePlan) {
    const checkIns = activePlan.check_ins.length
    return checkIns === 0
      ? `First check-in unlocks adaptive coaching — your plan adjusts based on your actual results.`
      : `${checkIns} week${checkIns > 1 ? 's' : ''} of data collected. Each check-in makes your plan more accurate.`
  }
  if (currentPhase === 'habit') {
    return `You've achieved your goal. The next horizon extends what you've already built.`
  }

  // Discovery — build toward assessment
  if (count === 1) {
    return `This step adds a second data point. We need at least 3 to build your personal profile.`
  }
  if (count === 2) {
    return `One more step and your assessment unlocks — built entirely around your specific data.`
  }
  return `Each step builds a more accurate picture of your situation — and a more precise plan.`
}

// ── Unlock preview — what this step enables ───────────────────────────────────
// Per UX Bible Part III (Unlock Mechanic): preview the reward, not a feature list

export const PHASE_UNLOCK: Record<IntentPhase, string[]> = {
  discovery:  ['Assessment', 'Strategy', 'Personal Plan', 'AI Coach'],
  assessment: ['Strategy', 'Personal Plan', 'AI Coach'],
  planning:   ['Personal Plan', 'AI Coach'],
  execution:  ['Weekly Check-ins', 'AI Coach', 'New Goal'],
  habit:      ['New Goal'],
}

// ── Progress text — per UX Bible Part III (Progress Bias) ─────────────────────
// "You're 33% closer to your personal plan." converts distance into momentum.
// Wrong: "5 steps left". Right: "You're 33% closer."

export function progressText(step: number, total: number): string {
  const pct = Math.min(Math.round((step / total) * 100), 100)
  if (pct === 0) return 'Your journey starts here.'
  if (pct === 100) return 'Journey complete. You did the work.'
  return `You're ${pct}% closer to your personal plan.`
}

// ── Time estimates ────────────────────────────────────────────────────────────

export const TIME_ESTIMATE: Partial<Record<string, string>> = {
  'weight-assessment':        '3 min',
  'sleep-assessment':         '3 min',
  'finance-assessment':       '3 min',
  'bmi-calculator':           '1 min',
  'calorie-calculator':       '2 min',
  'body-fat-calculator':      '2 min',
  'ideal-weight-calculator':  '1 min',
  'macro-calculator':         '2 min',
  'protein-calculator':       '1 min',
  'tdee-calculator':          '2 min',
  'sleep-calculator':         '2 min',
  'savings-calculator':       '2 min',
}

// ── Cluster-aware assessment names ────────────────────────────────────────────

export const CLUSTER_ASSESSMENT_NAME: Record<IntentCluster, string> = {
  weight:         'Weight Assessment',
  sleep:          'Sleep Assessment',
  finance:        'Finance Assessment',
  pregnancy:      'Health Assessment',
  nutrition:      'Nutrition Assessment',
  fitness:        'Fitness Assessment',
  mental_health:  'Wellbeing Assessment',
  cardiovascular: 'Cardiovascular Assessment',
}

// ── JourneyCopySet — localised copy bundle ────────────────────────────────────

export interface JourneyCopySet {
  phaseLabel:            Record<IntentPhase, string>
  phaseHero:             Record<IntentPhase, string>
  ctaPrimary:            Record<IntentPhase, string>
  whyNow:                Record<IntentPhase, string>
  phaseUnlock:           Record<IntentPhase, readonly string[]>
  clusterAssessmentName: Record<IntentCluster, string>
  buildHeroSub:          (intent: IntentState) => string
  buildWhyThis:          (intent: IntentState) => string
  progressText:          (step: number, total: number) => string
  stepsCompleted:        (n: number) => string
  afterThis:             string
}

// ── English copy (reuses all existing exports) ────────────────────────────────

const EN_COPY: JourneyCopySet = {
  phaseLabel:            PHASE_LABEL,
  phaseHero:             PHASE_HERO,
  ctaPrimary:            CTA_PRIMARY,
  whyNow:                WHY_NOW,
  phaseUnlock:           PHASE_UNLOCK,
  clusterAssessmentName: CLUSTER_ASSESSMENT_NAME,
  buildHeroSub,
  buildWhyThis,
  progressText,
  stepsCompleted: (n) => `${n} ${n === 1 ? 'step' : 'steps'} completed`,
  afterThis: 'After this:',
}

// ── Ukrainian copy ────────────────────────────────────────────────────────────

const PHASE_LABEL_UK: Record<IntentPhase, string> = {
  discovery:  'Будуємо профіль',
  assessment: 'Готові до оцінки',
  planning:   'Стратегія готова',
  execution:  'На шляху',
  habit:      'Мета досягнута',
}

const PHASE_HERO_UK: Record<IntentPhase, string> = {
  discovery:  'Ваш профіль набуває форми.',
  assessment: 'Ви зібрали достатньо даних.',
  planning:   'Ваша стратегія готова.',
  execution:  'Ваш план активний.',
  habit:      'Ви зробили це.',
}

const CTA_PRIMARY_UK: Record<IntentPhase, string> = {
  discovery:  'Продовжити мій шлях',
  assessment: 'Розпочати оцінку',
  planning:   'Побудувати мій план',
  execution:  'Записати результат',
  habit:      'Розпочати нову ціль',
}

const WHY_NOW_UK: Record<IntentPhase, string> = {
  discovery:  'Ваші дані готові — персоналізація займе 3 хвилини.',
  assessment: 'Ваші дані готові. Не дайте їм пропасти.',
  planning:   'Ваша стратегія чекає. Встановити ціль займе 1 хвилину.',
  execution:  'Час для тижневого чекіну. Відстежте прогрес.',
  habit:      'Ваш шлях завершено. Наступний виклик вже готовий.',
}

const PHASE_UNLOCK_UK: Record<IntentPhase, readonly string[]> = {
  discovery:  ['Оцінка', 'Стратегія', 'Особистий план', 'AI Коуч'] as const,
  assessment: ['Стратегія', 'Особистий план', 'AI Коуч'] as const,
  planning:   ['Особистий план', 'AI Коуч'] as const,
  execution:  ['Тижневі чекіни', 'AI Коуч', 'Нова ціль'] as const,
  habit:      ['Нова ціль'] as const,
}

const CLUSTER_ASSESSMENT_NAME_UK: Record<IntentCluster, string> = {
  weight:         'Оцінка ваги',
  sleep:          'Оцінка сну',
  finance:        'Фінансова оцінка',
  pregnancy:      "Оцінка здоров'я",
  nutrition:      'Оцінка харчування',
  fitness:        'Фітнес-оцінка',
  mental_health:  'Оцінка самопочуття',
  cardiovascular: 'Кардіологічна оцінка',
}

function buildHeroSubUk(intent: IntentState): string {
  const { currentPhase, completedInstruments, activePlan, latestAssessment } = intent
  const count = completedInstruments.length
  if (currentPhase === 'habit' && activePlan) return 'Це потребувало дисципліни. Готові до нового виклику?'
  if (currentPhase === 'execution' && activePlan) {
    const weeks = activePlan.check_ins.length
    return weeks > 0
      ? `Тиждень ${weeks + 1} вашого плану. Ще тиждень даних — план адаптується.`
      : 'Ваш план активний. Перший чекін розблоковує адаптивний коучинг.'
  }
  if (currentPhase === 'planning') return 'Встановіть ціль — і план стає вашим.'
  if (currentPhase === 'assessment' && latestAssessment) return `Оцінка: ${latestAssessment.overall_score}/100. Ваша особиста стратегія готова.`
  if (currentPhase === 'assessment') return '3 хвилини — і ми точно знатимемо, з чого почати.'
  if (count === 1) return 'Одна точка даних збережена — будуємо повну картину.'
  if (count === 2) return `${count} метрики зібрано. Ще один крок — і розблокується ваша особиста оцінка.`
  return `${count} метрик зібрано. Оцінка готова — займе 3 хвилини.`
}

function buildWhyThisUk(intent: IntentState): string {
  const { currentPhase, completedInstruments, latestAssessment, activePlan, clusterId } = intent
  const count = completedInstruments.length
  if (currentPhase === 'assessment') {
    if (latestAssessment) return `Ваша оцінка (${latestAssessment.overall_score}/100) відкриває стратегію, яка підходить саме вам.`
    return `Без цієї оцінки ми не зможемо побудувати план ${clusterId}, який враховує ваш спосіб життя.`
  }
  if (currentPhase === 'planning' && latestAssessment) return 'Ваша оцінка завершена. Цей крок перетворює дані на ціль.'
  if (currentPhase === 'execution' && activePlan) {
    const checkIns = activePlan.check_ins.length
    return checkIns === 0
      ? 'Перший чекін розблоковує адаптивний коучинг — план підлаштовується під ваші результати.'
      : `${checkIns} ${checkIns > 1 ? 'тижні' : 'тиждень'} даних зібрано. Кожен чекін робить план точнішим.`
  }
  if (currentPhase === 'habit') return 'Ви досягли мети. Наступний горизонт продовжує те, що ви вже побудували.'
  if (count === 1) return 'Цей крок додає другу точку даних. Нам потрібно щонайменше 3 для вашого профілю.'
  if (count === 2) return 'Ще один крок — і оцінка розблоковується, побудована навколо ваших конкретних даних.'
  return 'Кожен крок будує точнішу картину вашої ситуації — і точніший план.'
}

function progressTextUk(step: number, total: number): string {
  const pct = Math.min(Math.round((step / total) * 100), 100)
  if (pct === 0) return 'Ваш шлях починається тут.'
  if (pct === 100) return 'Шлях завершено. Ви це зробили.'
  return `Ви на ${pct}% ближче до особистого плану.`
}

const UK_COPY: JourneyCopySet = {
  phaseLabel:            PHASE_LABEL_UK,
  phaseHero:             PHASE_HERO_UK,
  ctaPrimary:            CTA_PRIMARY_UK,
  whyNow:                WHY_NOW_UK,
  phaseUnlock:           PHASE_UNLOCK_UK,
  clusterAssessmentName: CLUSTER_ASSESSMENT_NAME_UK,
  buildHeroSub:          buildHeroSubUk,
  buildWhyThis:          buildWhyThisUk,
  progressText:          progressTextUk,
  stepsCompleted: (n) => {
    if (n === 1) return '1 крок завершено'
    if (n >= 2 && n <= 4) return `${n} кроки завершено`
    return `${n} кроків завершено`
  },
  afterThis: 'Після цього:',
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function getJourneyCopy(lang: string): JourneyCopySet {
  if (lang === 'uk') return UK_COPY
  return EN_COPY
}
