import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORTED_LANGS } from '../../../lib/instruments'
import { getAboutContent } from '../../../lib/about-strings'

const BASE = 'https://solviqlab.com'

interface PageProps { params: { lang: string } }

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  return {
    title: 'About SolviqLab — Free Professional Calculators | SolviqLab',
    description: 'SolviqLab provides free calculators, science-backed quizzes, and AI coaching for health & finance. Built on WHO, CFPB, and NIST standards. No sign-up required.',
    alternates: {
      canonical: `${BASE}/${lang}/about`,
      languages: Object.fromEntries(SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/about`])),
    },
  }
}

export default function AboutPage({ params }: PageProps) {
  const { lang } = params
  const c = getAboutContent(lang)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">

      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full">
          {c.badge}
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight whitespace-pre-line">
          {c.heroTitle}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          {c.heroDesc}
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {c.stats.map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stat.value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{c.missionTitle}</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.mission1}</p>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.mission2}</p>
      </section>

      {/* Standards */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{c.standardsTitle}</h2>
        <div className="space-y-4">
          {c.standards.map(s => (
            <div key={s.badge} className="flex gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <div className={`shrink-0 w-14 h-14 rounded-lg flex items-center justify-center font-extrabold text-sm ${s.badgeColor}`}>
                {s.badge}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{s.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{s.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{c.coversTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.categories.map(cat => (
            <div key={cat.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className="font-semibold text-slate-900 dark:text-white mb-1">{cat.name}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{cat.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{c.principlesTitle}</h2>
        <ul className="space-y-3">
          {c.principles.map(item => (
            <li key={item.icon} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <span className="text-xl shrink-0">{item.icon}</span>
              <span className="text-slate-600 dark:text-slate-300">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-10">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{c.ctaTitle}</h2>
        <p className="text-slate-600 dark:text-slate-300">{c.ctaDesc}</p>
        <Link href={`/${lang}`} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
          {c.ctaBtn}
        </Link>
      </section>

    </div>
  )
}
