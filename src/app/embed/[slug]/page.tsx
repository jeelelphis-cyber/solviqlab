import { notFound } from 'next/navigation'
import { getInstrument, getTranslations, getAllSlugs } from '../../../lib/instruments'
import { fetchLiveRates } from '../../../instruments/currency-converter/lib/fetchRates'
import { InstrumentUI } from '../../../components/instruments/InstrumentUI'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it', 'nl']

export function generateStaticParams() {
  return getAllSlugs().flatMap(slug =>
    SUPPORTED_LANGS.map(lang => ({ slug, lang }))
  )
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { lang?: string }
}) {
  const slug = params.slug
  const lang = SUPPORTED_LANGS.includes(searchParams.lang ?? '') ? (searchParams.lang ?? 'en') : 'en'

  const instrument = getInstrument(slug)
  if (!instrument) notFound()

  const translations = getTranslations(slug, lang)
  const liveRates = slug === 'currency-converter' ? await fetchLiveRates() : null

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col">
      <div className="flex-1">
        <InstrumentUI slug={slug} lang={lang} translations={translations} liveRates={liveRates} />
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <a
          href={`https://solviqlab.com/en/${instrument.category === 'conversion' ? 'converters' : 'calculators'}/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
        >
          Powered by <span className="font-semibold text-blue-600">SolviqLab</span> — Free Professional Calculators
        </a>
      </div>
    </div>
  )
}
