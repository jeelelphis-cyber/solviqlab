import Link from 'next/link'
import { getNavCategories } from '../../lib/navigation'
import { getAllInstrumentsLocalized } from '../../lib/instruments'
import { t } from '../../lib/ui-strings'
import { CookieSettingsButton } from '../consent/CookieSettingsButton'

export function Footer({ lang }: { lang: string }) {
  const year = new Date().getFullYear()
  const categories = getNavCategories(lang)
  const s = t(lang)
  const allInstruments = getAllInstrumentsLocalized(lang)

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8">

          {/* Brand */}
          <div className="col-span-2">
            <Link href={`/${lang}`} className="inline-block mb-4">
              <span className="text-2xl font-bold tracking-tight" translate="no">
                <span className="text-blue-400">Solviq</span><span className="text-white">Lab</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              {s.footerTagline}
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/solviqlab"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SolviqLab on X (Twitter)"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-sm font-bold"
              >
                𝕏
              </a>
              <a
                href="https://www.linkedin.com/company/solviqlab"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SolviqLab on LinkedIn"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://www.producthunt.com/products/solviqlab"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SolviqLab on Product Hunt"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-[#DA552F] text-slate-400 hover:text-white transition-colors text-base"
              >
                🔺
              </a>
            </div>
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
                  const product = cat.id === 'conversion' ? 'converters' : 'calculators'
                  return (
                    <li key={slug}>
                      <Link
                        href={`/${lang}/${product}/${slug}`}
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

          {/* Company column */}
          <div>
            <p className="font-semibold text-white mb-3 text-sm">Company</p>
            <ul className="space-y-2">
              <li><Link href={`/${lang}/about`} className="text-xs text-slate-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href={`/${lang}/quiz`} className="text-xs text-slate-400 hover:text-white transition-colors">🧠 Quizzes</Link></li>
              <li><Link href={`/${lang}/coach/mia`} className="text-xs text-slate-400 hover:text-white transition-colors">Coach Mia</Link></li>
              <li><Link href={`/${lang}/coach/alex`} className="text-xs text-slate-400 hover:text-white transition-colors">Coach Alex</Link></li>
              <li><Link href={`/${lang}/contact`} className="text-xs text-slate-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href={`/${lang}/privacy`} className="text-xs text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href={`/${lang}/terms`} className="text-xs text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {s.footerCopyright(year)}
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href={`/${lang}/privacy`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href={`/${lang}/terms`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms</Link>
            <Link href={`/${lang}/contact`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Contact</Link>
            <p className="text-xs text-slate-500 hidden sm:block">{s.footerSources}</p>
            <CookieSettingsButton lang={lang} />
          </div>
        </div>
      </div>
    </footer>
  )
}
