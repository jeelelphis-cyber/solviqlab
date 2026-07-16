import type { AreaCalculatorInput, AreaCalculatorOutput } from './types.js'

export function calculateAreaCalculator(input: AreaCalculatorInput): AreaCalculatorOutput {
  const { shape, a, b, h } = input
  const bVal = b ?? a
  const hVal = h ?? bVal

  let area: number, perimeter: number

  if (shape === 'rectangle') {
    area = a * bVal
    perimeter = 2 * (a + bVal)
  } else if (shape === 'square') {
    area = a * a
    perimeter = 4 * a
  } else if (shape === 'circle') {
    area = Math.PI * a * a
    perimeter = 2 * Math.PI * a
  } else if (shape === 'triangle') {
    // base=a, height=b for area; perimeter needs all 3 sides — not computable with 2 inputs
    area = 0.5 * a * bVal
    perimeter = 0
  } else if (shape === 'trapezoid') {
    // parallel sides: a (top) and b (bottom), height: h
    area = 0.5 * (a + bVal) * hVal
    perimeter = 0
  } else {
    // ellipse: semi-axes a and b
    area = Math.PI * a * bVal
    perimeter = 0
  }

  const r = (v: number) => Math.round(v * 10000) / 10000
  return { area: r(area), perimeter: r(perimeter) }
}
