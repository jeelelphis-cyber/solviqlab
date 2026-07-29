import type { Metadata } from 'next'
import { notFound }     from 'next/navigation'
import { QUIZ_SLUGS, QUIZ_REGISTRY } from '@/lib/quiz/registry'
import { loadQuizTranslation }        from '@/lib/quiz/translation-loader'
import { getT }                       from '@/lib/i18n/ui'
import { t as uiT }                  from '@/lib/ui-strings'
import { QuizClient }                 from '@/components/quiz/QuizClient'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']
const BASE_URL = 'https://solviqlab.com'

interface PageProps {
  params: { lang: string; slug: string }
}

export function generateStaticParams() {
  return QUIZ_SLUGS.flatMap(slug =>
    SUPPORTED_LANGS.map(lang => ({ lang, slug }))
  )
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = QUIZ_REGISTRY[params.slug]
  if (!config) return { title: 'Quiz Not Found' }

  const tr        = loadQuizTranslation(params.slug, params.lang)
  const scaleTag  = config.clinicalScale ? ` (${config.clinicalScale})` : ''
  const title     = `${tr.meta.title}${scaleTag} — Free Online Test | SolviqLab`
  const description = tr.seoContent.intro
    ? tr.seoContent.intro.slice(0, 160)
    : tr.meta.description
  const url = `${BASE_URL}/${params.lang}/quiz/${params.slug}`

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
      title, description, url,
      images: [{ url: `${BASE_URL}/og/${params.slug}`, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${BASE_URL}/og/${params.slug}`] },
  }
}

export default function QuizPage({ params }: PageProps) {
  const { lang, slug } = params
  const config = QUIZ_REGISTRY[slug]
  if (!config) notFound()

  const tr = loadQuizTranslation(slug, lang)
  const t  = getT(lang)
  const s  = uiT(lang)

  const introParagraphs = tr.seoContent.intro?.split('\n\n') ?? []

  // Schema.org — Quiz + FAQPage
  const schemaQuiz = {
    '@context':  'https://schema.org',
    '@type':     'Quiz',
    name:        tr.meta.title,
    description: tr.meta.description,
    url:         `${BASE_URL}/${lang}/quiz/${slug}`,
    inLanguage:  lang,
    author:      { '@type': 'Organization', name: 'SolviqLab', url: BASE_URL },
    isAccessibleForFree: true,
    ...(config.clinicalScale && {
      about: { '@type': 'MedicalCondition', name: config.clinicalScale },
    }),
    ...(config.sources && {
      citation: config.sources.map(s => ({
        '@type': 'CreativeWork',
        name:    s.label,
        ...(s.url && { url: s.url }),
      })),
    }),
  }

  const schemaFAQ = tr.seoContent.faq && tr.seoContent.faq.length > 0
    ? {
        '@context':  'https://schema.org',
        '@type':     'FAQPage',
        mainEntity:  tr.seoContent.faq.map(item => ({
          '@type':        'Question',
          name:           item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }
    : null

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaQuiz) }}
      />
      {schemaFAQ && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-6">
          <a href={`/${lang}`} className="hover:text-violet-600 transition-colors">{s.breadcrumbHome}</a>
          <span>›</span>
          <a href={`/${lang}/quiz`} className="hover:text-violet-600 transition-colors">{s.navQuizzes}</a>
          <span>›</span>
          <span className="text-slate-600 dark:text-slate-300">{tr.meta.title}</span>
        </nav>

        {/* Page title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{config.icon}</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{tr.meta.title}</h1>
          </div>
          {config.clinicalScale && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-3 py-1 text-xs text-violet-700 dark:text-violet-300 font-medium">
              ✓ {t('quiz.clinically_validated')} · {config.clinicalScale}
            </div>
          )}
        </div>

        {/* SEO intro — shown above quiz */}
        {introParagraphs.length > 0 && (
          <div className="prose prose-sm dark:prose-invert max-w-none mb-8 text-slate-600 dark:text-slate-400">
            <p className="leading-relaxed">{introParagraphs[0]}</p>
          </div>
        )}

        {/* Quiz card */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-8">
          <QuizClient config={config} translation={tr} lang={lang} />
        </div>

        {/* Trust / medical note */}
        {tr.meta.medicalNote && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-8 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3">
            ⚕ {tr.meta.medicalNote}
          </p>
        )}

        {/* Rest of intro paragraphs */}
        {introParagraphs.length > 1 && (
          <div className="prose prose-sm dark:prose-invert max-w-none mb-8 text-slate-600 dark:text-slate-400 space-y-4">
            {introParagraphs.slice(1).map((p, i) => (
              <p key={i} className="leading-relaxed">{p}</p>
            ))}
          </div>
        )}

        {/* Content sections (Gold Standard) */}
        {tr.content.whatIs && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              {lang === 'en' ? 'What is this?' : tr.meta.title.split('(')[0]?.trim()}
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              {tr.content.whatIs.split('\n\n').map((p, i) => (
                <p key={i} className="leading-relaxed mb-3">{p}</p>
              ))}
            </div>
          </div>
        )}

        {tr.content.interpretation && (
          <div className="mb-8">
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              {tr.content.interpretation.split('\n\n').map((p, i) => (
                <p key={i} className="leading-relaxed mb-3">{p}</p>
              ))}
            </div>
          </div>
        )}

        {tr.content.whenToSeek && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
              {tr.content.whenToSeek.split('\n\n').map((p, i) => (
                <p key={i} className="leading-relaxed mb-2 last:mb-0">{p}</p>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {config.sources && config.sources.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              {t('ui.scientific_sources')}
            </h2>
            <ul className="space-y-1">
              {config.sources.map((s, i) => (
                <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="mt-0.5 text-violet-400">•</span>
                  {s.url
                    ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-violet-600">{s.label}</a>
                    : s.label
                  }
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FAQ */}
        {tr.seoContent.faq && tr.seoContent.faq.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
              {s.faqTitle}
            </h2>
            <div className="space-y-5">
              {tr.seoContent.faq.map((item, i) => (
                <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-5 last:border-0 last:pb-0">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">{item.q}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer trust */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          {t('ui.free_no_account')}
        </p>
      </div>
    </div>
  )
}
