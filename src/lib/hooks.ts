import { useCallback, useEffect } from 'react'
import { useStore } from '../store'
import { spell } from './text'

/** Gibt eine Funktion zurück, die Text in der gewählten Schreibweise (CH/DE) liefert. */
export function useSpell() {
  const spelling = useStore((s) => s.spelling)
  return useCallback((t: string) => spell(t, spelling), [spelling])
}

/** Tastaturkürzel (nur wenn kein Eingabefeld fokussiert ist). */
export function useKeys(map: Record<string, () => void>, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const fn = map[e.key]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map, enabled])
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* nicht unterstützt */
  }
}
