import { notFound } from 'next/navigation'
import { getInstrument, getTranslations, getAllSlugs } from '../../../lib/instruments'
import { fetchLiveRates } from '../../../instruments/currency-converter/lib/fetchRates'
import { BMICalculatorClient } from '../../../components/instruments/BMICalculatorClient'
import { PercentageCalculatorClient } from '../../../components/instruments/PercentageCalculatorClient'
import { BmrCalculatorClient } from '../../../components/instruments/BmrCalculatorClient'
import { IdealWeightCalculatorClient } from '../../../components/instruments/IdealWeightCalculatorClient'
import { TdeeCalculatorClient } from '../../../components/instruments/TdeeCalculatorClient'
import { BodyFatCalculatorClient } from '../../../components/instruments/BodyFatCalculatorClient'
import { LoanCalculatorClient } from '../../../components/instruments/LoanCalculatorClient'
import { MortgageCalculatorClient } from '../../../components/instruments/MortgageCalculatorClient'
import { VatCalculatorClient } from '../../../components/instruments/VatCalculatorClient'
import { CompoundInterestCalculatorClient } from '../../../components/instruments/CompoundInterestCalculatorClient'
import { DiscountCalculatorClient } from '../../../components/instruments/DiscountCalculatorClient'
import { FractionCalculatorClient } from '../../../components/instruments/FractionCalculatorClient'
import { RatioCalculatorClient } from '../../../components/instruments/RatioCalculatorClient'
import { AverageCalculatorClient } from '../../../components/instruments/AverageCalculatorClient'
import { ScientificNotationCalculatorClient } from '../../../components/instruments/ScientificNotationCalculatorClient'
import { LengthConverterClient } from '../../../components/instruments/LengthConverterClient'
import { WeightConverterClient } from '../../../components/instruments/WeightConverterClient'
import { TemperatureConverterClient } from '../../../components/instruments/TemperatureConverterClient'
import { AreaCalculatorClient } from '../../../components/instruments/AreaCalculatorClient'
import { VolumeCalculatorClient } from '../../../components/instruments/VolumeCalculatorClient'
import { AreaConverterClient } from '../../../components/instruments/AreaConverterClient'
import { VolumeConverterClient } from '../../../components/instruments/VolumeConverterClient'
import { CalorieDeficitCalculatorClient } from '../../../components/instruments/CalorieDeficitCalculatorClient'
import { SalaryCalculatorClient } from '../../../components/instruments/SalaryCalculatorClient'
import { InflationCalculatorClient } from '../../../components/instruments/InflationCalculatorClient'
import { TaxCalculatorClient } from '../../../components/instruments/TaxCalculatorClient'
import { RetirementCalculatorClient } from '../../../components/instruments/RetirementCalculatorClient'
import { OvulationCalculatorClient } from '../../../components/instruments/OvulationCalculatorClient'
import { SleepCalculatorClient } from '../../../components/instruments/SleepCalculatorClient'
import { InvestmentCalculatorClient } from '../../../components/instruments/InvestmentCalculatorClient'
import { CurrencyConverterClient } from '../../../components/instruments/CurrencyConverterClient'
import { CalorieCalculatorClient } from '../../../components/instruments/CalorieCalculatorClient'
import { SavingsCalculatorClient } from '../../../components/instruments/SavingsCalculatorClient'
import { TipCalculatorClient } from '../../../components/instruments/TipCalculatorClient'
import { PregnancyCalculatorClient } from '../../../components/instruments/PregnancyCalculatorClient'
import { DueDateCalculatorClient } from '../../../components/instruments/DueDateCalculatorClient'

const SUPPORTED_LANGS = ['en', 'uk', 'es', 'pt', 'fr', 'de', 'pl', 'tr', 'it']

export function generateStaticParams() {
  return getAllSlugs().flatMap(slug =>
    SUPPORTED_LANGS.map(lang => ({ slug, lang }))
  )
}

function InstrumentUI({
  slug, lang, translations, liveRates,
}: {
  slug: string
  lang: string
  translations: Record<string, unknown>
  liveRates?: import('@/instruments/currency-converter/lib/fetchRates').LiveRatesResult | null
}) {
  switch (slug) {
    case 'bmi-calculator': return <BMICalculatorClient translations={translations} lang={lang} />
    case 'percentage-calculator': return <PercentageCalculatorClient translations={translations} lang={lang} />
    case 'bmr-calculator': return <BmrCalculatorClient translations={translations} lang={lang} />
    case 'ideal-weight-calculator': return <IdealWeightCalculatorClient translations={translations} lang={lang} />
    case 'tdee-calculator': return <TdeeCalculatorClient translations={translations} lang={lang} />
    case 'body-fat-calculator': return <BodyFatCalculatorClient translations={translations} lang={lang} />
    case 'calorie-deficit-calculator': return <CalorieDeficitCalculatorClient translations={translations} lang={lang} />
    case 'loan-calculator': return <LoanCalculatorClient translations={translations} lang={lang} />
    case 'mortgage-calculator': return <MortgageCalculatorClient translations={translations} lang={lang} />
    case 'vat-calculator': return <VatCalculatorClient translations={translations} lang={lang} />
    case 'compound-interest-calculator': return <CompoundInterestCalculatorClient translations={translations} lang={lang} />
    case 'discount-calculator': return <DiscountCalculatorClient translations={translations} lang={lang} />
    case 'fraction-calculator': return <FractionCalculatorClient translations={translations} lang={lang} />
    case 'ratio-calculator': return <RatioCalculatorClient translations={translations} lang={lang} />
    case 'average-calculator': return <AverageCalculatorClient translations={translations} lang={lang} />
    case 'scientific-notation-calculator': return <ScientificNotationCalculatorClient translations={translations} lang={lang} />
    case 'length-converter': return <LengthConverterClient translations={translations} lang={lang} />
    case 'weight-converter': return <WeightConverterClient translations={translations} lang={lang} />
    case 'temperature-converter': return <TemperatureConverterClient translations={translations} lang={lang} />
    case 'area-calculator': return <AreaCalculatorClient translations={translations} lang={lang} />
    case 'volume-calculator': return <VolumeCalculatorClient translations={translations} lang={lang} />
    case 'area-converter': return <AreaConverterClient translations={translations} lang={lang} />
    case 'volume-converter': return <VolumeConverterClient translations={translations} lang={lang} />
    case 'salary-calculator': return <SalaryCalculatorClient translations={translations} lang={lang} />
    case 'inflation-calculator': return <InflationCalculatorClient translations={translations} lang={lang} />
    case 'tax-calculator': return <TaxCalculatorClient translations={translations} lang={lang} />
    case 'retirement-calculator': return <RetirementCalculatorClient translations={translations} lang={lang} />
    case 'ovulation-calculator': return <OvulationCalculatorClient translations={translations} lang={lang} />
    case 'sleep-calculator': return <SleepCalculatorClient translations={translations} lang={lang} />
    case 'investment-calculator': return <InvestmentCalculatorClient translations={translations} lang={lang} />
    case 'currency-converter': return <CurrencyConverterClient translations={translations} lang={lang} rates={liveRates?.rates ?? {}} ratesUpdatedAt={liveRates?.updatedAt ?? new Date().toISOString()} ratesIsLive={liveRates?.isLive ?? false} />
    case 'calorie-calculator': return <CalorieCalculatorClient translations={translations} lang={lang} />
    case 'savings-calculator': return <SavingsCalculatorClient translations={translations} lang={lang} />
    case 'tip-calculator': return <TipCalculatorClient translations={translations} lang={lang} />
    case 'pregnancy-calculator': return <PregnancyCalculatorClient translations={translations} lang={lang} />
    case 'due-date-calculator': return <DueDateCalculatorClient translations={translations} lang={lang} />
    default:
      return (
        <div className="text-slate-500 text-sm py-8 text-center">
          Calculator coming soon.
        </div>
      )
  }
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
