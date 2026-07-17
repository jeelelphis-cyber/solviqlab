'use client'
import { useState } from 'react'
import { calculateCalories, convertLbToKg, convertFtInchesToCm } from '../../instruments/calorie-calculator/lib/calculate.js'
import type { CalorieCalculatorOutput, ActivityLevel, Goal } from '../../instruments/calorie-calculator/lib/types.js'
import { ShareButtons } from '../ShareButtons.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

type GoalTier = 'lose' | 'maintain' | 'gain'

const GOAL_CONFIG: Record<GoalTier, {
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
  ctaHref: string
  ctaKey: string
}> = {
  lose: {
    icon: '📉',
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-300 dark:border-orange-700',
    ctaHref: '/calculators/calorie-deficit-calculator',
    ctaKey: 'cta_lose',
  },
  maintain: {
    icon: '✅',
    colorClass: 'text-green-700 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/40',
    borderClass: 'border-green-300 dark:border-green-700',
    ctaHref: '/calculators/macro-calculator',
    ctaKey: 'cta_maintain',
  },
  gain: {
    icon: '💪',
    colorClass: 'text-blue-700 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-300 dark:border-blue-700',
    ctaHref: '/calculators/macro-calculator',
    ctaKey: 'cta_gain',
  },
}

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9
  const pPct = total > 0 ? (protein * 4 / total) * 100 : 33
  const cPct = total > 0 ? (carbs * 4 / total) * 100 : 34
  const fPct = total > 0 ? (fat * 9 / total) * 100 : 33
  return (
    <div className="mt-2">
      <div className="flex h-2.5 rounded-full overflow-hidden">
        <div style={{ width: `${pPct}%`, backgroundColor: '#3B82F6' }} title={`Protein ${Math.round(pPct)}%`} />
        <div style={{ width: `${cPct}%`, backgroundColor: '#F59E0B' }} title={`Carbs ${Math.round(cPct)}%`} />
        <div style={{ width: `${fPct}%`, backgroundColor: '#EF4444' }} title={`Fat ${Math.round(fPct)}%`} />
      </div>
      <div className="flex justify-between text-xs text-content-tertiary mt-1">
        <span className="text-blue-600 dark:text-blue-400">Protein {Math.round(pPct)}%</span>
        <span className="text-yellow-600 dark:text-yellow-400">Carbs {Math.round(cPct)}%</span>
        <span className="text-red-500 dark:text-red-400">Fat {Math.round(fPct)}%</span>
      </div>
    </div>
  )
}

export function CalorieCalculatorClient({ translations }: Props) {
  const t = (key: string): string => (translations[key] as string | undefined) ?? key

  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [weight, setWeight] = useState('')
  const [weightLb, setWeightLb] = useState('')
  const [height, setHeight] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<Goal>('maintain')
  const [result, setResult] = useState<CalorieCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function calculate() {
    try {
      const w = unitSystem === 'metric'
        ? parseFloat(weight)
        : convertLbToKg(parseFloat(weightLb))
      const h = unitSystem === 'metric'
        ? parseFloat(height)
        : convertFtInchesToCm(parseFloat(heightFt || '0'), parseFloat(heightIn || '0'))
      const a = parseInt(age, 10)

      if (!w || !h || !a) { setError('Please fill in all required fields.'); return }

      setResult(calculateCalories({ weight_kg: w, height_cm: h, age: a, sex, activityLevel, goal }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setWeight(''); setWeightLb(''); setHeight(''); setHeightFt(''); setHeightIn('')
    setAge(''); setSex('male'); setActivityLevel('moderate'); setGoal('maintain')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const text = `Calorie Calculator Results\nBMR: ${result.bmr} kcal/day\nMaintenance: ${result.maintenance} kcal/day\nGoal (${goal}): ${result.goalCalories} kcal/day\nProtein: ${result.protein_g}g | Carbs: ${result.carbs_g}g | Fat: ${result.fat_g}g`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const goalConfig = GOAL_CONFIG[goal]

  const inputClass = 'w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary'
  const labelClass = 'block text-sm font-medium text-content-secondary mb-1'

  return (
    <div className="space-y-6">

      {/* Unit Toggle */}
      <div className="flex gap-2">
        {(['metric', 'imperial'] as const).map(u => (
          <button
            key={u}
            onClick={() => setUnitSystem(u)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              unitSystem === u
                ? 'bg-accent-primary text-white'
                : 'border border-border-default text-content-secondary hover:text-content-primary'
            }`}
          >
            {t(`opt_${u}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weight */}
        <div>
          <label className={labelClass}>{t('label_weight')} ({unitSystem === 'metric' ? 'kg' : t('label_lb')})</label>
          {unitSystem === 'metric' ? (
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" min={20} max={300} className={inputClass} />
          ) : (
            <input type="number" value={weightLb} onChange={e => setWeightLb(e.target.value)} placeholder="e.g. 154" min={44} max={660} className={inputClass} />
          )}
        </div>

        {/* Height */}
        <div>
          <label className={labelClass}>{t('label_height')} ({unitSystem === 'metric' ? 'cm' : 'ft / in'})</label>
          {unitSystem === 'metric' ? (
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 170" min={100} max={250} className={inputClass} />
          ) : (
            <div className="flex gap-2">
              <input type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder={t('label_feet')} min={3} max={8} className={inputClass} />
              <input type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder={t('label_inches')} min={0} max={11} className={inputClass} />
            </div>
          )}
        </div>

        {/* Age */}
        <div>
          <label className={labelClass}>{t('label_age')}</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 30" min={15} max={100} className={inputClass} />
        </div>

        {/* Sex */}
        <div>
          <label className={labelClass}>{t('label_sex')}</label>
          <select value={sex} onChange={e => setSex(e.target.value as 'male' | 'female')} className={inputClass}>
            <option value="male">{t('opt_male')}</option>
            <option value="female">{t('opt_female')}</option>
          </select>
        </div>

        {/* Activity */}
        <div className="sm:col-span-2">
          <label className={labelClass}>{t('label_activity')}</label>
          <select value={activityLevel} onChange={e => setActivityLevel(e.target.value as ActivityLevel)} className={inputClass}>
            <option value="sedentary">{t('opt_sedentary')}</option>
            <option value="light">{t('opt_light')}</option>
            <option value="moderate">{t('opt_moderate')}</option>
            <option value="active">{t('opt_active')}</option>
            <option value="very_active">{t('opt_very_active')}</option>
          </select>
        </div>

        {/* Goal */}
        <div className="sm:col-span-2">
          <label className={labelClass}>{t('label_goal')}</label>
          <div className="flex gap-2 flex-wrap">
            {(['lose', 'maintain', 'gain'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                  goal === g
                    ? `${GOAL_CONFIG[g].bgClass} ${GOAL_CONFIG[g].borderClass} border ${GOAL_CONFIG[g].colorClass}`
                    : 'border border-border-default text-content-secondary hover:text-content-primary'
                }`}
              >
                {GOAL_CONFIG[g].icon} {t(`opt_${g}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={calculate} className="flex-1 bg-accent-primary hover:bg-accent-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
          {t('calculate')}
        </button>
        <button onClick={reset} className="px-4 py-2.5 border border-border-default text-content-secondary hover:text-content-primary hover:border-border-hover rounded-lg transition-colors">
          {t('reset')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Goal Card */}
          <div className={`border rounded-xl p-5 ${goalConfig.bgClass} ${goalConfig.borderClass}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{goalConfig.icon}</span>
              <span className={`text-sm font-semibold uppercase tracking-wide ${goalConfig.colorClass}`}>{t(`opt_${goal}`)}</span>
            </div>
            <div className={`text-4xl font-bold mb-1 ${goalConfig.colorClass}`}>{result.goalCalories.toLocaleString()}</div>
            <div className="text-sm text-content-secondary">{t('per_day')}</div>
          </div>

          {/* Full Table */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border-default">
                <span className="text-content-secondary">{t('label_bmr')}</span>
                <span className="font-semibold text-content-primary">{result.bmr.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-default font-medium">
                <span className="text-content-primary">{t('label_maintenance')}</span>
                <span className="text-content-primary">{result.maintenance.toLocaleString()} kcal</span>
              </div>
              <div className="pt-1 pb-1">
                <div className="text-xs text-content-tertiary mb-2 uppercase tracking-wide">Weight Loss</div>
                <div className="space-y-1.5">
                  {[
                    { label: t('label_mild_loss'), val: result.mildLoss, color: 'text-orange-500' },
                    { label: t('label_loss'), val: result.weightLoss, color: 'text-orange-600' },
                    { label: t('label_extreme_loss'), val: result.extremeLoss, color: 'text-red-600' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-content-tertiary">{row.label}</span>
                      <span className={`font-medium ${row.color}`}>{row.val.toLocaleString()} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-1 pb-1">
                <div className="text-xs text-content-tertiary mb-2 uppercase tracking-wide">Weight Gain</div>
                <div className="space-y-1.5">
                  {[
                    { label: t('label_mild_gain'), val: result.mildGain, color: 'text-blue-500' },
                    { label: t('label_gain'), val: result.weightGain, color: 'text-blue-600' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-content-tertiary">{row.label}</span>
                      <span className={`font-medium ${row.color}`}>{row.val.toLocaleString()} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('label_macros')}</h3>
            <MacroBar protein={result.protein_g} carbs={result.carbs_g} fat={result.fat_g} />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">{t('label_protein')}</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{result.protein_g}g</div>
                <div className="text-xs text-content-tertiary">{t('g_per_day')}</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">{t('label_carbs')}</div>
                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{result.carbs_g}g</div>
                <div className="text-xs text-content-tertiary">{t('g_per_day')}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                <div className="text-xs text-red-600 dark:text-red-400 mb-1">{t('label_fat')}</div>
                <div className="text-xl font-bold text-red-700 dark:text-red-300">{result.fat_g}g</div>
                <div className="text-xs text-content-tertiary">{t('g_per_day')}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={copyResult} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors">
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
            <button
              onClick={() => {
                if (!result) return
                void navigator.share?.({ title: 'My Calorie Target', text: `My daily calorie target: ${result.goalCalories} kcal/day (BMR: ${result.bmr})`, url: window.location.href })
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors"
            >
              ↗ Share
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors">
              ⎙ Print
            </button>
          </div>
          <ShareButtons text={`My daily calorie target: ${result.goalCalories} kcal/day — calculated free at SolviqLab`} className="mt-2" />
        </div>
      )}
    </div>
  )
}
