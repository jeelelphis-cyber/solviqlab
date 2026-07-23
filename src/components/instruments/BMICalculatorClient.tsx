'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { calculateBMI } from '../../instruments/bmi-calculator/calculate.js'
import { BMIInputSchema } from '../../instruments/bmi-calculator/validate.js'
import { getInterpretation } from '../../instruments/bmi-calculator/interpret.js'
import { getBMIBucket } from '../../instruments/bmi-calculator/types.js'
import type { BMIInput, BMIOutput, BMICategory } from '../../instruments/bmi-calculator/types.js'
import { t as uiT } from '../../lib/ui-strings'
import { ShareButtons } from '../ShareButtons.js'

// ─── Analytics ───────────────────────────────────────────────────────────────
function track(event: string, params: Record<string, string>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    ;(window as { gtag: (cmd: string, event: string, params: Record<string, string>) => void }).gtag('event', event, params)
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type UnitSystem = 'metric' | 'imperial'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<BMICategory, {
  verdict: string
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
  barColor: string
}> = {
  underweight_severe: {
    verdict: 'Severely Underweight',
    icon: '⚠️',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 dark:bg-blue-950',
    borderClass: 'border-blue-300',
    barColor: '#1D4ED8',
  },
  underweight: {
    verdict: 'Underweight',
    icon: '⚠️',
    colorClass: 'text-sky-700',
    bgClass: 'bg-sky-50 dark:bg-sky-950',
    borderClass: 'border-sky-300',
    barColor: '#0284C7',
  },
  normal: {
    verdict: 'Healthy Weight',
    icon: '✅',
    colorClass: 'text-green-700',
    bgClass: 'bg-green-50 dark:bg-green-950',
    borderClass: 'border-green-300',
    barColor: '#16A34A',
  },
  overweight: {
    verdict: 'Overweight',
    icon: '⚠️',
    colorClass: 'text-yellow-700',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950',
    borderClass: 'border-yellow-300',
    barColor: '#CA8A04',
  },
  obese_1: {
    verdict: 'Obese — Class I',
    icon: '🔴',
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50 dark:bg-orange-950',
    borderClass: 'border-orange-300',
    barColor: '#EA580C',
  },
  obese_2: {
    verdict: 'Obese — Class II',
    icon: '🔴',
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50 dark:bg-red-950',
    borderClass: 'border-red-300',
    barColor: '#DC2626',
  },
  obese_3: {
    verdict: 'Obese — Class III',
    icon: '🔴',
    colorClass: 'text-red-800',
    bgClass: 'bg-red-100 dark:bg-red-950',
    borderClass: 'border-red-400',
    barColor: '#991B1B',
  },
}

// ─── BMI Scale Bar ────────────────────────────────────────────────────────────
// Display range: 14–44 (30 units). Each zone as % of 30.
const SCALE_ZONES = [
  { label: '<16', color: '#3B82F6', pct: 6.7 },   // blue
  { label: '16', color: '#38BDF8', pct: 8.3 },    // sky
  { label: '18.5', color: '#4ADE80', pct: 21.7 }, // green
  { label: '25', color: '#FCD34D', pct: 16.7 },   // yellow
  { label: '30', color: '#FB923C', pct: 16.7 },   // orange
  { label: '35', color: '#F87171', pct: 16.7 },   // red
  { label: '40', color: '#991B1B', pct: 13.3 },   // deep red
]
const SCALE_MIN = 14
const SCALE_MAX = 44

function BMIScaleBar({ bmi }: { bmi: number }) {
  const pct = Math.min(Math.max(((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100, 1.5), 98.5)
  return (
    <div className="mt-4">
      <div className="relative h-4 rounded-full overflow-hidden flex" role="img" aria-label={`BMI scale showing your value of ${bmi}`}>
        {SCALE_ZONES.map((z, i) => (
          <div key={i} style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
        ))}
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-slate-700 rounded-full shadow-md z-10 transition-all duration-500"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      {/* Scale labels */}
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1 px-0.5">
        <span>14</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>40+</span>
      </div>
    </div>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={text}
        className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >?</button>
      {open && (
        <div role="tooltip" className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 w-52 bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </span>
  )
}

// ─── Related Calculators ──────────────────────────────────────────────────────

function RelatedCalculators({ lang }: { lang: string }) {
  const s = uiT(lang)
  const related = [
    { slug: 'tdee-calculator',            name: s.relatedTdee,          desc: s.relatedTdeeDesc,          icon: '🔥' },
    { slug: 'body-fat-calculator',        name: s.relatedBodyFat,        desc: s.relatedBodyFatDesc,        icon: '💪' },
    { slug: 'ideal-weight-calculator',    name: s.relatedIdealWeight,    desc: s.relatedIdealWeightDesc,    icon: '⚖️' },
    { slug: 'calorie-deficit-calculator', name: s.relatedCalorieDeficit, desc: s.relatedCalorieDeficitDesc, icon: '🥗' },
  ]
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        {s.nextSteps}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {related.map(r => (
          <Link
            key={r.slug}
            href={`/${lang}/${r.slug}`}
            onClick={() => track('related_click', { from_slug: 'bmi-calculator', to_slug: r.slug })}
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all group"
          >
            <span className="text-xl leading-none mt-0.5">{r.icon}</span>
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {r.name}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">{r.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Sources Block ────────────────────────────────────────────────────────────
function SourcesBlock({ lang }: { lang: string }) {
  const s = uiT(lang)
  return (
    <details className="mt-6 group">
      <summary className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 list-none flex items-center gap-1 select-none">
        <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
        {s.methodologySources}
      </summary>
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
        <p>
          <strong>BMI Formula:</strong> WHO Technical Report Series No. 854, 1995. BMI = weight (kg) ÷ height² (m²).
          Imperial factor 703 per NIH Publication 98-4083.
        </p>
        <p>
          <strong>Body Fat Estimate:</strong> Deurenberg et al., 1991. British Journal of Nutrition 65(2):105–114.
          Deurenberg formula: %BF = 1.2 × BMI + 0.23 × age − 10.8 × sex − 5.4.
        </p>
        <p>
          <strong>BMI Prime:</strong> Derived from Garrow &amp; Webster, 1985. Upper limit of normal (25) used as denominator.
        </p>
        <p className="text-slate-400 dark:text-slate-500 italic">
          BMI is a population-level screening tool. It does not measure body composition directly and may misclassify individuals with high muscle mass or unusual body proportions.
          This calculator does not constitute medical advice.
        </p>
      </div>
    </details>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BMICalculatorClient({ translations, lang }: Props) {
  const t = translations as {
    form: Record<string, string>
    result: Record<string, unknown>
    validation: Record<string, string>
  }

  const [unit, setUnit] = useState<UnitSystem>('metric')
  const [heightCm, setHeightCm] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('')
  const [result, setResult] = useState<BMIOutput | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  // Fade-in animation on result
  useEffect(() => {
    if (result) {
      const id = setTimeout(() => setVisible(true), 30)
      return () => clearTimeout(id)
    } else {
      setVisible(false)
    }
  }, [result])

  const validate = useCallback((silent = false): BMIInput | null => {
    let input: BMIInput
    const parsedAge = age ? parseInt(age, 10) : null
    const parsedSex = sex || null

    if (unit === 'metric') {
      input = {
        height_cm: parseFloat(heightCm),
        weight_kg: parseFloat(weight),
        unitSystem: 'metric',
        age: parsedAge,
        sex: parsedSex as 'male' | 'female' | 'other' | null,
      }
    } else {
      const ft = parseFloat(heightFt) || 0
      const inches = parseFloat(heightIn) || 0
      const totalCm = (ft * 12 + inches) * 2.54
      const weightKg = parseFloat(weight) * 0.453592
      input = {
        height_cm: totalCm,
        weight_kg: weightKg,
        unitSystem: 'imperial',
        age: parsedAge,
        sex: parsedSex as 'male' | 'female' | 'other' | null,
      }
    }

    const validation = BMIInputSchema.safeParse(input)
    if (!validation.success) {
      if (!silent) {
        const errs: Record<string, string> = {}
        for (const issue of validation.error.issues) {
          errs[issue.path.join('.')] = issue.message
        }
        setErrors(errs)
      }
      return null
    }
    if (!silent) setErrors({})
    return validation.data as BMIInput
  }, [unit, heightCm, heightFt, heightIn, weight, age, sex])

  const calculate = useCallback(() => {
    track('calculate_click', { slug: 'bmi-calculator', category: 'health', lang })
    setTouched({ height_cm: true, weight_kg: true })
    const input = validate(false)
    if (!input) return
    const output = calculateBMI(input)
    setResult(output)
    track('result_shown', { slug: 'bmi-calculator', category: 'health', result_bucket: getBMIBucket(output.bmi) })
    window.dispatchEvent(new CustomEvent('solviqlab:result', { detail: { slug: 'bmi-calculator', name: 'BMI Calculator', value: output.bmi, label: output.category, category: output.category, unit: 'kg/m²', metadata: output } }))
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
  }, [validate, lang])

  const reset = useCallback(() => {
    setHeightCm(''); setHeightFt(''); setHeightIn('')
    setWeight(''); setAge(''); setSex('')
    setResult(null); setErrors({}); setTouched({})
  }, [])

  const copyResult = useCallback(() => {
    if (!result) return
    const cfg = CATEGORY_CONFIG[result.category]
    const text = `BMI: ${result.bmi.toFixed(1)} — ${cfg.verdict} | Healthy range: ${result.healthyWeightMin_kg.toFixed(0)}–${result.healthyWeightMax_kg.toFixed(0)} kg | solviqlab.com/en/bmi-calculator`
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    track('copy_result', { slug: 'bmi-calculator' })
  }, [result])

  const shareResult = useCallback(() => {
    if (!result) return
    const params = unit === 'metric'
      ? `?h=${heightCm}&w=${weight}&unit=metric`
      : `?hft=${heightFt}&hin=${heightIn}&w=${weight}&unit=imperial`
    const url = `https://solviqlab.com/en/bmi-calculator${params}`
    void navigator.clipboard.writeText(url)
    track('share_click', { slug: 'bmi-calculator', platform: 'link' })
  }, [result, unit, heightCm, weight, heightFt, heightIn])

  // Inline field validation state
  const fieldClass = (key: string, val: string) => {
    const base = 'w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-base'
    if (!touched[key] || !val) return `${base} border-slate-200 dark:border-slate-700`
    if (errors[key]) return `${base} border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/30`
    return `${base} border-green-400 dark:border-green-600`
  }

  const interp = result
    ? getInterpretation(result, (['es', 'pt', 'uk'].includes(lang) ? lang : 'en') as Parameters<typeof getInterpretation>[1])
    : null
  const cfg = result ? CATEGORY_CONFIG[result.category] : null
  const form = t.form ?? {}
  const resultT = t.result as Record<string, unknown> | undefined
  const cats = resultT?.['categories'] as Record<string, string> | undefined
  const categoryLabel = (cat: string) => cats?.[cat] ?? cfg?.verdict ?? cat
  const s = uiT(lang)

  return (
    <div className="space-y-5">
      {/* ── Unit Toggle ─────────────────────────────────────────────────────── */}
      <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-fit">
        {(['metric', 'imperial'] as UnitSystem[]).map(u => (
          <button
            key={u}
            onClick={() => { setUnit(u); setResult(null); setErrors({}) }}
            aria-pressed={unit === u}
            className={`px-5 py-2 text-sm font-medium transition-colors min-h-[44px] ${
              unit === u
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {u === 'metric' ? (form['unit_metric'] ?? '🌍 Metric (cm, kg)') : (form['unit_imperial'] ?? '🇺🇸 Imperial (ft, lb)')}
          </button>
        ))}
      </div>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        role="group"
        aria-describedby="bmi-form-desc"
      >
        <p id="bmi-form-desc" className="sr-only">
          Enter your height and weight to calculate your Body Mass Index.
        </p>

        {/* Height */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {form['height_label'] ?? 'Height'}
            <Tooltip text="Your standing height without shoes. For best accuracy, measure in the morning." />
          </label>
          {unit === 'metric' ? (
            <input
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, height_cm: true }))}
              placeholder="e.g. 175 cm"
              min={50} max={250}
              aria-label="Height in centimeters"
              aria-invalid={!!errors['height_cm']}
              aria-describedby={errors['height_cm'] ? 'height-err' : undefined}
              className={fieldClass('height_cm', heightCm)}
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={heightFt}
                onChange={e => setHeightFt(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, height_cm: true }))}
                placeholder={form['height_placeholder_ft'] ?? 'ft'}
                aria-label="Height feet"
                className={`w-1/2 ${fieldClass('height_cm', heightFt)}`}
              />
              <input
                type="number"
                inputMode="decimal"
                value={heightIn}
                onChange={e => setHeightIn(e.target.value)}
                placeholder={form['height_placeholder_in'] ?? 'in'}
                aria-label="Height inches"
                className={`w-1/2 ${fieldClass('height_cm', heightFt)}`}
              />
            </div>
          )}
          {errors['height_cm'] && touched['height_cm'] && (
            <p id="height-err" role="alert" aria-live="polite" className="text-red-600 dark:text-red-400 text-xs mt-1">
              {errors['height_cm']}
            </p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {form['weight_label'] ?? 'Weight'}
            <Tooltip text={unit === 'metric' ? 'Your weight in kilograms without heavy clothing.' : 'Your weight in pounds without heavy clothing.'} />
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, weight_kg: true }))}
            placeholder={unit === 'metric' ? (form['weight_placeholder_kg'] ?? 'e.g. 70 kg') : (form['weight_placeholder_lb'] ?? 'e.g. 154 lb')}
            aria-label={`Weight in ${unit === 'metric' ? 'kilograms' : 'pounds'}`}
            aria-invalid={!!errors['weight_kg']}
            aria-describedby={errors['weight_kg'] ? 'weight-err' : undefined}
            className={fieldClass('weight_kg', weight)}
          />
          {errors['weight_kg'] && touched['weight_kg'] && (
            <p id="weight-err" role="alert" aria-live="polite" className="text-red-600 dark:text-red-400 text-xs mt-1">
              {errors['weight_kg']}
            </p>
          )}
        </div>

        {/* Age (optional) */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {form['age_label'] ?? 'Age'} <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">({s.optional})</span>
            <Tooltip text="Used to estimate body fat % via the Deurenberg formula. Not required for BMI." />
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="e.g. 30"
            min={18} max={120}
            aria-label="Age in years (optional)"
            className={fieldClass('age', age)}
          />
        </div>

        {/* Sex (optional) */}
        <div>
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {form['sex_label'] ?? 'Sex'} <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">({s.optional})</span>
            <Tooltip text="Used together with age to estimate body fat %. Not used in BMI calculation itself." />
          </label>
          <select
            value={sex}
            onChange={e => setSex(e.target.value as 'male' | 'female' | 'other' | '')}
            aria-label="Biological sex (optional)"
            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-base min-h-[44px]"
          >
            <option value="">— Select —</option>
            <option value="male">{form['sex_male'] ?? 'Male'}</option>
            <option value="female">{form['sex_female'] ?? 'Female'}</option>
            <option value="other">{form['sex_other'] ?? 'Other / Prefer not to say'}</option>
          </select>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={calculate}
          className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors min-h-[44px] shadow-sm hover:shadow-md"
        >
          {form['calculate_button'] ?? 'Calculate BMI'}
        </button>
        {result && (
          <button
            onClick={reset}
            className="px-5 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px]"
          >
            {form['reset_button'] ?? 'Reset'}
          </button>
        )}
      </div>

      {/* ── Result ───────────────────────────────────────────────────────────── */}
      {result && cfg && (
        <div
          ref={resultRef}
          role="status"
          aria-live="polite"
          aria-label={`Your BMI result: ${result.bmi.toFixed(1)}, ${cfg.verdict}`}
          className={`transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          {/* Verdict Card */}
          <div className={`rounded-2xl border-2 p-6 ${cfg.bgClass} ${cfg.borderClass}`}>
            {/* Icon + Verdict */}
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl leading-none mt-0.5" aria-hidden="true">{cfg.icon}</span>
              <div>
                <div className={`text-2xl sm:text-3xl font-bold leading-tight ${cfg.colorClass}`}>
                  {categoryLabel(result.category)}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  BMI: <strong className="text-slate-700 dark:text-slate-200 text-lg">{result.bmi.toFixed(1)}</strong>
                  <span className="ml-2 text-xs">kg/m²</span>
                </div>
              </div>
            </div>

            {/* Scale Bar */}
            <BMIScaleBar bmi={result.bmi} />

            {/* Context */}
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {s.bmiContext(result.bmi.toFixed(1), categoryLabel(result.category))}{' '}
              {result.category === 'normal'
                ? s.bmiRangeNormal
                : result.category === 'overweight'
                ? s.bmiRangeOverweight
                : result.category === 'underweight' || result.category === 'underweight_severe'
                ? s.bmiRangeUnder
                : s.bmiRangeNormal}
            </p>

            {/* Healthy Weight Range */}
            <div className="mt-3 inline-flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 text-sm">
              <span>⚖️</span>
              <span className="text-slate-600 dark:text-slate-300">
                {s.healthyWeightFor}{' '}
                <strong className="text-slate-800 dark:text-slate-100">
                  {result.healthyWeightMin_kg.toFixed(0)}–{result.healthyWeightMax_kg.toFixed(0)} kg
                  {unit === 'imperial' && (
                    <span className="font-normal text-slate-500 ml-1">
                      ({(result.healthyWeightMin_kg * 2.20462).toFixed(0)}–{(result.healthyWeightMax_kg * 2.20462).toFixed(0)} lb)
                    </span>
                  )}
                </strong>
              </span>
            </div>

            {/* Body Fat (if available) */}
            {result.bodyFatEstimate != null && (
              <div className="mt-2 inline-flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 text-sm ml-2">
                <span>📊</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {s.estBodyFat} <strong className="text-slate-800 dark:text-slate-100">~{result.bodyFatEstimate.toFixed(1)}%</strong>
                </span>
              </div>
            )}
          </div>

          {/* ── Interpretation Block ─────────────────────────────────────────── */}
          {interp && (
            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {s.whatThisMeans}
                </h3>
                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                  {interp.primary}
                </p>
              </div>

              {interp.nextStep && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {s.whatToDoNext}
                  </h3>
                  <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                    {interp.nextStep}
                  </p>
                </div>
              )}

              {/* Primary CTA */}
              {result.category === 'normal' ? (
                <Link
                  href={`/${lang}/tdee-calculator`}
                  onClick={() => track('related_click', { from_slug: 'bmi-calculator', to_slug: 'tdee-calculator' })}
                  className="inline-flex items-center gap-2 mt-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {s.ctaCalories}
                </Link>
              ) : result.category === 'overweight' || result.category === 'obese_1' ? (
                <Link
                  href={`/${lang}/calorie-deficit-calculator`}
                  onClick={() => track('related_click', { from_slug: 'bmi-calculator', to_slug: 'calorie-deficit-calculator' })}
                  className="inline-flex items-center gap-2 mt-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {s.ctaDeficit}
                </Link>
              ) : (
                <Link
                  href={`/${lang}/ideal-weight-calculator`}
                  onClick={() => track('related_click', { from_slug: 'bmi-calculator', to_slug: 'ideal-weight-calculator' })}
                  className="inline-flex items-center gap-2 mt-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {s.ctaIdealWeight}
                </Link>
              )}

              {interp.disclaimer && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic border-t border-slate-100 dark:border-slate-700 pt-3">
                  {interp.disclaimer}
                </p>
              )}
            </div>
          )}

          {/* ── Action Buttons ───────────────────────────────────────────────── */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={copyResult}
              aria-label="Copy BMI result to clipboard"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[36px]"
            >
              {copied ? s.copied : s.copyResult}
            </button>
            <button
              onClick={shareResult}
              aria-label="Copy share link to clipboard"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[36px]"
            >
              {s.shareLink}
            </button>
            <button
              onClick={() => window.print()}
              aria-label="Print this result"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[36px]"
            >
              {s.print}
            </button>
          </div>
          <ShareButtons text={`My BMI is ${result.bmi} (${result.category.replace(/_/g, ' ')}) — calculated free at SolviqLab`} className="mt-2" />

          {/* ── Additional Metrics ───────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">{s.bmiPrimeLabel}</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{result.bmiPrime.toFixed(2)}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">{s.bmiPrimeSub}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">{s.ponderalLabel}</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{result.ponderalIndex.toFixed(1)}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">kg/m³</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">{s.categoryLabel}</div>
              <div className={`font-bold text-sm ${cfg.colorClass}`}>{categoryLabel(result.category).split(' — ')[0]}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">{s.whoStandard}</div>
            </div>
          </div>

          {/* ── Related Calculators ──────────────────────────────────────────── */}
          <RelatedCalculators lang={lang} />

          {/* ── Sources ──────────────────────────────────────────────────────── */}
          <SourcesBlock lang={lang} />
        </div>
      )}
    </div>
  )
}
