export type PercentageMode =
  | 'percent-of'       // What is X% of Y?        → (X/100) * Y
  | 'is-what-percent'  // X is what % of Y?        → (X/Y) * 100
  | 'percent-change'   // % change from X to Y?    → ((Y-X)/X) * 100
  | 'percent-adjust'   // X increased/decreased by Y%? → X * (1 ± Y/100)

export type PercentageDirection = 'increase' | 'decrease'

export interface PercentageCalculatorInput {
  mode: PercentageMode
  a: number
  b: number
  direction?: PercentageDirection  // only for 'percent-adjust' mode
}

export interface PercentageCalculatorOutput {
  result: number
  mode: PercentageMode
  a: number
  b: number
  direction: PercentageDirection | null
  isIncrease: boolean | null  // for percent-change; null for other modes
  roundedResult: number       // result rounded to 2 decimal places
}

export type PercentageCalculatorBucket =
  | 'tiny'    // 0–1%
  | 'small'   // 1–10%
  | 'medium'  // 10–50%
  | 'large'   // 50–100%
  | 'massive' // >100%

export function getPercentageBucket(pct: number): PercentageCalculatorBucket {
  const abs = Math.abs(pct)
  if (abs <= 1) return 'tiny'
  if (abs <= 10) return 'small'
  if (abs <= 50) return 'medium'
  if (abs <= 100) return 'large'
  return 'massive'
}
