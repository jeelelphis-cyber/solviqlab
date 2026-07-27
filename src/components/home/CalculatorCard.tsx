import Link from 'next/link'
import {
  Scale, Flame, Dumbbell, Utensils, TrendingDown, Moon, Zap, Target,
  Baby, CalendarDays, HeartPulse,
  Home, CreditCard, TrendingUp, PiggyBank, BarChart2, Umbrella, Briefcase,
  Receipt, Landmark, Tag, Coins, Globe, BadgePercent,
  Percent, BarChart, Divide, Equal, Calculator, Square,
  Ruler, Thermometer, ArrowLeftRight, Droplets, Maximize2, Box,
  type LucideIcon,
} from 'lucide-react'
import { t } from '../../lib/ui-strings'
import type { InstrumentMeta } from '../../lib/instruments'

function getProductSegment(category: string): 'calculators' | 'converters' {
  return category === 'conversion' ? 'converters' : 'calculators'
}

function getInstrumentPath(lang: string, slug: string, category: string): string {
  return `/${lang}/${getProductSegment(category)}/${slug}`
}

const INSTRUMENT_ICONS: Record<string, LucideIcon> = {
  // Health
  'bmi-calculator':             Scale,
  'bmr-calculator':             Flame,
  'body-fat-calculator':        Dumbbell,
  'calorie-calculator':         Utensils,
  'calorie-deficit-calculator': TrendingDown,
  'sleep-calculator':           Moon,
  'tdee-calculator':            Zap,
  'ideal-weight-calculator':    Target,
  'pregnancy-calculator':       Baby,
  'due-date-calculator':        CalendarDays,
  'ovulation-calculator':       HeartPulse,
  // Finance
  'mortgage-calculator':        Home,
  'loan-calculator':            CreditCard,
  'compound-interest-calculator': TrendingUp,
  'savings-calculator':         PiggyBank,
  'investment-calculator':      BarChart2,
  'retirement-calculator':      Umbrella,
  'salary-calculator':          Briefcase,
  'tax-calculator':             Receipt,
  'vat-calculator':             Landmark,
  'inflation-calculator':       BadgePercent,
  'discount-calculator':        Tag,
  'tip-calculator':             Coins,
  'currency-converter':         Globe,
  // Math
  'percentage-calculator':      Percent,
  'average-calculator':         BarChart,
  'fraction-calculator':        Divide,
  'ratio-calculator':           Equal,
  'scientific-notation-calculator': Calculator,
  'area-calculator':            Square,
  'volume-calculator':          Box,
  // Conversion
  'length-converter':           Ruler,
  'temperature-converter':      Thermometer,
  'weight-converter':           ArrowLeftRight,
  'volume-converter':           Droplets,
  'area-converter':             Maximize2,
}

const CATEGORY_ICON_COLORS: Record<string, string> = {
  health:     'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400',
  finance:    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  math:       'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400',
  conversion: 'bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400',
  utility:    'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  health:     'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  finance:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  math:       'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  conversion: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  utility:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export function CalculatorCard({ instrument, lang }: { instrument: InstrumentMeta; lang: string }) {
  const s = t(lang)
  const Icon = INSTRUMENT_ICONS[instrument.slug] ?? Calculator
  const iconColorClass  = CATEGORY_ICON_COLORS[instrument.category]  ?? CATEGORY_ICON_COLORS['utility']!
  const badgeColorClass = CATEGORY_BADGE_COLORS[instrument.category] ?? CATEGORY_BADGE_COLORS['utility']!
  const catLabel = s.categoryLabels[instrument.category] ?? instrument.category

  return (
    <Link href={getInstrumentPath(lang, instrument.slug, instrument.category)} className="group block">
      <div className="h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColorClass}`}>
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
