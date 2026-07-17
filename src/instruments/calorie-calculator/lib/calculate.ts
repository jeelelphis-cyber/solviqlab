import type { CalorieCalculatorInput, CalorieCalculatorOutput, ActivityLevel } from './types.js'

// Mifflin-St Jeor Equation (1990) — most accurate for general population per ADA
// Men:   BMR = 10W + 6.25H - 5A + 5
// Women: BMR = 10W + 6.25H - 5A - 161
// W = weight kg, H = height cm, A = age years

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,       // Little or no exercise
  light: 1.375,         // Light exercise 1-3 days/week
  moderate: 1.55,       // Moderate exercise 3-5 days/week
  active: 1.725,        // Hard exercise 6-7 days/week
  very_active: 1.9,     // Very hard exercise + physical job
}

export function convertLbToKg(lb: number): number {
  return lb * 0.453592
}

export function convertInchesToCm(inches: number): number {
  return inches * 2.54
}

export function convertFtInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54
}

export function calculateCalories(input: CalorieCalculatorInput): CalorieCalculatorOutput {
  const { weight_kg, height_cm, age, sex, activityLevel, goal = 'maintain' } = input

  if (weight_kg < 20 || weight_kg > 300) throw new Error('Weight must be between 20 and 300 kg.')
  if (height_cm < 100 || height_cm > 250) throw new Error('Height must be between 100 and 250 cm.')
  if (age < 15 || age > 100) throw new Error('Age must be between 15 and 100.')

  const bmr = sex === 'male'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

  const maintenance = bmr * ACTIVITY_MULTIPLIERS[activityLevel]

  // Weight loss/gain targets (500 kcal ≈ 0.5 kg/week)
  const mildLoss = maintenance - 250
  const weightLoss = maintenance - 500
  const extremeLoss = Math.max(maintenance - 1000, 1200) // Never below 1200 kcal
  const mildGain = maintenance + 250
  const weightGain = maintenance + 500

  // Goal-based calorie target
  const goalCalories =
    goal === 'lose' ? weightLoss
    : goal === 'gain' ? weightGain
    : maintenance

  // Macros based on goal calories
  // Protein: 2.0g per kg bodyweight (high protein for satiety/muscle)
  // Fat: 25% of goal calories
  // Carbs: remainder
  const protein_g = Math.round(weight_kg * 2.0)
  const fat_g = Math.round((goalCalories * 0.25) / 9)
  const carbs_g = Math.round((goalCalories - protein_g * 4 - fat_g * 9) / 4)

  const round = (n: number) => Math.round(n)

  return {
    bmr: round(bmr),
    maintenance: round(maintenance),
    mildLoss: round(mildLoss),
    weightLoss: round(weightLoss),
    extremeLoss: round(extremeLoss),
    mildGain: round(mildGain),
    weightGain: round(weightGain),
    protein_g,
    carbs_g: Math.max(carbs_g, 0),
    fat_g,
    goalCalories: round(goalCalories),
  }
}
