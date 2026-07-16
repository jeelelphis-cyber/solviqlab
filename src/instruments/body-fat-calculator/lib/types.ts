export interface BodyFatCalculatorInput {
  height: number
  neck: number
  waist: number
  hip?: number
  sex: 'male' | 'female'
  weight?: number  // kg — optional, enables fatMass/leanMass outputs
}

export interface BodyFatCalculatorOutput {
  bodyFat: number
  fatMass: number | null   // null when weight not provided
  leanMass: number | null  // null when weight not provided
  category: string
}
