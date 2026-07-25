'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ConversationList } from './ConversationList'
import { PaywallGate } from '@/components/premium/PaywallGate'
import { getBrowserRuntime } from '@/lib/runtime/platform'
import type { Conversation } from '@/lib/llm/types'

interface Message {
  readonly role:    'user' | 'assistant'
  readonly content: string
}

interface Props {
  readonly lang:        string
  readonly clusterId?:  string
  readonly showHistory?: boolean
}

// ── Chat hook ──────────────────────────────────────────────────────────────────

function useLLMChat(lang: string, clusterId?: string) {
  const [messages,      setMessages]      = useState<Message[]>([])
  const [streaming,     setStreaming]      = useState(false)
  const [streamBuffer,  setStreamBuffer]  = useState('')
  const [convId,        setConvId]        = useState<string | null>(null)
  const [conversations, setConversations] = useState<readonly Conversation[]>([])
  const [quotaExceeded, setQuotaExceeded] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const refreshConversations = useCallback(() => {
    const runtime = getBrowserRuntime()
    setConversations(runtime.llmCoach.listConversations())
  }, [])

  const startNew = useCallback((cId?: string) => {
    const runtime = getBrowserRuntime()
    const id      = runtime.llmCoach.startConversation(cId ?? clusterId)
    setConvId(id)
    setMessages([])
    setStreamBuffer('')
    refreshConversations()
  }, [clusterId, refreshConversations])

  useEffect(() => {
    startNew(clusterId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversation = useCallback((id: string) => {
    const runtime = getBrowserRuntime()
    const history = runtime.llmCoach.getHistory(id)
    setConvId(id)
    setMessages(history.map(t => ({ role: t.role, content: t.content })))
    setStreamBuffer('')
  }, [])

  const deleteConversation = useCallback((id: string) => {
    const runtime = getBrowserRuntime()
    runtime.llmCoach.clearConversation(id)
    refreshConversations()
    if (id === convId) startNew()
  }, [convId, startNew, refreshConversations])

  const send = useCallback(async (userMessage: string) => {
    if (!convId || streaming) return

    const runtime = getBrowserRuntime()
    const user    = runtime.userEngine.getUser()
    const tier    = (user as any)?.subscription_tier ?? 'free'

    if (!runtime.llmQuota.check(tier)) {
      setQuotaExceeded(true)
      return
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setStreaming(true)
    setStreamBuffer('')

    abortRef.current = new AbortController()

    try {
      let full = ''
      const gen = runtime.llmCoach.askStream(
        userMessage, convId, lang, clusterId,
        { signal: abortRef.current.signal },
      )

      for await (const chunk of gen) {
        if (chunk.done) break
        full += chunk.delta
        setStreamBuffer(full)
      }

      if (full) {
        setMessages(prev => [...prev, { role: 'assistant', content: full }])
        runtime.llmQuota.increment()
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Please try again.' },
        ])
      }
    } finally {
      setStreaming(false)
      setStreamBuffer('')
      abortRef.current = null
      refreshConversations()
    }
  }, [convId, streaming, lang, clusterId, refreshConversations])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    messages, streaming, streamBuffer, convId, conversations, quotaExceeded,
    send, stop, startNew, loadConversation, deleteConversation,
  }
}

// ── Input bar ──────────────────────────────────────────────────────────────────

function ChatInput({ onSend, disabled }: { onSend: (msg: string) => void, disabled: boolean }) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = useCallback(() => {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    ref.current?.focus()
  }, [value, disabled, onSend])

  return (
    <div className="flex gap-2 items-end border-t border-slate-200 dark:border-slate-700 pt-4">
      <textarea
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
        disabled={disabled}
        rows={1}
        placeholder="Ask your coach…"
        className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 min-h-[44px] max-h-32"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 h-11 w-11 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
        aria-label="Send message"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

// ── Chat panel ─────────────────────────────────────────────────────────────────

function ChatUI({ lang, clusterId, showHistory = false }: Props) {
  const {
    messages, streaming, streamBuffer, convId, conversations, quotaExceeded,
    send, stop, startNew, loadConversation, deleteConversation,
  } = useLLMChat(lang, clusterId)

  const bottomRef    = useRef<HTMLDivElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  return (
    <div className="flex h-full min-h-[480px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Conversation sidebar */}
      {showHistory && (
        <div className={`flex-shrink-0 border-r border-slate-100 dark:border-slate-800 transition-all duration-200 ${sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'}`}>
          <ConversationList
            conversations={conversations}
            activeId={convId}
            onSelect={id => { loadConversation(id); setSidebarOpen(false) }}
            onNew={() => { startNew(); setSidebarOpen(false) }}
            onDelete={deleteConversation}
          />
        </div>
      )}

      {/* Main chat panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          {showHistory && (
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
              aria-label="Toggle history"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Coach</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {streaming ? 'Typing…' : 'Ready'}
            </p>
          </div>
          {streaming && (
            <button
              onClick={stop}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
            >
              Stop
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {quotaExceeded && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              Daily limit reached. Upgrade to Pro for more conversations.
            </div>
          )}
          {messages.length === 0 && !quotaExceeded && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              Ask me anything about your health journey.
            </p>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {streaming && streamBuffer && (
            <ChatMessage role="assistant" content={streamBuffer} streaming />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-5">
          <ChatInput onSend={send} disabled={streaming || quotaExceeded} />
        </div>
      </div>
    </div>
  )
}

export function LLMChatInterface({ lang, clusterId, showHistory }: Props) {
  return (
    <PaywallGate feature="ai_consultation" lang={lang}>
      <ChatUI lang={lang} clusterId={clusterId} showHistory={showHistory} />
    </PaywallGate>
  )
}
