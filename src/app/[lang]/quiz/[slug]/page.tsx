import type { Metadata } from 'next'
import { notFound }    from 'next/navigation'
import { QUIZ_SLUGS, QUIZ_REGISTRY } from '@/lib/quiz/registry'
import { QuizClient }  from '@/components/quiz/QuizClient'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']
const BASE_URL = 'https://solviqlab.com'

interface PageProps {
  params: { lang: string; slug: string }
}

// ── Static params — 10 quizzes × 10 languages = 100 pages ────────────────────
export function generateStaticParams() {
  return QUIZ_SLUGS.flatMap(slug =>
    SUPPORTED_LANGS.map(lang => ({ lang, slug }))
  )
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export function generateMetadata({ params }: PageProps): Metadata {
  const config = QUIZ_REGISTRY[params.slug]
  if (!config) return { title: 'Quiz Not Found' }

  const title       = `${config.title} — Free Health Quiz | SolviqLab`
  const description = config.description
  const url         = `${BASE_URL}/${params.lang}/quiz/${params.slug}`

  return {
    title,
    description,
    keywords: config.seoKeywords.join(', '),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map(l => [l, `${BASE_URL}/${l}/quiz/${params.slug}`])
      ),
    },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: `${BASE_URL}/og/${params.slug}`, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [`${BASE_URL}/og/${params.slug}`],
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QuizPage({ params }: PageProps) {
  const { lang, slug } = params
  const config = QUIZ_REGISTRY[slug]
  if (!config) notFound()

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type':    'Quiz',
    name:        config.title,
    description: config.description,
    url:         `${BASE_URL}/${lang}/quiz/${slug}`,
    inLanguage:  lang,
    author:      { '@type': 'Organization', name: 'SolviqLab', url: BASE_URL },
    isAccessibleForFree: true,
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Back link */}
        <div className="mb-6">
          <a
            href={`/${lang}/quiz`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <span>←</span> All Quizzes
          </a>
        </div>

        {/* Quiz card */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <QuizClient config={config} lang={lang} />
        </div>

        {/* Trust line */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Free · No account required · Results stay on your device
        </p>
      </div>
    </div>
  )
}
