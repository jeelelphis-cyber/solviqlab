import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORTED_LANGS } from '../../../lib/instruments'
import { t } from '../../../lib/ui-strings'
import { getPrivacyContent } from '../../../lib/legal-strings'

const BASE = 'https://solviqlab.com'

interface PageProps { params: { lang: string } }

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  return {
    title: 'Privacy Policy | SolviqLab',
    description: 'Learn how SolviqLab handles your data. We keep calculations in your browser — no registration, no tracking, no ads.',
    alternates: {
      canonical: `${BASE}/${lang}/privacy`,
      languages: Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/privacy`])),
    },
  }
}

export default function PrivacyPage({ params }: PageProps) {
  const { lang } = params
  const s = t(lang)
  const content = getPrivacyContent(lang)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href={`/${lang}`} className="hover:text-blue-600 transition-colors">SolviqLab</Link>
          <span>›</span>
          <span className="text-slate-900 dark:text-white">{s.privacyBreadcrumb}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{s.privacyTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{content.lastUpdated}</p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              {content.tldr}
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {content.sections.map(section => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{section.title}</h2>
              <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href={`/${lang}/terms`} className="text-blue-600 dark:text-blue-400 hover:underline">{s.footerTerms}</Link>
          <Link href={`/${lang}/contact`} className="text-blue-600 dark:text-blue-400 hover:underline">{s.footerContact}</Link>
          <Link href={`/${lang}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← SolviqLab</Link>
        </div>
      </div>
    </div>
  )
}
