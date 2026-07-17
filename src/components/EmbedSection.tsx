'use client'
import { useState } from 'react'

interface Props {
  slug: string
  title: string
}

export function EmbedSection({ slug, title }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const code = `<iframe\n  src="https://solviqlab.com/embed/${slug}"\n  width="100%"\n  height="620"\n  style="border:none;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);"\n  title="${title}"\n  loading="lazy"\n></iframe>`

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
      >
        <span className="text-base">{'</>'}</span>
        <span>Embed this calculator on your site</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Embed Code</span>
            <button
              onClick={copy}
              className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                copied
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
            {code}
          </pre>
          <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Free to embed on any website. No registration required. The calculator stays updated automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
