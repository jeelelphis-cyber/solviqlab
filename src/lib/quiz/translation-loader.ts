import fs   from 'fs'
import path from 'path'
import type { QuizTranslation } from './translation-types'

const TRANS_DIR = path.join(process.cwd(), 'src/lib/quiz/translations')

export function loadQuizTranslation(slug: string, lang: string): QuizTranslation {
  for (const tryLang of [lang, 'en']) {
    const filePath = path.join(TRANS_DIR, slug, `${tryLang}.json`)
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as QuizTranslation
    }
  }
  // Fallback: return minimal structure so page doesn't crash
  return {
    meta: { title: slug, description: '' },
    questions: {},
    buckets: [],
    seoContent: { intro: '' },
    content: {},
  }
}
