import type { Metadata } from 'next'
import Link from 'next/link'
import { QUIZ_REGISTRY } from '@/lib/quiz/registry'
import { t } from '@/lib/ui-strings'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']
const BASE_URL = 'https://solviqlab.com'

interface PageProps {
  params: { lang: string }
}

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  const s = t(lang)
  const url = `${BASE_URL}/${lang}/quiz`
  return {
    title:       `${s.quizPageTitle} | SolviqLab`,
    description: s.quizPageSubtitle,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map(l => [l, `${BASE_URL}/${l}/quiz`])
      ),
    },
    openGraph: {
      title:       `${s.quizPageTitle} | SolviqLab`,
      description: s.quizPageSubtitle,
      url,
      type:        'website',
    },
  }
}

export default function QuizIndexPage({ params }: PageProps) {
  const { lang } = params
  const s = t(lang)
  const quizzes = Object.values(QUIZ_REGISTRY)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {s.quizPageTitle}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            {s.quizPageSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quizzes.map(quiz => {
            const name = s.quizNames[quiz.slug] ?? quiz.title
            const clusterLabel = s.quizClusterLabels[quiz.cluster] ?? quiz.cluster
            return (
              <Link
                key={quiz.slug}
                href={`/${lang}/quiz/${quiz.slug}`}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all group"
              >
                <div className="text-3xl flex-shrink-0 mt-0.5">{quiz.icon}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors text-sm leading-snug mb-1">
                    {name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mb-2">
                    {quiz.description}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium">
                      {s.quizQuestionsLabel(quiz.questions.length)} · {s.quizFreeLabel}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {clusterLabel}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-12 text-slate-400 dark:text-slate-500 text-sm">
          {s.quizPageFooter}
        </div>
      </div>
    </div>
  )
}
