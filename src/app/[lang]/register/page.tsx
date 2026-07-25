import type { Metadata } from 'next'
import { SUPPORTED_LANGS } from '../../../lib/instruments'
import { RegistrationClient } from '../../../components/user/RegistrationClient'
import { getJourneyStrings } from '../../../lib/journey/strings'

const BASE = 'https://solviqlab.com'

interface PageProps {
  params: { lang: string }
  searchParams?: { from?: string }
}

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  return {
    title: 'Save Your Personal Health Profile | SolviqLab',
    description:
      'Create a free SolviqLab account to save your Personal Health Profile, track your journey progress, and unlock personalized recommendations.',
    alternates: {
      canonical: `${BASE}/${lang}/register`,
      languages: Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/register`])),
    },
    robots: { index: false, follow: false },
  }
}

export default function RegisterPage({ params, searchParams }: PageProps) {
  const { lang } = params
  const redirectTo = searchParams?.from
  const s = getJourneyStrings(lang)

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-3xl mb-2">
            🧬
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {s.saveHealthProfile}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            {s.regDescription}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <RegistrationClient lang={lang} redirectTo={redirectTo} />
        </div>

        {/* Value props */}
        <ul className="space-y-2">
          {[s.regBenefit1, s.regBenefit2, s.regBenefit3, s.regBenefit4].map(item => (
            <li key={item} className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <span>{item}</span>
            </li>
          ))}
        </ul>

      </div>
    </div>
  )
}
