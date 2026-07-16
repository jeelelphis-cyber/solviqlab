'use client'
import { useState } from 'react'
import { CalculatorCard } from './CalculatorCard'
import { t } from '../../lib/ui-strings'
import type { InstrumentMeta } from '../../lib/instruments'

export function SearchableGrid({
  instruments,
  lang,
}: {
  instruments: InstrumentMeta[]
  lang: string
}) {
  const s = t(lang)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const TABS = [
    { id: 'all', label: s.tabAll },
    { id: 'health', label: s.tabHealth },
    { id: 'finance', label: s.tabFinance },
    { id: 'math', label: s.tabMath },
    { id: 'conversion', label: s.tabConversion },
  ]

  const filtered = instruments.filter(inst => {
    const matchesCategory = category === 'all' || inst.category === category
    const matchesSearch =
      !search ||
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.seoDescription.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div>
      <div className="mb-8">
        <input
          type="search"
          placeholder={s.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {filtered.length === 1 ? s.countSingle(filtered.length) : s.countPlural(filtered.length)}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(inst => (
          <CalculatorCard key={inst.slug} instrument={inst} lang={lang} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          {s.noResults(search)}
        </div>
      )}
    </div>
  )
}
