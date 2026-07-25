import type { QuizConfig } from '../types'

export const anxietyQuiz: QuizConfig = {
  slug:        'anxiety-quiz',
  cluster:     'mental',
  icon:        '🌀',
  title:       'Anxiety Level Quiz',
  description: 'Understand how anxiety shows up in your life — and how much of your daily energy it\'s quietly consuming.',
  questions: [
    {
      id:   'anx1',
      text: 'How often does your mind race or spiral into "what if" thoughts you can\'t stop?',
      type: 'single',
      options: [
        { value: 4, label: 'Rarely — I can usually redirect my thoughts' },
        { value: 3, label: 'Sometimes — in stressful periods' },
        { value: 2, label: 'Often — most days it happens' },
        { value: 1, label: 'Almost constantly — it\'s exhausting' },
      ],
    },
    {
      id:   'anx2',
      text: 'Do you avoid certain situations or people because they make you anxious?',
      type: 'yesno',
    },
    {
      id:          'anx3',
      text:        'How often do you feel physically tense — chest tightness, shallow breathing, a knot in your stomach?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    5,
      scaleLabels: { min: 'Almost never', max: 'Very frequently' },
    },
    {
      id:   'anx4',
      text: 'Does worrying about the future interfere with your ability to enjoy the present?',
      type: 'yesno',
    },
    {
      id:   'anx5',
      text: 'How do you typically respond when something unexpected happens?',
      type: 'single',
      options: [
        { value: 4, label: 'Calmly — I adapt fairly well' },
        { value: 3, label: 'A little rattled, but I recover quickly' },
        { value: 2, label: 'It throws me off for a while' },
        { value: 1, label: 'It sends me into a spiral' },
      ],
    },
    {
      id:   'anx6',
      text: 'Do you find it hard to sleep because your thoughts won\'t quiet down?',
      type: 'single',
      options: [
        { value: 4, label: 'No — I sleep fine' },
        { value: 3, label: 'Occasionally — maybe once a week' },
        { value: 2, label: 'Often — a few nights a week' },
        { value: 1, label: 'Almost every night' },
      ],
    },
  ],
  scoring: {
    max: 25,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Low Anxiety',
        description: 'You\'re managing uncertainty and stress in a healthy way. Your nervous system isn\'t in chronic alarm mode.',
        miaHook:     'Your anxiety baseline is healthy — let\'s talk about keeping it that way when life gets harder.',
      },
      {
        min:         40,
        max:         69,
        label:       'Moderate Anxiety',
        description: 'Anxiety is present in your life and affecting some of your choices and enjoyment. The patterns are manageable but worth addressing.',
        miaHook:     'I noticed a few clear anxiety patterns in your answers — I have some targeted tools that can reduce this noticeably.',
      },
      {
        min:         0,
        max:         39,
        label:       'High Anxiety',
        description: 'Anxiety is significantly affecting your day-to-day life. This level of sustained alertness is tiring and worth real attention.',
        miaHook:     'What you\'re living with is real — high anxiety is exhausting and isolating. Let me show you where to start unwinding it.',
      },
    ],
  },
  seoKeywords: ['anxiety quiz', 'do I have anxiety quiz', 'anxiety level test', 'social anxiety quiz'],
}
