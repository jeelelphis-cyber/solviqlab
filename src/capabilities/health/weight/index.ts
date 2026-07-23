import { CapabilityCatalog } from '../../../lib/catalog'
import bmiCalculator from './instruments/bmi-calculator'
import bodyFatCalculator from './instruments/body-fat-calculator'
import bmrCalculator from './instruments/bmr-calculator'
import tdeeCalculator from './instruments/tdee-calculator'
import calorieDeficitCalculator from './instruments/calorie-deficit-calculator'
import idealWeightCalculator from './instruments/ideal-weight-calculator'
import weightAssessment from './instruments/weight-assessment'

// Registers all weight cluster instruments into the CapabilityCatalog.
// Called once at app startup (from src/capabilities/index.ts).
export function registerWeightCluster(): void {
  CapabilityCatalog.registerMany([
    bmiCalculator,
    bodyFatCalculator,
    bmrCalculator,
    tdeeCalculator,
    calorieDeficitCalculator,
    idealWeightCalculator,
    weightAssessment,
  ])
}
