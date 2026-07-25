'use client'

interface Props {
  readonly role:      'user' | 'assistant'
  readonly content:   string
  readonly streaming?: boolean
}

export function ChatMessage({ role, content, streaming = false }: Props) {
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAssistant
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            : 'bg-violet-600 text-white'
        }`}
      >
        {content}
        {streaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-current opacity-70 animate-pulse align-middle" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
