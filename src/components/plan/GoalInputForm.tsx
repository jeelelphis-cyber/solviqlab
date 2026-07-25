'use client'

import { useState } from 'react'
import type { StrategyDecision } from '@/lib/domain/strategy-decision'

interface Props {
  readonly cluster: string
  readonly strategy: StrategyDecision
  readonly lang: string
  readonly suggestedGoal: number | null
  readonly onGoalSet: (goalValue: number) => void
}

const CLUSTER_CONFIG: Record<string, {
  label: string
  unit: string
  placeholder: string
  min: number
  max: number
  hint: string
}> = {
  weight: {
    label:       'Target weight',
    unit:        'kg',
    placeholder: 'e.g. 74',
    min:         40,
    max:         200,
    hint:        'Your goal weight in kilograms. We recommend a target that gives you a healthy BMI.',
  },
  sleep: {
    label:       'Target sleep duration',
    unit:        'hours/night',
    placeholder: 'e.g. 8',
    min:         5,
    max:         12,
    hint:        'Adults need 7–9 hours. Set a realistic target.',
  },
}

export function GoalInputForm({ cluster, strategy, lang, suggestedGoal, onGoalSet }: Props) {
  const config  = CLUSTER_CONFIG[cluster] ?? CLUSTER_CONFIG['weight']!
  const [value, setValue] = useState(suggestedGoal !== null ? String(suggestedGoal) : '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(value)
    if (isNaN(n) || n < config.min || n > config.max) {
      setError(`Please enter a value between ${config.min} and ${config.max}`)
      return
    }
    setError(null)
    onGoalSet(n)
  }

  return (
    <div className="space-y-8">
      {/* Strategy banner */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-5">
        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-widest mb-1">
          Strategy Selected
        </div>
        <div className="text-lg font-bold text-slate-900 dark:text-white">
          {strategy.selected_strategy_name}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          {strategy.available_strategies.length} strategy evaluated
          {strategy.disqualified_strategies.length > 0 && (
            <> · {strategy.disqualified_strategies.length} disqualified</>
          )}
        </div>
      </div>

      {/* Goal input */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Make the plan yours.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">
            {suggestedGoal !== null
              ? `Based on your profile, ${suggestedGoal} ${config.unit} is a realistic first milestone. You can change it anytime.`
              : config.hint}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {config.label}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={config.placeholder}
                min={config.min}
                max={config.max}
                step="0.1"
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5
                           bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                {config.unit}
              </span>
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl
                       hover:bg-blue-700 transition-colors"
          >
            Build My Plan →
          </button>
        </form>
      </div>
    </div>
  )
}
