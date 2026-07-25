import type { QuizConfig } from '../types'

export const depressionQuiz: QuizConfig = {
  slug:        'depression-quiz',
  cluster:     'mental',
  icon:        '💙',
  title:       'Mood & Low Mood Quiz',
  description: 'Not a diagnosis — a mirror. Understand how your mood patterns have been affecting your daily life.',
  questions: [
    {
      id:   'dep1',
      text: 'Over the past two weeks, how often have you felt down, hopeless, or empty?',
      type: 'single',
      options: [
        { value: 4, label: 'Not at all — I\'ve been feeling okay' },
        { value: 3, label: 'A few days — it passed' },
        { value: 2, label: 'More than half the days' },
        { value: 1, label: 'Nearly every day' },
      ],
    },
    {
      id:   'dep2',
      text: 'Have you lost interest in activities that usually bring you joy?',
      type: 'yesno',
    },
    {
      id:          'dep3',
      text:        'How has your energy been lately — not physically tired, but emotionally flat?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    5,
      scaleLabels: { min: 'Very flat, grey', max: 'Vibrant, alive' },
    },
    {
      id:   'dep4',
      text: 'Have you been withdrawing from people or avoiding social situations more than usual?',
      type: 'yesno',
    },
    {
      id:   'dep5',
      text: 'How would you describe your ability to concentrate or make decisions lately?',
      type: 'single',
      options: [
        { value: 4, label: 'Sharp — no change from normal' },
        { value: 3, label: 'Slightly foggy sometimes' },
        { value: 2, label: 'Noticeably harder — I\'m slower' },
        { value: 1, label: 'Very difficult — I can\'t think straight' },
      ],
    },
    {
      id:   'dep6',
      text: 'When things go wrong, how long does it take you to bounce back emotionally?',
      type: 'single',
      options: [
        { value: 4, label: 'A few hours — I move on fairly quickly' },
        { value: 3, label: 'A day or two' },
        { value: 2, label: 'Several days — it lingers' },
        { value: 1, label: 'Weeks — it doesn\'t really leave' },
      ],
    },
  ],
  scoring: {
    max: 25,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Emotionally Resilient',
        description: 'Your mood and emotional health look stable. You\'re bouncing back from life\'s difficulties at a healthy rate.',
        miaHook:     'Your emotional resilience is real — I want to help you protect and build on it.',
      },
      {
        min:         40,
        max:         69,
        label:       'Low Mood Patterns',
        description: 'You\'re experiencing some low mood that\'s affecting daily life. This is common — and there are effective, proven strategies to shift it.',
        miaHook:     'What you\'re describing is something I see often — and there are specific things that help. Let me walk you through them.',
      },
      {
        min:         0,
        max:         39,
        label:       'Significant Low Mood',
        description: 'Your answers reflect sustained low mood that deserves real support — not just willpower. Please consider speaking with a professional alongside using these tools.',
        miaHook:     'I hear what your answers are telling me. You\'re not weak — you\'re struggling, and that deserves proper support.',
      },
    ],
  },
  seoKeywords: ['depression quiz', 'mood quiz', 'am I depressed quiz', 'low mood self test'],
}
