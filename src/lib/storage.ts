import type { StateStorage } from 'zustand/middleware'

/**
 * localStorage mit Absicherung: In privaten Fenstern oder bei blockierten
 * Website-Daten wirft der Zugriff. Dann bleibt der Stand im Speicher.
 */
const memory = new Map<string, string>()

export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name) ?? memory.get(name) ?? null
    } catch {
      return memory.get(name) ?? null
    }
  },
  setItem(name, value) {
    memory.set(name, value)
    try {
      window.localStorage.setItem(name, value)
    } catch {
      /* nur im Speicher */
    }
  },
  removeItem(name) {
    memory.delete(name)
    try {
      window.localStorage.removeItem(name)
    } catch {
      /* ignorieren */
    }
  },
}
