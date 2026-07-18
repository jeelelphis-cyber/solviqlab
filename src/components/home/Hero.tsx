import Link from 'next/link'
import { t } from '../../lib/ui-strings'

interface HeroProps {
  lang: string
  totalCount: number
}

export function Hero({ lang, totalCount }: HeroProps) {
  const s = t(lang)
  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
          {s.heroTitle1}
          <span className="text-blue-400">{s.heroTitle2}</span>
        </h1>
        <p className="text-xl text-slate-200 mb-4 max-w-2xl mx-auto">
          {s.heroSubtitle(totalCount)}
        </p>
        <p className="text-sm text-slate-300 mb-10">
          {s.heroSources} <span className="text-slate-200">WHO · CFPB · NIST · ISO</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${lang}/bmi-calculator`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg hover:shadow-blue-500/25"
          >
            {s.heroCta1}
          </Link>
          <Link
            href={`/${lang}/mortgage-calculator`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors text-lg border border-white/20"
          >
            {s.heroCta2}
          </Link>
        </div>
      </div>
    </div>
  )
}
