import { defineInstrument } from '../../../../lib/catalog'

export default defineInstrument({
  slug: 'bmr-calculator',
  name: 'BMR Calculator',
  type: 'calculator',
  capability: 'health',
  cluster: 'weight',
  emits: ['solviqlab:result'],
  requiredInputs: ['weight', 'height', 'age', 'gender'],
  profileSignals: [
    {
      domain: 'metabolism',
      metric: 'bmr_kcal',
      confidence_contribution: 45,
    },
  ],
  journeyStep: {
    journeyId: 'weight-management',
    nextSlug: 'tdee-calculator',
    nextName: 'TDEE Calculator',
  },
})
