'use client'

import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // システム設定を検出
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    
    // 初期テーマ設定
    const setTheme = (isLight: boolean) => {
      document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark')
    }
    
    // 初期設定
    setTheme(mediaQuery.matches)
    
    // システム設定の変更を監視
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches)
    }
    
    // イベントリスナーを追加（新しいAPI）
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // 古いAPI（Safari互換性）
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  return <>{children}</>
}
