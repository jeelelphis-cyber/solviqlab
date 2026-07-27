'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  Search, LayoutGrid, Heart, TrendingUp, Calculator, ArrowLeftRight,
  BarChart2, Lightbulb, MessageSquare,
  Moon, Activity, Flame, Zap,
  type LucideIcon,
} from 'lucide-react'
import { CalculatorCard } from './CalculatorCard'
import { t } from '../../lib/ui-strings'
import type { InstrumentMeta } from '../../lib/instruments'
import { QUIZ_REGISTRY } from '@/lib/quiz/registry'

const CATEGORY_CONFIG: { id: string; Icon: LucideIcon; label_key: string }[] = [
  { id: 'all',        Icon: LayoutGrid,     label_key: 'tabAll' },
  { id: 'health',     Icon: Heart,          label_key: 'tabHealth' },
  { id: 'finance',    Icon: TrendingUp,     label_key: 'tabFinance' },
  { id: 'math',       Icon: Calculator,     label_key: 'tabMath' },
  { id: 'conversion', Icon: ArrowLeftRight, label_key: 'tabConversion' },
]

const QUIZ_ICONS: Record<string, LucideIcon> = {
  'sleep-quiz':   Moon,
  'stress-quiz':  Activity,
  'burnout-quiz': Flame,
  'energy-quiz':  Zap,
}

const QUIZ_ICON_COLORS: Record<string, string> = {
  'sleep-quiz':   'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400',
  'stress-quiz':  'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400',
  'burnout-quiz': 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
  'energy-quiz':  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400',
}

const FEATURED_QUIZ_SLUGS = ['sleep-quiz', 'stress-quiz', 'burnout-quiz', 'energy-quiz']

const POPULAR_FIRST = [
  'bmi-calculator', 'mortgage-calculator', 'percentage-calculator', 'loan-calculator',
  'salary-calculator', 'tdee-calculator', 'tax-calculator', 'compound-interest-calculator',
]

function sortByPopularity(instruments: InstrumentMeta[]) {
  return [...instruments].sort((a, b) => {
    const ai = POPULAR_FIRST.indexOf(a.slug)
    const bi = POPULAR_FIRST.indexOf(b.slug)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export function HomeClient({ instruments, lang }: { instruments: InstrumentMeta[]; lang: string }) {
  const s = t(lang)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const gridRef = useRef<HTMLDivElement>(null)

  const sorted = sortByPopularity(instruments)
  const filtered = sorted.filter(inst => {
    const matchesCategory = category === 'all' || inst.category === category
    const matchesSearch =
      !search ||
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.seoDescription.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  function handleCategoryClick(id: string) {
    setCategory(id)
    setSearch('')
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSearch(val: string) {
    setSearch(val)
    setCategory('all')
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight">
            {s.heroTitle1}
            <span className="text-blue-400">{s.heroTitle2}</span>
          </h1>
          <p className="text-slate-300 text-sm mb-5 max-w-xl mx-auto">
            {s.heroSubtitle(instruments.length)}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button
              onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600/25 border border-blue-400/30 text-blue-200 text-xs font-medium hover:bg-blue-600/40 hover:border-blue-400/60 transition-all cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              {instruments.length}+ {s.heroPillCalc}
            </button>
            <Link
              href={`/${lang}/quiz`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600/25 border border-violet-400/30 text-violet-200 text-xs font-medium hover:bg-violet-600/40 hover:border-violet-400/60 transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {s.heroPillQuiz}
            </Link>
          </div>

          {/* AI Coach Cards — premium feature */}
          <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto mb-8">
            {/* Mia — Health Coach */}
            <Link
              href={`/${lang}/coach/mia`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-rose-400/40 transition-all duration-300"
            >
              {/* Square photo area */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-rose-500/30 to-purple-700/30 overflow-hidden">
                {/* Online badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-[10px] font-semibold tracking-wide uppercase">{s.coachOnlineNow}</span>
                </div>
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80">{s.coachFreeSession}</span>
                </div>
                {/* Photo */}
                <img
                  src="https://files2.heygen.ai/avatar/v3/1f58c0f60faa4cb5bf6c465615e3fb18_39260/preview_target.webp"
                  alt="Mia"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>

              {/* Info + CTA */}
              <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1">
                <p className="text-white font-bold text-sm">Mia</p>
                <p className="text-rose-300 text-[11px] font-medium">{s.coachMiaRole}</p>
                <p className="text-white/40 text-[10px] leading-tight">{s.coachMiaSpec}</p>
                <div className="mt-auto pt-2">
                  <div className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-bold text-center group-hover:opacity-90 transition-opacity">
                    {s.coachTalkTo('Mia')}
                  </div>
                </div>
              </div>
            </Link>

            {/* Alex — Finance Coach */}
            <Link
              href={`/${lang}/coach/alex`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-400/40 transition-all duration-300"
            >
              {/* Square photo area */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-blue-500/30 to-cyan-700/30 overflow-hidden">
                {/* Online badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 text-[10px] font-semibold tracking-wide uppercase">{s.coachOnlineNow}</span>
                </div>
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80">{s.coachFreeSession}</span>
                </div>
                {/* Photo */}
                <img
                  src="https://files2.heygen.ai/avatar/v3/25ef6c86b1e946969d9a684870c47dfe_14947/preview_talk_1.webp"
                  alt="Alex"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>

              {/* Info + CTA */}
              <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1">
                <p className="text-white font-bold text-sm">Alex</p>
                <p className="text-blue-300 text-[11px] font-medium">{s.coachAlexRole}</p>
                <p className="text-white/40 text-[10px] leading-tight">{s.coachAlexSpec}</p>
                <div className="mt-auto pt-2">
                  <div className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold text-center group-hover:opacity-90 transition-opacity">
                    {s.coachTalkTo('Alex')}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Search bar — Lucide Search icon */}
          <div className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder={s.searchPlaceholder}
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 text-base transition-all"
            />
          </div>

          {/* Category tabs — Lucide icons, clean labels */}
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORY_CONFIG.map(cat => {
              const label = s[cat.label_key as keyof typeof s] as string
              const active = category === cat.id && !search
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  <cat.Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Quiz Strip ────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{s.quizSectionTitle}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.quizSectionSubtitle}</p>
            </div>
            <Link
              href={`/${lang}/quiz`}
              className="hidden sm:block text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline shrink-0"
            >
              {s.quizCta}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURED_QUIZ_SLUGS.map(slug => {
              const quiz = QUIZ_REGISTRY[slug]
              if (!quiz) return null
              const QuizIcon = QUIZ_ICONS[slug] ?? Lightbulb
              const iconColor = QUIZ_ICON_COLORS[slug] ?? 'bg-violet-50 dark:bg-violet-900/20 text-violet-500'
              return (
                <Link
                  key={slug}
                  href={`/${lang}/quiz/${slug}`}
                  className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
                    <QuizIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 leading-snug transition-colors">
                    {s.quizNames[slug] ?? quiz.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {s.quizQuestionsLabel(quiz.questions.length)} · {s.quizFreeLabel}
                  </p>
                </Link>
              )
            })}
          </div>
          <div className="sm:hidden mt-4 text-center">
            <Link href={`/${lang}/quiz`} className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {s.quizCta}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────── */}
      <div ref={gridRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="sr-only">{s.featuredTitle}</h2>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length === 1 ? s.countSingle(filtered.length) : s.countPlural(filtered.length)}
          </p>
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>×</span> {search}
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(inst => (
              <CalculatorCard key={inst.slug} instrument={inst} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            {s.noResults(search)}
          </div>
        )}

        {/* Trust bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 justify-center text-sm text-slate-400 dark:text-slate-500">
          <span>{s.sourcesLabel}</span>
          {['WHO', 'Mayo Clinic', 'CFPB', 'NIST', 'ISO'].map(src => (
            <span key={src} className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium text-slate-500 dark:text-slate-400">
              {src}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
