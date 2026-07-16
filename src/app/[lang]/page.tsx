import Link from 'next/link'
import { getAllInstrumentsLocalized } from '../../lib/instruments'
import { Hero } from '../../components/home/Hero'
import { SearchableGrid } from '../../components/home/SearchableGrid'
import { t } from '../../lib/ui-strings'
import type { InstrumentMeta } from '../../lib/instruments'

const FEATURED_SLUGS = ['bmi-calculator', 'mortgage-calculator', 'tdee-calculator', 'compound-interest-calculator']

const CATEGORY_ICON: Record<string, string> = {
  health: '❤️', finance: '💰', math: '🧮', conversion: '🔄',
}

function FeaturedCard({ instrument, lang }: { instrument: InstrumentMeta; lang: string }) {
  const icon = CATEGORY_ICON[instrument.category] ?? '🔢'
  const s = t(lang)
  return (
    <Link
      href={`/${lang}/${instrument.slug}`}
      className="group block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {s.categoryLabels[instrument.category] ?? instrument.category}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {instrument.name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
        {instrument.seoDescription}
      </p>
      <span className="inline-block mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
        {s.openCalc}
      </span>
    </Link>
  )
}

export default function HomePage({ params }: { params: { lang: string } }) {
  const instruments = getAllInstrumentsLocalized(params.lang)
  const s = t(params.lang)
  const featured = FEATURED_SLUGS
    .map(slug => instruments.find(i => i.slug === slug))
    .filter(Boolean) as InstrumentMeta[]

  return (
    <>
      <Hero lang={params.lang} totalCount={instruments.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Featured Section */}
        {featured.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {s.featuredTitle}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {s.featuredSubtitle}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map(inst => (
                <FeaturedCard key={inst.slug} instrument={inst} lang={params.lang} />
              ))}
            </div>
          </section>
        )}

        {/* Trust Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 mb-14 flex flex-wrap items-center gap-3 justify-center text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">{s.sourcesLabel}</span>
          {['WHO', 'Mayo Clinic', 'CFPB', 'NIST', 'ISO'].map(src => (
            <span key={src} className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-medium text-slate-600 dark:text-slate-300">
              {src}
            </span>
          ))}
        </div>

        {/* All Calculators Grid */}
        <SearchableGrid instruments={instruments} lang={params.lang} />
      </div>
    </>
  )
}
