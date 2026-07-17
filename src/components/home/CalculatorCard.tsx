import Link from 'next/link'
import { t } from '../../lib/ui-strings'
import type { InstrumentMeta } from '../../lib/instruments'

function getProductSegment(category: string): 'calculators' | 'converters' {
  return category === 'conversion' ? 'converters' : 'calculators'
}

function getInstrumentPath(lang: string, slug: string, category: string): string {
  return `/${lang}/${getProductSegment(category)}/${slug}`
}

const CATEGORY_ICONS: Record<string, string> = {
  health: '❤️', finance: '💰', math: '🧮', conversion: '🔄', utility: '⚙️',
}

const CATEGORY_COLORS: Record<string, string> = {
  health:     'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  finance:    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  math:       'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  conversion: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  utility:    'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function CalculatorCard({ instrument, lang }: { instrument: InstrumentMeta; lang: string }) {
  const s = t(lang)
  const icon = CATEGORY_ICONS[instrument.category] ?? '🔢'
  const colorClass = CATEGORY_COLORS[instrument.category] ?? CATEGORY_COLORS['utility']!
  const catLabel = s.categoryLabels[instrument.category] ?? instrument.category

  return (
    <Link href={getInstrumentPath(lang, instrument.slug, instrument.category)} className="group block">
      <div className="h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{icon}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
            {catLabel}
          </span>
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
          {instrument.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
          {instrument.seoDescription}
        </p>
        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          {s.openCalc}
        </div>
      </div>
    </Link>
  )
}
