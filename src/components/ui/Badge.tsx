import type { ReactNode } from 'react'

type BadgeVariant = 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'violet' | 'rose'

const VARIANT: Record<BadgeVariant, string> = {
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  red:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  slate:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  violet:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  rose:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'slate', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        VARIANT[variant],
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </span>
  )
}
