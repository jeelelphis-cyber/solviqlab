'use client'

import { useState, useEffect } from 'react'
import { AccountService } from '@/lib/account/service'
import { getT } from '@/lib/i18n/ui'

interface Props {
  slug: string
  name: string
  cluster: string
  lang?: string
}

export function FavoriteButton({ slug, name, cluster, lang = 'en' }: Props) {
  const [fav, setFav] = useState(false)
  const [pop, setPop] = useState(false)
  const t = getT(lang)

  useEffect(() => {
    setFav(AccountService.isFavorite(slug))
  }, [slug])

  function toggle() {
    const next = AccountService.toggleFavorite({ slug, name, cluster, addedAt: Date.now() })
    setFav(next)
    if (next) { setPop(true); setTimeout(() => setPop(false), 1200) }
  }

  return (
    <button
      onClick={toggle}
      aria-label={fav ? t('favorite.remove') : t('favorite.add')}
      title={fav ? t('favorite.remove') : t('favorite.add')}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
        fav
          ? 'border-amber-300 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-amber-300 hover:text-amber-500'
      }`}
    >
      <span className={`transition-transform ${fav ? 'scale-110' : ''}`}>{fav ? '★' : '☆'}</span>
      <span>{fav ? t('favorite.saved') : t('favorite.save')}</span>
      {pop && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-1 rounded whitespace-nowrap pointer-events-none">
          {t('favorite.added')}
        </span>
      )}
    </button>
  )
}
