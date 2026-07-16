export interface SleepCalculatorInput {
  mode: 'waketime' | 'bedtime'
  targetTime: string
  fallAsleepMinutes?: number
}

export interface SleepCalculatorOutput {
  cycle4Time: string
  cycle5Time: string
  cycle6Time: string
  cycle7Time: string
  recommendation: string
}
