// ─────────────────────────────────────────────────────────────────────────────
// Quiz Engine Types — Sprint M-1
// ─────────────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  text: string                  // EN text
  type: 'single' | 'scale' | 'yesno'
  options?: Array<{ value: number; label: string }>  // for 'single'
  scaleMin?: number             // for 'scale'
  scaleMax?: number
  scaleLabels?: { min: string; max: string }
}

export interface QuizConfig {
  slug: string
  cluster: 'weight' | 'sleep' | 'mental' | 'lifestyle' | 'energy'
  title: string                 // EN
  description: string           // EN
  icon: string                  // emoji
  questions: QuizQuestion[]     // 5-8 questions max
  scoring: {
    max: number
    buckets: Array<{
      min: number
      max: number
      label: string             // e.g. "High Risk", "Moderate", "Good"
      description: string
      miaHook: string           // what Mia says about this score in video
    }>
  }
  seoKeywords: string[]
}

export interface QuizAnswer {
  questionId: string
  value: number
}

export interface QuizResult {
  slug: string
  score: number
  bucket: string                // label of matched bucket
  description: string
  miaHook: string
  answeredAt: string            // ISO-8601
}
