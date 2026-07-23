import type { Metadata } from 'next'
import Link from 'next/link'
import { SUPPORTED_LANGS } from '../../../lib/instruments'

const BASE = 'https://solviqlab.com'

interface PageProps {
  params: { lang: string }
}

export function generateStaticParams() {
  return SUPPORTED_LANGS.map(lang => ({ lang }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang } = params
  return {
    title: 'About SolviqLab — Free Professional Calculators | SolviqLab',
    description:
      'SolviqLab provides free, accurate online calculators for health, finance, math, and unit conversions. Built on WHO, CFPB, and NIST standards. No sign-up required.',
    alternates: {
      canonical: `${BASE}/${lang}/about`,
      languages: Object.fromEntries(
        SUPPORTED_LANGS.map(l => [l, `${BASE}/${l}/about`])
      ),
    },
    openGraph: {
      title: 'About SolviqLab — Free Professional Calculators',
      description:
        'SolviqLab provides free, accurate online calculators built on WHO, CFPB, and NIST standards.',
      url: `${BASE}/${lang}/about`,
      type: 'website',
    },
  }
}

const STATS = [
  { value: '36+', label: 'Free Calculators' },
  { value: '10', label: 'Languages' },
  { value: '252+', label: 'Tool Pages' },
  { value: '100%', label: 'Free, No Sign-up' },
]

const STANDARDS = [
  {
    badge: 'WHO',
    title: 'World Health Organization',
    description:
      'Health calculators (BMI, BMR, body fat, ideal weight) follow WHO clinical guidelines and reference ranges.',
    badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
  },
  {
    badge: 'CFPB',
    title: 'Consumer Financial Protection Bureau',
    description:
      'Financial calculators (mortgage, loan, compound interest) comply with CFPB disclosure standards.',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
  },
  {
    badge: 'NIST',
    title: 'National Institute of Standards & Technology',
    description:
      'Unit converters use NIST and ISO measurement standards for maximum accuracy.',
    badgeColor: 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300',
  },
]

const CATEGORIES = [
  { icon: '❤️', name: 'Health', description: 'BMI, BMR, TDEE, body fat, ideal weight, calorie deficit, sleep, ovulation, pregnancy' },
  { icon: '💰', name: 'Finance', description: 'Mortgage, loan, compound interest, retirement, savings, tax, salary, VAT, discount, tip' },
  { icon: '🧮', name: 'Math', description: 'Percentage, fraction, ratio, average, scientific notation' },
  { icon: '🔄', name: 'Conversion', description: 'Length, weight, temperature, area, volume, currency' },
]

export default function AboutPage({ params }: PageProps) {
  const { lang } = params

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">

      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full">
          <span>🧮</span> About SolviqLab
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Solving Real Problems,<br />Completely Free
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          SolviqLab is a platform of free, professional-grade calculators built on
          WHO, CFPB, and NIST standards. No ads cluttering your results. No sign-up required.
          Just accurate answers.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(stat => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center"
          >
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stat.value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Every person deserves access to the same tools that professionals use — without
          paywalls, subscriptions, or confusing interfaces. We build calculators that give
          clear, accurate answers and explain the math behind them.
        </p>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Whether you&apos;re planning your retirement, tracking your health, converting units
          for a recipe, or splitting a restaurant bill — SolviqLab has the right tool,
          available instantly, in your language.
        </p>
      </section>

      {/* Standards */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Built on Trusted Standards</h2>
        <div className="space-y-4">
          {STANDARDS.map(s => (
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What We Cover</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {CATEGORIES.map(cat => (
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Principles</h2>
        <ul className="space-y-3">
          {[
            { icon: '🆓', text: 'Always free — no subscriptions, no paywalls, no hidden fees' },
            { icon: '🔒', text: 'No data collection — all calculations happen in your browser' },
            { icon: '🌍', text: 'Available in 10 languages — English, Ukrainian, Spanish, Portuguese, French, German, Polish, Turkish, Italian, Dutch' },
            { icon: '📐', text: 'Formula transparency — every result shows the math behind it' },
            { icon: '⚡', text: 'Instant results — no loading spinners, no waiting' },
          ].map(item => (
            <li key={item.icon} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <span className="text-xl shrink-0">{item.icon}</span>
              <span className="text-slate-600 dark:text-slate-300">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-10">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to calculate?</h2>
        <p className="text-slate-600 dark:text-slate-300">Browse 36+ free tools across health, finance, math, and conversions.</p>
        <Link
          href={`/${lang}`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Browse All Calculators
        </Link>
      </section>

    </div>
  )
}
