import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
}

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export function Card({ children, className = '', padding = 'md', border = true }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl bg-white dark:bg-slate-900',
        border ? 'border border-slate-200 dark:border-slate-700' : '',
        PADDING[padding],
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
