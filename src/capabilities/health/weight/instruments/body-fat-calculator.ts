import { defineInstrument } from '../../../../lib/catalog'

export default defineInstrument({
  slug: 'body-fat-calculator',
  name: 'Body Fat Calculator',
  type: 'calculator',
  capability: 'health',
  cluster: 'weight',
  emits: ['solviqlab:result'],
  requiredInputs: ['weight', 'height', 'age', 'gender'],
  profileSignals: [
    {
      domain: 'fitness',
      metric: 'body_fat_percent',
      confidence_contribution: 55,
      status_map: {
        'Essential Fat': 'warning', 'Athletes': 'optimal', 'Fitness': 'optimal',
        'Average': 'normal', 'Obese': 'critical',
      },
    },
  ],
  journeyStep: {
    journeyId: 'weight-management',
    nextSlug: 'bmr-calculator',
    nextName: 'BMR Calculator',
  },
})
