import Link from 'next/link'
import { getNavCategories } from '../../lib/navigation'
import { getAllInstrumentsLocalized } from '../../lib/instruments'
import { t } from '../../lib/ui-strings'

export function Footer({ lang }: { lang: string }) {
  const year = new Date().getFullYear()
  const categories = getNavCategories(lang)
  const s = t(lang)
  const allInstruments = getAllInstrumentsLocalized(lang)

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* Brand */}
          <div className="col-span-2">
            <Link href={`/${lang}`} className="inline-block mb-4">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-blue-400">Solviq</span><span className="text-white">Lab</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              {s.footerTagline}
            </p>
          </div>

          {/* Category columns */}
          {categories.map(cat => (
            <div key={cat.id}>
              <Link
                href={`/${lang}/category/${cat.id}`}
                className="flex items-center gap-1.5 font-semibold text-white mb-3 hover:text-blue-400 transition-colors text-sm"
              >
                <span>{cat.icon}</span> {cat.label}
              </Link>
              <ul className="space-y-2">
                {cat.subcategories.flatMap(sub => sub.instruments).slice(0, 5).map(slug => {
                  const inst = allInstruments.find(i => i.slug === slug)
                  return (
                    <li key={slug}>
                      <Link
                        href={`/${lang}/${slug}`}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        {inst?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Link>
                    </li>
                  )
                })}
                <li>
                  <Link
                    href={`/${lang}/category/${cat.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {s.viewAll}
                  </Link>
                </li>
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {s.footerCopyright(year)}
          </p>
          <p className="text-xs text-slate-500">
            {s.footerSources}
          </p>
        </div>
      </div>
    </footer>
  )
}
