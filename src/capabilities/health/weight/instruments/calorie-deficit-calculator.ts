import { defineInstrument } from '../../../../lib/catalog'

export default defineInstrument({
  slug: 'calorie-deficit-calculator',
  name: 'Calorie Deficit Calculator',
  type: 'calculator',
  capability: 'health',
  cluster: 'weight',
  emits: ['solviqlab:result'],
  requiredInputs: ['current_calories', 'tdee'],
  profileSignals: [
    { domain: 'nutrition', metric: 'calorie_deficit_kcal', confidence_contribution: 30 },
    { domain: 'weight', metric: 'weight_loss_plan', confidence_contribution: 20 },
  ],
  journeyStep: {
    journeyId: 'weight-management',
    nextSlug: 'ideal-weight-calculator',
    nextName: 'Ideal Weight Calculator',
  },
  triggersAssessmentFor: 'weight',
})
