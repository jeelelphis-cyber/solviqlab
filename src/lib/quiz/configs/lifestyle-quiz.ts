import type { QuizConfig } from '../types'

export const lifestyleQuiz: QuizConfig = {
  slug:        'lifestyle-quiz',
  cluster:     'lifestyle',
  icon:        '🌿',
  title:       'Lifestyle Health Score Quiz',
  description: 'Get an honest snapshot of how your daily habits — sleep, movement, nutrition, stress — add up to your overall health.',
  questions: [
    {
      id:   'ls1',
      text: 'How would you describe your diet on a typical weekday?',
      type: 'single',
      options: [
        { value: 4, label: 'Mostly whole foods — I cook and plan ahead' },
        { value: 3, label: 'A mix — some healthy, some not' },
        { value: 2, label: 'Often convenient or fast — I don\'t have time' },
        { value: 1, label: 'Mostly processed — I\'m not proud of it' },
      ],
    },
    {
      id:          'ls2',
      text:        'How many days a week do you do some form of intentional physical activity?',
      type:        'scale',
      scaleMin:    0,
      scaleMax:    7,
      scaleLabels: { min: '0 days', max: '7 days' },
    },
    {
      id:   'ls3',
      text: 'How well do you sleep on most nights?',
      type: 'single',
      options: [
        { value: 4, label: 'Well — 7–9 hours, I wake up rested' },
        { value: 3, label: 'Okay — sometimes restless' },
        { value: 2, label: 'Poorly — fewer than 6 hours or disrupted' },
        { value: 1, label: 'Very poorly — it\'s a consistent problem' },
      ],
    },
    {
      id:   'ls4',
      text: 'Do you have downtime each day — time that\'s genuinely yours with no obligations?',
      type: 'yesno',
    },
    {
      id:   'ls5',
      text: 'How often do you drink alcohol or smoke?',
      type: 'single',
      options: [
        { value: 4, label: 'Never or very rarely' },
        { value: 3, label: 'Occasionally — socially' },
        { value: 2, label: 'Several times a week' },
        { value: 1, label: 'Daily' },
      ],
    },
    {
      id:   'ls6',
      text: 'When you think about your health overall, how do you feel?',
      type: 'single',
      options: [
        { value: 4, label: 'Good — I\'m mostly taking care of myself' },
        { value: 3, label: 'Okay — but I know I could do better' },
        { value: 2, label: 'Not great — I\'ve been neglecting things' },
        { value: 1, label: 'Concerned — I feel like I\'ve let myself down' },
      ],
    },
  ],
  scoring: {
    max: 26,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Strong Lifestyle Foundation',
        description: 'You\'re building good habits across the key areas. Your daily choices are working in your favor.',
        miaHook:     'You\'re doing a lot right — I want to help you identify the one area where focused attention will give you the most return.',
      },
      {
        min:         40,
        max:         69,
        label:       'Room to Grow',
        description: 'Your lifestyle has solid elements, but there are gaps that are probably costing you energy and health without you realizing it.',
        miaHook:     'I can see which specific habits are undercutting your progress — let\'s talk about prioritizing the highest-impact change.',
      },
      {
        min:         0,
        max:         39,
        label:       'Lifestyle Overhaul Needed',
        description: 'Multiple areas of your lifestyle need attention. But you don\'t have to change everything at once — one shift at a time creates lasting change.',
        miaHook:     'You\'re carrying more than you should be — your current habits are working against you in ways you might not fully see yet.',
      },
    ],
  },
  seoKeywords: ['lifestyle quiz', 'healthy lifestyle score', 'lifestyle health check', 'daily habits quiz'],
}
