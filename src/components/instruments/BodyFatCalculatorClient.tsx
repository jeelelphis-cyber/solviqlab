'use client'
import { useState } from 'react'
import { calculateBodyFatCalculator } from '../../instruments/body-fat-calculator/lib/calculate.js'
import type { BodyFatCalculatorOutput } from '../../instruments/body-fat-calculator/lib/types.js'
import { ShareButtons } from '../ShareButtons.js'
interface Props {
  translations: Record<string, unknown>
  lang: string
}

export function BodyFatCalculatorClient({ translations }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [sex, setSex] = useState('male')
  const [result, setResult] = useState<BodyFatCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  function calculate() {
    try {
      const input = {
        height: parseFloat(height),
        neck: parseFloat(neck),
        waist: parseFloat(waist),
        sex: sex as 'male' | 'female',
        ...(hip ? { hip: parseFloat(hip) } : {}),
        ...(weight ? { weight: parseFloat(weight) } : {}),
      }
      setResult(calculateBodyFatCalculator(input))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setHeight(''); setWeight(''); setNeck(''); setWaist(''); setHip(''); setSex('male')
    setResult(null); setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_height') ?? 'Height'} <span className="text-content-tertiary">(cm)</span>
          </label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} min={100} max={250}
            placeholder="e.g. 177"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_weight') ?? 'Weight (optional)'} <span className="text-content-tertiary">(kg)</span>
          </label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} min={30} max={300}
            placeholder="e.g. 80"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_neck') ?? 'Neck Circumference'} <span className="text-content-tertiary">(cm)</span>
          </label>
          <input type="number" value={neck} onChange={e => setNeck(e.target.value)} min={20} max={80}
            placeholder="e.g. 37"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_waist') ?? 'Waist Circumference'} <span className="text-content-tertiary">(cm)</span>
          </label>
          <input type="number" value={waist} onChange={e => setWaist(e.target.value)} min={40} max={200}
            placeholder="e.g. 81"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_hip') ?? 'Hip Circumference'} <span className="text-content-tertiary">(cm, {t('label_women_only') ?? 'women only'})</span>
          </label>
          <input type="number" value={hip} onChange={e => setHip(e.target.value)} min={40} max={200}
            placeholder="e.g. 95"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">{t('label_sex') ?? 'Sex'}</label>
          <select value={sex} onChange={e => setSex(e.target.value)}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary">
            <option value="male">{t('opt_male') ?? 'Male'}</option>
            <option value="female">{t('opt_female') ?? 'Female'}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={calculate}
          className="flex-1 bg-accent-primary hover:bg-accent-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
          {t('calculate') ?? 'Calculate'}
        </button>
        <button onClick={reset}
          className="px-4 py-2.5 border border-border-default text-content-secondary hover:text-content-primary hover:border-border-hover rounded-lg transition-colors">
          {t('reset') ?? 'Reset'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-surface-card border border-border-default rounded-xl p-5">
          <h3 className="text-sm font-medium text-content-secondary mb-4">{t('result') ?? 'Result'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-elevated rounded-lg p-3">
              <div className="text-xs text-content-tertiary mb-1">{t('label_bodyFat') ?? 'Body Fat'}</div>
              <div className="text-lg font-semibold text-content-primary">
                {result.bodyFat}<span className="text-sm text-content-secondary"> %</span>
              </div>
            </div>
            <div className="bg-surface-elevated rounded-lg p-3">
              <div className="text-xs text-content-tertiary mb-1">{t('label_category') ?? 'Category'}</div>
              <div className="text-lg font-semibold text-content-primary">{result.category}</div>
            </div>
            {result.fatMass != null && (
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_fatMass') ?? 'Fat Mass'}</div>
                <div className="text-lg font-semibold text-content-primary">
                  {result.fatMass}<span className="text-sm text-content-secondary"> kg</span>
                </div>
              </div>
            )}
            {result.leanMass != null && (
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_leanMass') ?? 'Lean Mass'}</div>
                <div className="text-lg font-semibold text-content-primary">
                  {result.leanMass}<span className="text-sm text-content-secondary"> kg</span>
                </div>
              </div>
            )}
          </div>
          <ShareButtons text={`My body fat: ${result.bodyFat}% (${result.category}) — calculated free at SolviqLab`} className="mt-4" />
        </div>
      )}
    </div>
  )
}
