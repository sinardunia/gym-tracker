import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_KEY = 'gym-tracker.theme'

export const THEMES: readonly Theme[] = ['light', 'dark', 'system']

const DARK_MEDIA = '(prefers-color-scheme: dark)'

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia(DARK_MEDIA).matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = resolveTheme(theme)
}

export function readStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
  } catch {
    return 'system'
  }
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Storage unavailable.
    }
    if (theme !== 'system') return
    const media = window.matchMedia(DARK_MEDIA)
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return [theme, setTheme]
}