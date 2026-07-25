import type { QuizConfig } from '../types'

export const weightReadinessQuiz: QuizConfig = {
  slug:        'weight-readiness-quiz',
  cluster:     'weight',
  icon:        '🎯',
  title:       'Weight Loss Readiness Quiz',
  description: 'Are you actually ready to lose weight — or just hoping? Find out what\'s really in your way before you start.',
  questions: [
    {
      id:   'wr1',
      text: 'Why do you want to lose weight right now? What\'s really driving you?',
      type: 'single',
      options: [
        { value: 4, label: 'My health — I want to feel better long-term' },
        { value: 3, label: 'Energy and confidence — daily quality of life' },
        { value: 2, label: 'An upcoming event — I have a deadline' },
        { value: 1, label: 'External pressure — others want me to' },
      ],
    },
    {
      id:   'wr2',
      text: 'Have you tried to lose weight before and stopped? What happened?',
      type: 'single',
      options: [
        { value: 4, label: 'I\'ve maintained previous success well' },
        { value: 3, label: 'I\'ve lost and regained — I understand why now' },
        { value: 2, label: 'I stopped because it was too restrictive' },
        { value: 1, label: 'I stopped because I saw no results quickly' },
      ],
    },
    {
      id:   'wr3',
      text: 'Do you have a specific, realistic plan for how you\'ll eat differently?',
      type: 'yesno',
    },
    {
      id:          'wr4',
      text:        'How ready do you feel to make consistent changes — not a crash diet, but lifestyle shifts?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    10,
      scaleLabels: { min: 'Not ready at all', max: 'Completely ready' },
    },
    {
      id:   'wr5',
      text: 'How much does stress or emotion drive your eating habits?',
      type: 'single',
      options: [
        { value: 4, label: 'Very little — I eat based on hunger' },
        { value: 3, label: 'Sometimes — stressful days affect my choices' },
        { value: 2, label: 'Often — food is comfort for me' },
        { value: 1, label: 'Always — emotional eating is my pattern' },
      ],
    },
    {
      id:   'wr6',
      text: 'Do you have support — people who will encourage rather than sabotage your goals?',
      type: 'yesno',
    },
  ],
  scoring: {
    max: 26,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Ready to Start',
        description: 'You have the mindset, motivation, and awareness to make real, sustainable progress. Now it\'s about the right strategy.',
        miaHook:     'You\'re genuinely ready — not just hoping. Let me give you a personalized starting plan based on your profile.',
      },
      {
        min:         40,
        max:         69,
        label:       'Almost Ready',
        description: 'You\'re motivated but a few key pieces aren\'t in place yet. Addressing them now will make the difference between lasting change and another false start.',
        miaHook:     'I can see what\'s missing in your readiness picture — let\'s close those gaps before you begin, so this time sticks.',
      },
      {
        min:         0,
        max:         39,
        label:       'Not Quite Yet',
        description: 'Jumping in right now may lead to frustration and another stop-start cycle. Let\'s build the right foundation first.',
        miaHook:     'Starting without addressing what I see in your answers is what leads to giving up. Let\'s do this right — and only once.',
      },
    ],
  },
  seoKeywords: ['weight loss readiness quiz', 'am I ready to lose weight', 'weight loss mindset quiz', 'diet readiness test'],
}
