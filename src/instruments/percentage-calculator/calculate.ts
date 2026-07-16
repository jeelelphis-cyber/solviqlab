import type { PercentageCalculatorInput, PercentageCalculatorOutput } from './types.js'

// Sources: standard arithmetic percentage formulas (no authority required — pure math)

export function calculatePercentageCalculator(input: PercentageCalculatorInput): PercentageCalculatorOutput {
  const { mode, a, b, direction } = input
  let result: number

  switch (mode) {
    case 'percent-of':
      // What is A% of B? → (A / 100) * B
      result = (a / 100) * b
      break

    case 'is-what-percent':
      // A is what % of B? → (A / B) * 100
      result = (a / b) * 100
      break

    case 'percent-change':
      // % change from A to B? → ((B - A) / |A|) * 100
      result = ((b - a) / Math.abs(a)) * 100
      break

    case 'percent-adjust':
      // A increased/decreased by B%?
      result = direction === 'decrease'
        ? a * (1 - b / 100)
        : a * (1 + b / 100)
      break

    default:
      result = 0
  }

  return {
    result,
    mode,
    a,
    b,
    direction: direction ?? null,
    isIncrease: mode === 'percent-change' ? result >= 0 : null,
    roundedResult: Math.round(result * 100) / 100,
  }
}
