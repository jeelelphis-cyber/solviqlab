import type { BMIInput, BMIOutput, BMICategory } from './types.js'

// Sources:
// WHO Technical Report Series No. 854, 1995 — BMI formula
// NIH Publication 98-4083 — imperial factor 703
// Gadzik 2006 (Connecticut Medicine) — BMI Prime
// Rohrer 1921 — Ponderal Index
// Deurenberg 1991 (British Journal of Nutrition) — body fat estimate

const HEALTHY_BMI_MIN = 18.5
const HEALTHY_BMI_MAX = 24.9
const IMPERIAL_FACTOR = 703 // NIH-rounded constant (exact: 703.07)

export function convertHeightToMetric(
  input: { feet: number; inches: number } | { cm: number },
): number {
  if ('cm' in input) return input.cm
  return input.feet * 30.48 + input.inches * 2.54
}

export function convertWeightToMetric(input: { lb: number } | { kg: number }): number {
  if ('kg' in input) return input.kg
  return input.lb * 0.453592
}

export function calculateBMI(input: BMIInput): BMIOutput {
  const heightM = input.height_cm / 100
  const bmi = Number((input.weight_kg / (heightM * heightM)).toFixed(1))

  const category = getBMICategory(bmi)
  const bmiPrime = Number((bmi / 25.0).toFixed(2))
  const ponderalIndex = Number((input.weight_kg / (heightM * heightM * heightM)).toFixed(1))

  const healthyWeightMin_kg = Number((HEALTHY_BMI_MIN * heightM * heightM).toFixed(1))
  const healthyWeightMax_kg = Number((HEALTHY_BMI_MAX * heightM * heightM).toFixed(1))

  const result: BMIOutput = {
    bmi,
    category,
    bmiPrime,
    ponderalIndex,
    healthyWeightMin_kg,
    healthyWeightMax_kg,
  }

  if (input.age != null && input.sex != null && input.sex !== 'other') {
    result.bodyFatEstimate = Number(
      getDeurenbergBodyFat(bmi, input.age, input.sex).toFixed(1),
    )
  }

  return result
}

function getBMICategory(bmi: number): BMICategory {
  if (bmi < 16.0) return 'underweight_severe'
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25.0) return 'normal'
  if (bmi < 30.0) return 'overweight'
  if (bmi < 35.0) return 'obese_1'
  if (bmi < 40.0) return 'obese_2'
  return 'obese_3'
}

// Deurenberg 1991: %BF = 1.2 × BMI + 0.23 × age - 10.8 × sex - 5.4
// sex: 1 = male, 0 = female
function getDeurenbergBodyFat(bmi: number, age: number, sex: 'male' | 'female'): number {
  const sexFactor = sex === 'male' ? 1 : 0
  return 1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4
}

export function imperialToBMI(heightFt: number, heightIn: number, weightLb: number): number {
  const totalInches = heightFt * 12 + heightIn
  return Number(((IMPERIAL_FACTOR * weightLb) / (totalInches * totalInches)).toFixed(1))
}
