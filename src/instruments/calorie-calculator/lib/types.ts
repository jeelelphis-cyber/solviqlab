export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'lose' | 'maintain' | 'gain'
export type UnitSystem = 'metric' | 'imperial'

export interface CalorieCalculatorInput {
  weight_kg: number
  height_cm: number
  age: number
  sex: 'male' | 'female'
  activityLevel: ActivityLevel
  goal?: Goal
  unitSystem?: UnitSystem
}

export interface CalorieCalculatorOutput {
  bmr: number
  maintenance: number
  mildLoss: number
  weightLoss: number
  extremeLoss: number
  mildGain: number
  weightGain: number
  protein_g: number
  carbs_g: number
  fat_g: number
  goalCalories: number
}
