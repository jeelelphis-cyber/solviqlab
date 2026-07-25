import type { GraphMapper, InstrumentResult } from '../types'
import type { GraphUpdater } from '../../graph/updater'

function sleepHoursToScore(hours: number): number {
  if (hours >= 7 && hours <= 9)  return Math.round(85 + (8 - Math.abs(hours - 8)) * 7.5)
  if (hours >= 6 && hours < 7)   return Math.round(65 + (hours - 6) * 20)
  if (hours > 9  && hours <= 10) return Math.round(80 - (hours - 9) * 20)
  if (hours < 6)                  return Math.max(15, Math.round(50 + hours * 5))
  return Math.max(10, Math.round(60 - (hours - 10) * 10))
}

export class SleepGraphMapper implements GraphMapper {
  readonly cluster = 'sleep'

  map(result: InstrumentResult, userId: string, updater: GraphUpdater): void {
    const meta  = result.metadata
    const hours = typeof meta['sleepDuration'] === 'number' ? meta['sleepDuration']
                : typeof meta['hours']         === 'number' ? meta['hours']
                : result.value
    const score = Math.min(100, Math.max(0, sleepHoursToScore(hours as number)))

    updater.upsertAssessment(userId, {
      clusterId:  'sleep',
      score,
      confidence: 'established',
      assessedAt: new Date().toISOString(),
    })

    if (score < 60) {
      updater.addMemoryFact(userId, {
        id:         'sleep-issue',
        text:       `Getting ${(hours as number).toFixed(1)}h of sleep — below optimal`,
        category:   'fact',
        importance: 'high',
        addedAt:    new Date().toISOString(),
      })
    }
  }
}
