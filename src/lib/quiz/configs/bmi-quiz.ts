import type { QuizConfig } from '../types'

export const bmiQuiz: QuizConfig = {
  slug:        'bmi-quiz',
  cluster:     'weight',
  icon:        '⚖️',
  title:       'BMI & Weight Health Quiz',
  description: 'Find out how your current weight, habits, and lifestyle affect your health — in 5 honest questions.',
  questions: [
    {
      id:   'bq1',
      text: 'How would you describe your current weight compared to what feels right for your body?',
      type: 'single',
      options: [
        { value: 4, label: 'About right — I feel comfortable' },
        { value: 3, label: 'Slightly off — a few kilos either way' },
        { value: 2, label: 'Noticeably above or below where I want to be' },
        { value: 1, label: 'Far from where I need to be' },
      ],
    },
    {
      id:   'bq2',
      text: 'How often do you move your body in a way that gets your heart rate up?',
      type: 'single',
      options: [
        { value: 4, label: 'Most days — it\'s part of my routine' },
        { value: 3, label: '2–3 times a week' },
        { value: 2, label: 'Once a week or less' },
        { value: 1, label: 'Rarely or never' },
      ],
    },
    {
      id:          'bq3',
      text:        'How balanced is your typical daily diet?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    5,
      scaleLabels: { min: 'Mostly processed', max: 'Mostly whole foods' },
    },
    {
      id:   'bq4',
      text: 'Do you tend to eat when stressed or bored, even when you\'re not hungry?',
      type: 'yesno',
    },
    {
      id:   'bq5',
      text: 'How often do you track or think about what you eat?',
      type: 'single',
      options: [
        { value: 4, label: 'Regularly — I\'m mindful of my choices' },
        { value: 3, label: 'Sometimes — when I remember' },
        { value: 2, label: 'Rarely — I eat without thinking' },
        { value: 1, label: 'Never tracked it' },
      ],
    },
    {
      id:   'bq6',
      text: 'How would you rate your energy levels throughout the day?',
      type: 'single',
      options: [
        { value: 4, label: 'Steady — I feel good most of the day' },
        { value: 3, label: 'Variable — highs and lows' },
        { value: 2, label: 'Often tired, especially afternoons' },
        { value: 1, label: 'Exhausted most of the time' },
      ],
    },
  ],
  scoring: {
    max: 25,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Healthy Weight Zone',
        description: 'Your habits suggest you\'re in a good place. Small, consistent tweaks can keep you there long-term.',
        miaHook:     'Your score shows solid foundations — I want to build on what\'s already working for you.',
      },
      {
        min:         40,
        max:         69,
        label:       'Room to Improve',
        description: 'You\'re aware of your health, but a few key habits are holding you back. The good news: small changes make a big difference.',
        miaHook:     'I can see 2–3 specific things that, if changed, would shift your weight trend within 4 weeks.',
      },
      {
        min:         0,
        max:         39,
        label:       'Needs Attention',
        description: 'Your current patterns may be working against your health goals. But awareness is the first step, and you\'re already here.',
        miaHook:     'I\'ve seen people in your exact situation turn things around completely — let me show you where to start.',
      },
    ],
  },
  seoKeywords: ['bmi quiz', 'weight health quiz', 'am I a healthy weight', 'bmi check quiz'],
}
