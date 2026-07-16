export const BMI_META = {
  slug: 'bmi-calculator',
  id: 'bmi-v1',
  type: 'calculator',
  category: 'health',
  vertical: 'health',
  isYMYL: true,
  supportedLanguages: ['en', 'es', 'pt'],
  version: '1.0.0',
} as const

export type UnitSystem = 'metric' | 'imperial'

export interface BMIInput {
  height_cm: number
  weight_kg: number
  age?: number | null
  sex?: 'male' | 'female' | 'other' | null
  unitSystem: UnitSystem
}

export type BMICategory =
  | 'underweight_severe'
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese_1'
  | 'obese_2'
  | 'obese_3'

export interface BMIOutput {
  bmi: number
  category: BMICategory
  bmiPrime: number
  ponderalIndex: number
  healthyWeightMin_kg: number
  healthyWeightMax_kg: number
  bodyFatEstimate?: number
}

// Bucket for analytics — never store exact BMI values (privacy)
export type BMIBucket = '< 16' | '16-18' | '18-20' | '20-22' | '22-25' | '25-28' | '28-32' | '32+'

export function getBMIBucket(bmi: number): BMIBucket {
  if (bmi < 16) return '< 16'
  if (bmi < 18) return '16-18'
  if (bmi < 20) return '18-20'
  if (bmi < 22) return '20-22'
  if (bmi < 25) return '22-25'
  if (bmi < 28) return '25-28'
  if (bmi < 32) return '28-32'
  return '32+'
}
