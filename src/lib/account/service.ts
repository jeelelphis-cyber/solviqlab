const HISTORY_KEY = 'account:history'
const FAVORITES_KEY = 'account:favorites'
const MAX_HISTORY = 20

export interface HistoryItem {
  slug: string
  name: string
  value: number
  label: string | null
  unit: string | null
  cluster: string
  lang: string
  timestamp: number
}

export interface FavoriteItem {
  slug: string
  name: string
  cluster: string
  addedAt: number
}

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

export const AccountService = {
  saveToHistory(item: HistoryItem): void {
    const history = this.getHistory().filter(h => h.slug !== item.slug)
    localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...history].slice(0, MAX_HISTORY)))
  },

  getHistory(): HistoryItem[] {
    return load<HistoryItem[]>(HISTORY_KEY, [])
  },

  toggleFavorite(item: FavoriteItem): boolean {
    const favs = this.getFavorites()
    const idx = favs.findIndex(f => f.slug === item.slug)
    if (idx >= 0) {
      favs.splice(idx, 1)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
      return false
    }
    favs.push(item)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
    return true
  },

  getFavorites(): FavoriteItem[] {
    return load<FavoriteItem[]>(FAVORITES_KEY, [])
  },

  isFavorite(slug: string): boolean {
    return this.getFavorites().some(f => f.slug === slug)
  },

  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY)
  },
}
