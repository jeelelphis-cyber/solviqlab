import type { IntentState } from '@/lib/domain/intent-state'
import { JourneyBadge }     from '@/components/journey/JourneyBadge'
import { getJourneyCopy }   from '@/components/journey/journey-copy'
import { greeting, heroSubStatement } from './dashboard-copy'

interface Props {
  readonly intent: IntentState
  readonly lang: string
}

export function DashboardHero({ intent, lang }: Props) {
  const { currentPhase, completedInstruments } = intent
  const count = completedInstruments.length
  const copy = getJourneyCopy(lang)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-[26px] font-bold text-slate-900 dark:text-white leading-tight">
          {greeting(lang)}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {heroSubStatement(intent, lang)}
        </p>
      </div>

      <JourneyBadge
        phase={currentPhase}
        label={copy.phaseLabel[currentPhase]}
        stepsLabel={copy.stepsCompleted(count)}
      />
    </div>
  )
}
