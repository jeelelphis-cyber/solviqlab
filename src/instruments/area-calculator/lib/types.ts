export interface AreaCalculatorInput {
  shape: 'rectangle' | 'square' | 'circle' | 'triangle' | 'trapezoid' | 'ellipse'
  a: number   // primary dimension (width, radius, base, semi-axis)
  b?: number  // secondary dimension (height, second base, semi-axis)
  h?: number  // height — required for trapezoid (parallel sides = a, b; height = h)
}

export interface AreaCalculatorOutput {
  area: number
  perimeter: number
}
