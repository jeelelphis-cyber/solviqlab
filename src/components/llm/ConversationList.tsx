'use client'

import type { Conversation } from '@/lib/llm/types'

interface Props {
  readonly conversations: readonly Conversation[]
  readonly activeId:      string | null
  readonly onSelect:      (id: string) => void
  readonly onNew:         () => void
  readonly onDelete:      (id: string) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs  = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)  return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)   return `${diffH}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          History
        </p>
        <button
          onClick={onNew}
          className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center transition-colors"
          aria-label="New conversation"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 px-4">
            No conversations yet.
          </p>
        )}
        {[...conversations].reverse().map(conv => {
          const preview = conv.turns[conv.turns.length - 1]?.content ?? 'New conversation'
          const isActive = conv.id === activeId
          return (
            <div
              key={conv.id}
              className={`group flex items-start gap-2 px-4 py-2.5 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-violet-50 dark:bg-violet-900/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {conv.clusterId ?? 'General'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {preview}
                </p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
                  {formatDate(conv.updated_at)}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-5 w-5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center mt-0.5"
                aria-label="Delete conversation"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
