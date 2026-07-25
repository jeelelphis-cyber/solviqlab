import type { QuizConfig } from '../types'

export const sleepQuiz: QuizConfig = {
  slug:        'sleep-quiz',
  cluster:     'sleep',
  icon:        '🌙',
  title:       'Sleep Quality Quiz',
  description: 'Discover how well you\'re actually sleeping — and what it\'s costing you when you don\'t.',
  questions: [
    {
      id:          'sq1',
      text:        'How many hours of sleep do you usually get on a typical night?',
      type:        'scale',
      scaleMin:    3,
      scaleMax:    10,
      scaleLabels: { min: '3 hours', max: '10 hours' },
    },
    {
      id:   'sq2',
      text: 'How often do you wake up during the night?',
      type: 'single',
      options: [
        { value: 4, label: 'Almost never — I sleep straight through' },
        { value: 3, label: 'Once or twice occasionally' },
        { value: 2, label: '1–2 times most nights' },
        { value: 1, label: '3 or more times — it\'s disrupted' },
      ],
    },
    {
      id:   'sq3',
      text: 'How do you feel when you first wake up in the morning?',
      type: 'single',
      options: [
        { value: 4, label: 'Refreshed and ready to go' },
        { value: 3, label: 'A bit groggy but okay after 20 minutes' },
        { value: 2, label: 'Tired — like I need more sleep' },
        { value: 1, label: 'Exhausted — sleeping feels pointless' },
      ],
    },
    {
      id:   'sq4',
      text: 'Do you usually fall asleep within 20 minutes of getting into bed?',
      type: 'yesno',
    },
    {
      id:   'sq5',
      text: 'How often do you use your phone or watch screens in the 30 minutes before sleep?',
      type: 'single',
      options: [
        { value: 4, label: 'Never — I have a no-screen routine' },
        { value: 3, label: 'Occasionally — maybe once or twice a week' },
        { value: 2, label: 'Often — most nights' },
        { value: 1, label: 'Always — it\'s the last thing I do' },
      ],
    },
    {
      id:   'sq6',
      text: 'Do you feel sleepy or low-energy during the day, even after a full night\'s sleep?',
      type: 'yesno',
    },
  ],
  scoring: {
    max: 25,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Good Sleep',
        description: 'You\'re getting quality rest. Your sleep habits support your energy, mood, and long-term health.',
        miaHook:     'Your sleep foundation is solid — I want to show you how to make it even more restorative.',
      },
      {
        min:         40,
        max:         69,
        label:       'Needs Improvement',
        description: 'Your sleep is functional, but it\'s not fully restoring you. A few targeted changes could transform how you feel every day.',
        miaHook:     'I can see exactly where your sleep is leaking energy — let\'s fix the 1–2 things that matter most.',
      },
      {
        min:         0,
        max:         39,
        label:       'Sleep Problem',
        description: 'Your sleep patterns are likely affecting your mood, weight, focus, and immune system. This deserves real attention.',
        miaHook:     'Poor sleep affects everything else — your weight, stress, and mood. I have a 7-day reset protocol for you.',
      },
    ],
  },
  seoKeywords: ['sleep quality quiz', 'am I sleeping enough', 'sleep health quiz', 'insomnia quiz'],
}
