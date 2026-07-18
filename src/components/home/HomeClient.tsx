'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { CalculatorCard } from './CalculatorCard'
import { t } from '../../lib/ui-strings'
import type { InstrumentMeta } from '../../lib/instruments'

const CATEGORY_CONFIG = [
  { id: 'all',        icon: '✦',  label_key: 'tabAll' },
  { id: 'health',     icon: '❤️', label_key: 'tabHealth' },
  { id: 'finance',    icon: '💰', label_key: 'tabFinance' },
  { id: 'math',       icon: '🧮', label_key: 'tabMath' },
  { id: 'conversion', icon: '🔄', label_key: 'tabConversion' },
] as const

const POPULAR_FIRST = [
  'bmi-calculator',
  'mortgage-calculator',
  'percentage-calculator',
  'loan-calculator',
  'salary-calculator',
  'tdee-calculator',
  'tax-calculator',
  'compound-interest-calculator',
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

export function HomeClient({
  instruments,
  lang,
}: {
  instruments: InstrumentMeta[]
  lang: string
}) {
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
          <p className="text-slate-300 text-base mb-8">
            {s.heroSources} <span className="text-slate-200">WHO · CFPB · NIST · ISO</span>
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">🔍</span>
            <input
              type="search"
              placeholder={s.searchPlaceholder}
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 text-base transition-all"
            />
          </div>

          {/* Category tabs */}
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
                  <span>{cat.icon}</span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────── */}
      <div ref={gridRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="sr-only">{s.featuredTitle}</h2>

        {/* Result count + active filter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length === 1
              ? s.countSingle(filtered.length)
              : s.countPlural(filtered.length)}
          </p>
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ✕ {search}
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

        {/* Trust bar — compact, after grid */}
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
