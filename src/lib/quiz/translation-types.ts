export interface QuizQuestionTranslation {
  text: string
  hint?: string
  options?: string[]
  scaleLabels?: { min: string; max: string }
}

export interface QuizBucketTranslation {
  label: string
  description: string
  actions?: string[]
  miaHook: string
}

export interface QuizTranslation {
  meta: {
    title: string
    description: string
    medicalNote?: string
  }
  likertOptions?: string[]
  reverseLikertOptions?: string[]
  yesnoOptions?: string[]
  questions: Record<string, QuizQuestionTranslation>
  buckets: QuizBucketTranslation[]
  seoContent: {
    intro: string
    faq?: Array<{ q: string; a: string }>
  }
  content: {
    whatIs?: string
    clinicalBackground?: string
    howScored?: string
    interpretation?: string
    whenToSeek?: string
    limitations?: string
  }
}
