// ─────────────────────────────────────────────────────────────────────────────
// Quiz Engine Types — Sprint M-2 (Clinical Standard)
// ─────────────────────────────────────────────────────────────────────────────

export interface QuizOption {
  value:  number
  label:  string
  next?:  string   // branch to this question ID (skips linear order)
}

export interface QuizQuestion {
  id:           string
  text:         string
  hint?:        string   // 1 line explaining why this question matters
  source?:      string   // citation e.g. "PHQ-9, Kroenke et al., JGIM 2001"
  type:         'single' | 'scale' | 'yesno' | 'likert'
  // 'likert' = same options for every question (PHQ-9, GAD-7, Epworth style)
  options?:     QuizOption[]
  scaleMin?:    number
  scaleMax?:    number
  scaleLabels?: { min: string; max: string }
  next?:        string   // explicit next question ID (non-branching jump)
}

export interface QuizScoreBucket {
  min:        number
  max:        number
  label:      string
  severity?:  'none' | 'mild' | 'moderate' | 'severe'
  description: string
  actions?:   string[]   // 3 specific things to do today
  miaHook:    string
}

export interface QuizSource {
  label: string
  url?:  string
}

export interface QuizFAQ {
  q: string
  a: string
}

export interface QuizConfig {
  slug:          string
  cluster:       'weight' | 'sleep' | 'mental' | 'lifestyle' | 'energy'
  title:         string
  description:   string
  icon:          string
  clinicalScale?: string   // e.g. 'PHQ-9', 'GAD-7', 'Epworth'
  sources?:      QuizSource[]
  medicalNote?:  string    // disclaimer shown before quiz
  questions:     QuizQuestion[]
  scoring: {
    max:        number
    normalize?: boolean   // default true → 0–100. false → use raw score vs buckets
    buckets:    QuizScoreBucket[]
  }
  seoContent?: {
    intro: string
    faq?:  QuizFAQ[]
  }
  seoKeywords: string[]
}

export interface QuizAnswer {
  questionId: string
  value:      number
}

export interface QuizResult {
  slug:        string
  score:       number
  rawScore?:   number    // raw score before normalization (for clinical scales)
  bucket:      string
  severity?:   string
  description: string
  actions?:    string[]
  miaHook:     string
  answeredAt:  string    // ISO-8601
}
