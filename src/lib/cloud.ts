import { pickPersisted, useStore, type PersistedState } from '../store'

/**
 * Optionale Synchronisierung, wenn Plapper als claude.ai-Artifact läuft:
 * Der Lernstand liegt dann zusätzlich privat pro Person in der Artifact-Datenbank
 * und ist so auf allen Geräten gleich. Ausserhalb von claude.ai passiert nichts,
 * die App nutzt dann nur localStorage.
 */

interface DocRef {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>
  set(data: Record<string, unknown>): Promise<void>
}
interface DbApi {
  doc(path: string): DocRef
}
interface UserApi {
  id(): Promise<string | null>
}
interface ClaudeHost {
  use(name: string): Promise<unknown>
}

export type SyncStatus = 'off' | 'connecting' | 'on' | 'error'
let status: SyncStatus = 'off'
const listeners = new Set<(s: SyncStatus) => void>()
function setStatus(s: SyncStatus) {
  status = s
  listeners.forEach((fn) => fn(s))
}
export function onSyncStatus(fn: (s: SyncStatus) => void) {
  listeners.add(fn)
  fn(status)
  return () => {
    listeners.delete(fn)
  }
}

export async function startCloudSync() {
  const host = (window as unknown as { claude?: ClaudeHost }).claude
  if (!host || typeof host.use !== 'function') return
  setStatus('connecting')
  try {
    const [db, user] = (await Promise.all([host.use('db'), host.use('user')])) as [DbApi | null, UserApi | null]
    if (!db || !user) return setStatus('off')
    const uid = await user.id()
    if (!uid) return setStatus('off')
    const ref = db.doc(`data/users/${uid}/plapper`)

    const snap = await ref.get()
    const remote = snap.exists ? (snap.data()?.state as PersistedState | undefined) : undefined
    const local = pickPersisted(useStore.getState())
    if (remote && remote.updatedAt > local.updatedAt) {
      useStore.getState().hydrateFrom(remote)
    } else if (local.updatedAt > 0) {
      await ref.set({ state: local })
    }
    setStatus('on')

    let timer: number | undefined
    let lastSent = useStore.getState().updatedAt
    useStore.subscribe((s) => {
      if (s.updatedAt === lastSent) return
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        const state = pickPersisted(useStore.getState())
        lastSent = state.updatedAt
        try {
          await ref.set({ state })
          setStatus('on')
        } catch {
          setStatus('error')
        }
      }, 1500)
    })
  } catch {
    setStatus('error')
  }
}
