import type { GraphMapper, InstrumentResult } from '../types'
import type { GraphUpdater } from '../../graph/updater'

function bmiToScore(bmi: number): number {
  if (bmi >= 18.5 && bmi < 25)  return Math.round(100 - (bmi - 21.7) ** 2 * 0.8)
  if (bmi >= 25   && bmi < 30)  return Math.round(75 - (bmi - 25) * 5)
  if (bmi >= 30   && bmi < 35)  return Math.round(50 - (bmi - 30) * 4)
  if (bmi >= 35)                 return Math.max(10, Math.round(30 - (bmi - 35) * 3))
  if (bmi >= 17   && bmi < 18.5) return Math.round(65 + (bmi - 17) * 10)
  return Math.max(10, Math.round(50 + bmi))
}

export class BMIGraphMapper implements GraphMapper {
  readonly cluster = 'weight'

  map(result: InstrumentResult, userId: string, updater: GraphUpdater): void {
    const meta  = result.metadata
    const bmi   = typeof meta['bmi'] === 'number' ? meta['bmi'] : result.value
    const score = Math.min(100, Math.max(0, bmiToScore(bmi)))

    updater.upsertAssessment(userId, {
      clusterId:  'weight',
      score,
      confidence: 'established',
      assessedAt: new Date().toISOString(),
    })

    const category = typeof meta['category'] === 'string' ? meta['category'] : null
    if (category && category !== 'normal') {
      updater.addMemoryFact(userId, {
        id:         'bmi-category',
        text:       `BMI ${(bmi as number).toFixed(1)} — ${category}`,
        category:   'fact',
        importance: score < 60 ? 'high' : 'medium',
        addedAt:    new Date().toISOString(),
      })
    }
  }
}

function bodyFatToScore(pct: number, sex: string): number {
  const [optMin, optMax] = sex === 'female' ? [20, 32] : [8, 20]
  if (pct >= optMin && pct <= optMax) return 85
  if (pct < optMin) return Math.max(30, 85 - (optMin - pct) * 4)
  return Math.max(20, 85 - (pct - optMax) * 3)
}

export class BodyFatGraphMapper implements GraphMapper {
  readonly cluster = 'weight'

  map(result: InstrumentResult, userId: string, updater: GraphUpdater): void {
    const meta  = result.metadata
    const pct   = typeof meta['bodyFatPercentage'] === 'number' ? meta['bodyFatPercentage'] : result.value
    const sex   = typeof meta['sex'] === 'string' ? meta['sex'] : 'male'
    const score = Math.min(100, Math.max(0, bodyFatToScore(pct as number, sex)))

    updater.upsertAssessment(userId, {
      clusterId:  'weight',
      score,
      confidence: 'established',
      assessedAt: new Date().toISOString(),
    })
  }
}

export class TDEEGraphMapper implements GraphMapper {
  readonly cluster = 'weight'

  map(result: InstrumentResult, userId: string, updater: GraphUpdater): void {
    const meta          = result.metadata
    const tdee          = typeof meta['tdee'] === 'number' ? meta['tdee'] : result.value
    const activityLevel = typeof meta['activityLevel'] === 'string' ? meta['activityLevel'] : null
    if (!activityLevel) return

    updater.addMemoryFact(userId, {
      id:         'activity-level',
      text:       `Daily energy expenditure: ${Math.round(tdee as number)} kcal (${activityLevel})`,
      category:   'fact',
      importance: 'medium',
      addedAt:    new Date().toISOString(),
    })
  }
}

export class IdealWeightGraphMapper implements GraphMapper {
  readonly cluster = 'weight'

  map(result: InstrumentResult, userId: string, updater: GraphUpdater): void {
    const meta   = result.metadata
    const target = typeof meta['idealWeight_kg'] === 'number' ? meta['idealWeight_kg'] : null
    if (!target) return

    updater.addMemoryFact(userId, {
      id:         'ideal-weight-target',
      text:       `Target weight: ${(target as number).toFixed(1)} kg`,
      category:   'fact',
      importance: 'high',
      addedAt:    new Date().toISOString(),
    })
  }
}
