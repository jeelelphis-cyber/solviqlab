'use client'

import { useState } from 'react'
import type { UserGraph } from '@/lib/graph/types'
import { GraphRepository }      from '@/lib/graph/repository'
import { GraphUpdater }         from '@/lib/graph/updater'
import { LocalStorageProvider } from '@/lib/user/storage'

interface Props {
  userId:  string
  onDone:  (name: string, graph: UserGraph) => void
}

const GOALS = [
  { value: 'lose_weight',   label: 'Lose weight' },
  { value: 'build_muscle',  label: 'Build muscle' },
  { value: 'sleep_better',  label: 'Sleep better' },
  { value: 'boost_energy',  label: 'Boost energy' },
  { value: 'reduce_stress', label: 'Reduce stress' },
]

export function MiaOnboarding({ userId, onDone }: Props) {
  const [step, setStep]       = useState<'name' | 'goal'>('name')
  const [name, setName]       = useState('')
  const [goal, setGoal]       = useState('')
  const [loading, setLoading] = useState(false)

  const nameValid = name.trim().length >= 2

  function handleNameNext() {
    if (!nameValid) return
    setStep('goal')
  }

  async function handleGoalSelect(selectedGoal: string) {
    setGoal(selectedGoal)
    setLoading(true)

    const repo    = new GraphRepository(new LocalStorageProvider())
    const updater = new GraphUpdater(repo)

    updater.setName(userId, name.trim())
    updater.upsertGoal(userId, {
      id:       `goal-${selectedGoal}`,
      text:     GOALS.find(g => g.value === selectedGoal)?.label ?? selectedGoal,
      status:   'active',
      priority: 'high',
      addedAt:  new Date().toISOString(),
    })

    const graph = repo.get(userId)!
    onDone(name.trim(), graph)
  }

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-4 max-w-md mx-auto">
      {/* Mia avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          M
        </div>
        <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest">
          Mia — your health coach
        </p>
      </div>

      {step === 'name' && (
        <div className="w-full space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              What should I call you?
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              I'll use your first name when we talk.
            </p>
          </div>

          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNameNext()}
            placeholder="First name"
            autoFocus
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4 text-center text-lg text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <button
            onClick={handleNameNext}
            disabled={!nameValid}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-3.5 disabled:opacity-30 hover:opacity-90 transition-opacity"
          >
            That's me →
          </button>
        </div>
      )}

      {step === 'goal' && (
        <div className="w-full space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {name}, what's your main focus right now?
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              One thing. I'll build everything around it.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => handleGoalSelect(g.value)}
                disabled={loading}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3.5 text-sm text-left text-gray-700 dark:text-gray-300 font-medium hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-all disabled:opacity-50"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
