import Link from 'next/link'

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸', native: 'EN' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', native: 'UA' },
  { code: 'es', label: 'Español',    flag: '🇪🇸', native: 'ES' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷', native: 'PT' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷', native: 'FR' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪', native: 'DE' },
  { code: 'pl', label: 'Polski',     flag: '🇵🇱', native: 'PL' },
]

export default function RootPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <span className="text-5xl font-bold">
          <span className="text-blue-600">C</span>
          <span className="text-slate-900 dark:text-white">ALCO</span>
        </span>
        <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">Free professional calculators</p>
      </div>

      <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg font-medium">Choose your language</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
        {LANGUAGES.map(l => (
          <Link
            key={l.code}
            href={`/${l.code}`}
            className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all group"
          >
            <span className="text-3xl">{l.flag}</span>
            <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 text-sm">{l.label}</span>
            <span className="text-xs text-slate-400">{l.native}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
