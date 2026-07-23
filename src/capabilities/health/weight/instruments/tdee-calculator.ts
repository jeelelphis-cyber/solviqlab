import { defineInstrument } from '../../../../lib/catalog'

export default defineInstrument({
  slug: 'tdee-calculator',
  name: 'TDEE Calculator',
  type: 'calculator',
  capability: 'health',
  cluster: 'weight',
  emits: ['solviqlab:result'],
  requiredInputs: ['weight', 'height', 'age', 'gender', 'activity_level'],
  profileSignals: [
    { domain: 'metabolism', metric: 'tdee_kcal', confidence_contribution: 55 },
    { domain: 'nutrition', metric: 'daily_target_kcal', confidence_contribution: 25 },
    { domain: 'lifestyle', metric: 'activity_level', confidence_contribution: 20 },
  ],
  journeyStep: {
    journeyId: 'weight-management',
    nextSlug: 'calorie-deficit-calculator',
    nextName: 'Calorie Deficit Calculator',
  },
})
