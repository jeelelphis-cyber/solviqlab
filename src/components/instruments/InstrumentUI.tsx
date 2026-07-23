'use client'
// ─────────────────────────────────────────────────────────────────────────────
// InstrumentUI — Shared instrument router with per-calculator code splitting
//
// Previously duplicated in 3 places:
//   app/[lang]/calculators/[slug]/page.tsx
//   app/[lang]/converters/[slug]/page.tsx
//   app/embed/[slug]/page.tsx
//
// Each calculator is now a separate JS chunk — only the requested calculator
// is loaded per page. Reduces JS bundle size by ~97% per page visit.
//
// Performance: dynamic() without ssr:false → loading skeleton in SSG HTML,
// actual component loads after hydration (correct for interactive forms).
// ─────────────────────────────────────────────────────────────────────────────

import dynamic from 'next/dynamic'
import type { LiveRatesResult } from '@/instruments/currency-converter/lib/fetchRates'

function Skeleton() {
  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 animate-pulse"
      style={{ minHeight: '16rem' }}
    />
  )
}

// ── Dynamic calculator components ─────────────────────────────────────────────
const BMICalculatorClient = dynamic(() => import('./BMICalculatorClient').then(m => m.BMICalculatorClient), { loading: Skeleton })
const PercentageCalculatorClient = dynamic(() => import('./PercentageCalculatorClient').then(m => m.PercentageCalculatorClient), { loading: Skeleton })
const BmrCalculatorClient = dynamic(() => import('./BmrCalculatorClient').then(m => m.BmrCalculatorClient), { loading: Skeleton })
const IdealWeightCalculatorClient = dynamic(() => import('./IdealWeightCalculatorClient').then(m => m.IdealWeightCalculatorClient), { loading: Skeleton })
const TdeeCalculatorClient = dynamic(() => import('./TdeeCalculatorClient').then(m => m.TdeeCalculatorClient), { loading: Skeleton })
const BodyFatCalculatorClient = dynamic(() => import('./BodyFatCalculatorClient').then(m => m.BodyFatCalculatorClient), { loading: Skeleton })
const CalorieDeficitCalculatorClient = dynamic(() => import('./CalorieDeficitCalculatorClient').then(m => m.CalorieDeficitCalculatorClient), { loading: Skeleton })
const LoanCalculatorClient = dynamic(() => import('./LoanCalculatorClient').then(m => m.LoanCalculatorClient), { loading: Skeleton })
const MortgageCalculatorClient = dynamic(() => import('./MortgageCalculatorClient').then(m => m.MortgageCalculatorClient), { loading: Skeleton })
const VatCalculatorClient = dynamic(() => import('./VatCalculatorClient').then(m => m.VatCalculatorClient), { loading: Skeleton })
const CompoundInterestCalculatorClient = dynamic(() => import('./CompoundInterestCalculatorClient').then(m => m.CompoundInterestCalculatorClient), { loading: Skeleton })
const DiscountCalculatorClient = dynamic(() => import('./DiscountCalculatorClient').then(m => m.DiscountCalculatorClient), { loading: Skeleton })
const FractionCalculatorClient = dynamic(() => import('./FractionCalculatorClient').then(m => m.FractionCalculatorClient), { loading: Skeleton })
const RatioCalculatorClient = dynamic(() => import('./RatioCalculatorClient').then(m => m.RatioCalculatorClient), { loading: Skeleton })
const AverageCalculatorClient = dynamic(() => import('./AverageCalculatorClient').then(m => m.AverageCalculatorClient), { loading: Skeleton })
const ScientificNotationCalculatorClient = dynamic(() => import('./ScientificNotationCalculatorClient').then(m => m.ScientificNotationCalculatorClient), { loading: Skeleton })
const LengthConverterClient = dynamic(() => import('./LengthConverterClient').then(m => m.LengthConverterClient), { loading: Skeleton })
const WeightConverterClient = dynamic(() => import('./WeightConverterClient').then(m => m.WeightConverterClient), { loading: Skeleton })
const TemperatureConverterClient = dynamic(() => import('./TemperatureConverterClient').then(m => m.TemperatureConverterClient), { loading: Skeleton })
const AreaCalculatorClient = dynamic(() => import('./AreaCalculatorClient').then(m => m.AreaCalculatorClient), { loading: Skeleton })
const VolumeCalculatorClient = dynamic(() => import('./VolumeCalculatorClient').then(m => m.VolumeCalculatorClient), { loading: Skeleton })
const AreaConverterClient = dynamic(() => import('./AreaConverterClient').then(m => m.AreaConverterClient), { loading: Skeleton })
const VolumeConverterClient = dynamic(() => import('./VolumeConverterClient').then(m => m.VolumeConverterClient), { loading: Skeleton })
const SalaryCalculatorClient = dynamic(() => import('./SalaryCalculatorClient').then(m => m.SalaryCalculatorClient), { loading: Skeleton })
const InflationCalculatorClient = dynamic(() => import('./InflationCalculatorClient').then(m => m.InflationCalculatorClient), { loading: Skeleton })
const TaxCalculatorClient = dynamic(() => import('./TaxCalculatorClient').then(m => m.TaxCalculatorClient), { loading: Skeleton })
const RetirementCalculatorClient = dynamic(() => import('./RetirementCalculatorClient').then(m => m.RetirementCalculatorClient), { loading: Skeleton })
const OvulationCalculatorClient = dynamic(() => import('./OvulationCalculatorClient').then(m => m.OvulationCalculatorClient), { loading: Skeleton })
const SleepCalculatorClient = dynamic(() => import('./SleepCalculatorClient').then(m => m.SleepCalculatorClient), { loading: Skeleton })
const InvestmentCalculatorClient = dynamic(() => import('./InvestmentCalculatorClient').then(m => m.InvestmentCalculatorClient), { loading: Skeleton })
const CurrencyConverterClient = dynamic(() => import('./CurrencyConverterClient').then(m => m.CurrencyConverterClient), { loading: Skeleton })
const CalorieCalculatorClient = dynamic(() => import('./CalorieCalculatorClient').then(m => m.CalorieCalculatorClient), { loading: Skeleton })
const SavingsCalculatorClient = dynamic(() => import('./SavingsCalculatorClient').then(m => m.SavingsCalculatorClient), { loading: Skeleton })
const TipCalculatorClient = dynamic(() => import('./TipCalculatorClient').then(m => m.TipCalculatorClient), { loading: Skeleton })
const PregnancyCalculatorClient = dynamic(() => import('./PregnancyCalculatorClient').then(m => m.PregnancyCalculatorClient), { loading: Skeleton })
const DueDateCalculatorClient = dynamic(() => import('./DueDateCalculatorClient').then(m => m.DueDateCalculatorClient), { loading: Skeleton })

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InstrumentUIProps {
  slug: string
  lang: string
  translations: Record<string, unknown>
  liveRates?: LiveRatesResult | null
}

// ── Router ────────────────────────────────────────────────────────────────────

export function InstrumentUI({ slug, lang, translations, liveRates }: InstrumentUIProps) {
  switch (slug) {
    case 'bmi-calculator':               return <BMICalculatorClient translations={translations} lang={lang} />
    case 'percentage-calculator':        return <PercentageCalculatorClient translations={translations} lang={lang} />
    case 'bmr-calculator':               return <BmrCalculatorClient translations={translations} lang={lang} />
    case 'ideal-weight-calculator':      return <IdealWeightCalculatorClient translations={translations} lang={lang} />
    case 'tdee-calculator':              return <TdeeCalculatorClient translations={translations} lang={lang} />
    case 'body-fat-calculator':          return <BodyFatCalculatorClient translations={translations} lang={lang} />
    case 'calorie-deficit-calculator':   return <CalorieDeficitCalculatorClient translations={translations} lang={lang} />
    case 'loan-calculator':              return <LoanCalculatorClient translations={translations} lang={lang} />
    case 'mortgage-calculator':          return <MortgageCalculatorClient translations={translations} lang={lang} />
    case 'vat-calculator':               return <VatCalculatorClient translations={translations} lang={lang} />
    case 'compound-interest-calculator': return <CompoundInterestCalculatorClient translations={translations} lang={lang} />
    case 'discount-calculator':          return <DiscountCalculatorClient translations={translations} lang={lang} />
    case 'fraction-calculator':          return <FractionCalculatorClient translations={translations} lang={lang} />
    case 'ratio-calculator':             return <RatioCalculatorClient translations={translations} lang={lang} />
    case 'average-calculator':           return <AverageCalculatorClient translations={translations} lang={lang} />
    case 'scientific-notation-calculator': return <ScientificNotationCalculatorClient translations={translations} lang={lang} />
    case 'length-converter':             return <LengthConverterClient translations={translations} lang={lang} />
    case 'weight-converter':             return <WeightConverterClient translations={translations} lang={lang} />
    case 'temperature-converter':        return <TemperatureConverterClient translations={translations} lang={lang} />
    case 'area-calculator':              return <AreaCalculatorClient translations={translations} lang={lang} />
    case 'volume-calculator':            return <VolumeCalculatorClient translations={translations} lang={lang} />
    case 'area-converter':               return <AreaConverterClient translations={translations} lang={lang} />
    case 'volume-converter':             return <VolumeConverterClient translations={translations} lang={lang} />
    case 'salary-calculator':            return <SalaryCalculatorClient translations={translations} lang={lang} />
    case 'inflation-calculator':         return <InflationCalculatorClient translations={translations} lang={lang} />
    case 'tax-calculator':               return <TaxCalculatorClient translations={translations} lang={lang} />
    case 'retirement-calculator':        return <RetirementCalculatorClient translations={translations} lang={lang} />
    case 'ovulation-calculator':         return <OvulationCalculatorClient translations={translations} lang={lang} />
    case 'sleep-calculator':             return <SleepCalculatorClient translations={translations} lang={lang} />
    case 'investment-calculator':        return <InvestmentCalculatorClient translations={translations} lang={lang} />
    case 'currency-converter':           return (
      <CurrencyConverterClient
        translations={translations}
        lang={lang}
        rates={liveRates?.rates ?? {}}
        ratesUpdatedAt={liveRates?.updatedAt ?? new Date().toISOString()}
        ratesIsLive={liveRates?.isLive ?? false}
      />
    )
    case 'calorie-calculator':           return <CalorieCalculatorClient translations={translations} lang={lang} />
    case 'savings-calculator':           return <SavingsCalculatorClient translations={translations} lang={lang} />
    case 'tip-calculator':               return <TipCalculatorClient translations={translations} lang={lang} />
    case 'pregnancy-calculator':         return <PregnancyCalculatorClient translations={translations} lang={lang} />
    case 'due-date-calculator':          return <DueDateCalculatorClient translations={translations} lang={lang} />
    default:
      return (
        <div className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center rounded-2xl border border-slate-200 dark:border-slate-700">
          UI for <code className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{slug}</code> coming soon.
        </div>
      )
  }
}
