import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORTED_LANGS } from '../../../lib/instruments'
import { t } from '../../../lib/ui-strings'
import { getContactTopics } from '../../../lib/legal-strings'

const BASE = 'https://solviqlab.com'

interface PageProps { params: { lang: string } }

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  return {
    title: 'Contact Us | SolviqLab',
    description: 'Get in touch with the SolviqLab team. We respond to all inquiries within 24–48 hours.',
    alternates: {
      canonical: `${BASE}/${lang}/contact`,
      languages: Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/contact`])),
    },
  }
}

export default function ContactPage({ params }: PageProps) {
  const { lang } = params
  const s = t(lang)
  const topics = getContactTopics(lang)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href={`/${lang}`} className="hover:text-blue-600 transition-colors">SolviqLab</Link>
          <span>›</span>
          <span className="text-slate-900 dark:text-white">{s.contactBreadcrumb}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{s.contactTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400">{s.contactSubtitle}</p>
        </div>

        {/* Contact topics */}
        <div className="space-y-3 mb-12">
          {topics.map(topic => (
            <a
              key={topic.label}
              href={`mailto:${topic.email}?subject=${encodeURIComponent(topic.label + ' — SolviqLab')}`}
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all group bg-white dark:bg-slate-800"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{topic.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {topic.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{topic.desc}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{topic.email}</p>
              </div>
              <span className="text-slate-400 group-hover:text-blue-500 transition-colors mt-0.5 ml-auto flex-shrink-0">→</span>
            </a>
          ))}
        </div>

        {/* Response time */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">{s.contactResponseNote}</p>
        </div>

        {/* Footer nav */}
        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href={`/${lang}/about`} className="text-blue-600 dark:text-blue-400 hover:underline">{s.footerAbout}</Link>
          <Link href={`/${lang}/privacy`} className="text-blue-600 dark:text-blue-400 hover:underline">{s.footerPrivacy}</Link>
          <Link href={`/${lang}/terms`} className="text-blue-600 dark:text-blue-400 hover:underline">{s.footerTerms}</Link>
        </div>
      </div>
    </div>
  )
}
