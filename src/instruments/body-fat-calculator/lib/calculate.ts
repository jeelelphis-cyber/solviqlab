import type { BodyFatCalculatorInput, BodyFatCalculatorOutput } from './types.js'

// US Navy Method — Hodgdon & Beckett, 1984
// ACE body fat percentage categories (sex-specific)
// Male:   Essential <6%, Athletic 6-13%, Fitness 14-17%, Average 18-24%, Obese 25%+
// Female: Essential <14%, Athletic 14-20%, Fitness 21-24%, Average 25-31%, Obese 32%+

export function calculateBodyFatCalculator(input: BodyFatCalculatorInput): BodyFatCalculatorOutput {
  const { height, neck, waist, hip, sex, weight } = input

  let bodyFat: number
  if (sex === 'male') {
    bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450
  } else {
    const hipVal = hip ?? waist * 0.9
    bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hipVal - neck) + 0.22100 * Math.log10(height)) - 450
  }
  bodyFat = Math.max(3, Math.min(60, Math.round(bodyFat * 10) / 10))

  // Sex-specific ACE categories
  let category: string
  if (sex === 'male') {
    category = bodyFat < 6 ? 'Essential Fat'
      : bodyFat < 14 ? 'Athletic'
      : bodyFat < 18 ? 'Fitness'
      : bodyFat < 25 ? 'Average'
      : 'Obese'
  } else {
    category = bodyFat < 14 ? 'Essential Fat'
      : bodyFat < 21 ? 'Athletic'
      : bodyFat < 25 ? 'Fitness'
      : bodyFat < 32 ? 'Average'
      : 'Obese'
  }

  const fatMass = weight != null ? Math.round(weight * bodyFat / 100 * 10) / 10 : null
  const leanMass = weight != null && fatMass != null ? Math.round((weight - fatMass) * 10) / 10 : null

  return { bodyFat, fatMass, leanMass, category }
}
