import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { WORDS } from './data/words'
import { addDays, dayKey, daysBetween } from './lib/date'
import {
  ACHIEVEMENTS,
  BOX_INTERVALS,
  CLAIMED_BOX,
  DEFAULT_GOAL,
  MASTERED_BOX,
  rankFor,
  XP,
} from './lib/game'
import { seeded, shuffle } from './lib/random'
import { safeStorage } from './lib/storage'
import type { Screen, Spelling, ThemePref, WordProgress } from './lib/types'

export type AppEvent =
  | { id: number; type: 'goal'; streak: number }
  | { id: number; type: 'rank'; level: number; title: string }
  | { id: number; type: 'achievement'; achievementId: string }
  | { id: number; type: 'freeze'; days: number }

export interface PersistedState {
  updatedAt: number
  onboarded: boolean
  dailyGoal: number
  spelling: Spelling
  theme: ThemePref
  progress: Record<string, WordProgress>
  deckSeed: number
  xpTotal: number
  xpByDay: Record<string, number>
  streak: number
  bestStreak: number
  lastGoalDay: string | null
  freezes: number
  goalsReached: number
  bestCombo: number
  goldFound: number
  perfectRounds: number
  totalCorrect: number
  totalAnswers: number
  achievements: Record<string, string>
}

interface Actions {
  go: (screen: Screen) => void
  completeOnboarding: (goal: number) => void
  discover: (wordId: string, known: boolean, opts: { flipped: boolean; gold: boolean }) => number
  answer: (wordId: string, correct: boolean, xp: number) => void
  finishRound: (opts: { perfect: boolean; bestCombo: number; questions: number }) => number
  addXp: (amount: number) => void
  toggleFavorite: (wordId: string) => void
  setDailyGoal: (xp: number) => void
  setSpelling: (s: Spelling) => void
  setTheme: (t: ThemePref) => void
  checkStreak: () => void
  consumeEvent: (id: number) => void
  resetAll: () => void
  hydrateFrom: (s: PersistedState) => void
}

interface Transient {
  screen: Screen
  events: AppEvent[]
}

export type AppState = PersistedState & Transient & Actions

const initial = (): PersistedState => ({
  updatedAt: 0,
  onboarded: false,
  dailyGoal: DEFAULT_GOAL,
  spelling: 'ch',
  theme: 'system',
  progress: {},
  deckSeed: Math.floor(Math.random() * 1e9),
  xpTotal: 0,
  xpByDay: {},
  streak: 0,
  bestStreak: 0,
  lastGoalDay: null,
  freezes: 0,
  goalsReached: 0,
  bestCombo: 0,
  goldFound: 0,
  perfectRounds: 0,
  totalCorrect: 0,
  totalAnswers: 0,
  achievements: {},
})

let eventId = 1

/** Prüft Auszeichnungen und hängt Ereignisse für neu freigeschaltete an. */
function withAchievements(s: AppState, partial: Partial<AppState>): Partial<AppState> {
  const next = { ...s, ...partial }
  const progress = Object.values(next.progress)
  const ctx = {
    discovered: progress.length,
    learning: progress.filter((p) => p.box > 0 && p.box < MASTERED_BOX).length,
    mastered: progress.filter((p) => p.box >= MASTERED_BOX).length,
    bestCombo: next.bestCombo,
    streak: next.streak,
    goalsReached: next.goalsReached,
    goldFound: next.goldFound,
    perfectRounds: next.perfectRounds,
    totalCorrect: next.totalCorrect,
    hour: new Date().getHours(),
  }
  const unlocked = { ...next.achievements }
  const events = [...(partial.events ?? s.events)]
  let changed = false
  for (const a of ACHIEVEMENTS) {
    if (!unlocked[a.id] && a.check(ctx)) {
      unlocked[a.id] = dayKey()
      events.push({ id: eventId++, type: 'achievement', achievementId: a.id })
      changed = true
    }
  }
  return changed ? { ...partial, achievements: unlocked, events } : partial
}

/** XP gutschreiben inkl. Tagesziel, Serie und Rangaufstieg. */
function xpPatch(s: AppState, amount: number): Partial<AppState> {
  if (amount <= 0) return {}
  const today = dayKey()
  const before = s.xpByDay[today] ?? 0
  const after = before + amount
  const xpTotal = s.xpTotal + amount
  const patch: Partial<AppState> = {
    xpTotal,
    xpByDay: { ...s.xpByDay, [today]: after },
  }
  const events = [...s.events]

  if (before < s.dailyGoal && after >= s.dailyGoal && s.lastGoalDay !== today) {
    const continues = s.lastGoalDay === addDays(today, -1)
    const streak = continues ? s.streak + 1 : 1
    patch.streak = streak
    patch.bestStreak = Math.max(s.bestStreak, streak)
    patch.lastGoalDay = today
    patch.goalsReached = s.goalsReached + 1
    // Alle 7 Tage gibt es einen Serienschutz (max. 2)
    if (streak % 7 === 0) patch.freezes = Math.min(2, s.freezes + 1)
    events.push({ id: eventId++, type: 'goal', streak })
  }

  const r0 = rankFor(s.xpTotal)
  const r1 = rankFor(xpTotal)
  if (r1.level > r0.level) events.push({ id: eventId++, type: 'rank', level: r1.level, title: r1.title })

  patch.events = events
  return patch
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),
      screen: 'home',
      events: [],

      go: (screen) => {
        set({ screen })
        window.scrollTo({ top: 0 })
      },

      completeOnboarding: (goal) =>
        set((s) => withAchievements(s, { onboarded: true, dailyGoal: goal, updatedAt: Date.now(), ...xpPatch(s, 10) })),

      discover: (wordId, known, { flipped, gold }) => {
        const s = get()
        const today = dayKey()
        const entry: WordProgress = {
          box: known ? CLAIMED_BOX : 1,
          due: known ? addDays(today, 2) : today,
          claimed: known,
          seenAt: today,
          correct: 0,
          wrong: 0,
          favorite: s.progress[wordId]?.favorite ?? false,
        }
        let xp = known ? XP.discoverKnown : XP.discoverNew
        if (flipped) xp += XP.flipBonus
        if (gold) xp *= XP.goldMultiplier
        set((st) =>
          withAchievements(st, {
            progress: { ...st.progress, [wordId]: entry },
            goldFound: st.goldFound + (gold ? 1 : 0),
            updatedAt: Date.now(),
            ...xpPatch(st, xp),
          }),
        )
        return xp
      },

      answer: (wordId, correct, xp) =>
        set((s) => {
          const today = dayKey()
          const p = s.progress[wordId] ?? {
            box: 1,
            due: today,
            claimed: false,
            seenAt: today,
            correct: 0,
            wrong: 0,
            favorite: false,
          }
          const box = correct ? Math.min(MASTERED_BOX, Math.max(1, p.box) + 1) : 1
          const next: WordProgress = {
            ...p,
            box,
            due: addDays(today, BOX_INTERVALS[box]),
            claimed: false,
            correct: p.correct + (correct ? 1 : 0),
            wrong: p.wrong + (correct ? 0 : 1),
          }
          return withAchievements(s, {
            progress: { ...s.progress, [wordId]: next },
            totalAnswers: s.totalAnswers + 1,
            totalCorrect: s.totalCorrect + (correct ? 1 : 0),
            updatedAt: Date.now(),
            ...xpPatch(s, xp),
          })
        }),

      finishRound: ({ perfect, bestCombo, questions }) => {
        const bonus = XP.roundComplete + (perfect && questions >= 5 ? XP.perfectRound : 0)
        set((s) =>
          withAchievements(s, {
            bestCombo: Math.max(s.bestCombo, bestCombo),
            perfectRounds: s.perfectRounds + (perfect && questions >= 5 ? 1 : 0),
            updatedAt: Date.now(),
            ...xpPatch(s, bonus),
          }),
        )
        return bonus
      },

      addXp: (amount) => set((s) => withAchievements(s, { updatedAt: Date.now(), ...xpPatch(s, amount) })),

      toggleFavorite: (wordId) =>
        set((s) => {
          const today = dayKey()
          const p = s.progress[wordId]
          const next: WordProgress = p
            ? { ...p, favorite: !p.favorite }
            : { box: 0, due: today, claimed: false, seenAt: today, correct: 0, wrong: 0, favorite: true }
          return { progress: { ...s.progress, [wordId]: next }, updatedAt: Date.now() }
        }),

      setDailyGoal: (dailyGoal) => set({ dailyGoal, updatedAt: Date.now() }),
      setSpelling: (spelling) => set({ spelling, updatedAt: Date.now() }),
      setTheme: (theme) => set({ theme, updatedAt: Date.now() }),

      checkStreak: () =>
        set((s) => {
          if (!s.lastGoalDay) return {}
          const today = dayKey()
          const gap = daysBetween(s.lastGoalDay, today)
          if (gap <= 1) return {}
          const missed = gap - 1
          if (s.streak > 0 && s.freezes >= missed) {
            // Serienschutz greift: verpasste Tage werden überbrückt
            return {
              freezes: s.freezes - missed,
              lastGoalDay: addDays(today, -1),
              events: [...s.events, { id: eventId++, type: 'freeze', days: missed }],
              updatedAt: Date.now(),
            }
          }
          return s.streak === 0 ? {} : { streak: 0, updatedAt: Date.now() }
        }),

      consumeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      resetAll: () => set({ ...initial(), screen: 'home', events: [], updatedAt: Date.now() }),

      hydrateFrom: (data) => set({ ...data }),
    }),
    {
      name: 'plapper-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): PersistedState => pickPersisted(s),
    },
  ),
)

export function pickPersisted(s: AppState): PersistedState {
  return {
    updatedAt: s.updatedAt,
    onboarded: s.onboarded,
    dailyGoal: s.dailyGoal,
    spelling: s.spelling,
    theme: s.theme,
    progress: s.progress,
    deckSeed: s.deckSeed,
    xpTotal: s.xpTotal,
    xpByDay: s.xpByDay,
    streak: s.streak,
    bestStreak: s.bestStreak,
    lastGoalDay: s.lastGoalDay,
    freezes: s.freezes,
    goalsReached: s.goalsReached,
    bestCombo: s.bestCombo,
    goldFound: s.goldFound,
    perfectRounds: s.perfectRounds,
    totalCorrect: s.totalCorrect,
    totalAnswers: s.totalAnswers,
    achievements: s.achievements,
  }
}

/* ---------- Abgeleitete Werte ---------- */

export function todayXp(s: Pick<PersistedState, 'xpByDay'>): number {
  return s.xpByDay[dayKey()] ?? 0
}

/** Aktuelle Serie für die Anzeige (0, wenn gestern und heute nichts erreicht). */
export function visibleStreak(s: Pick<PersistedState, 'streak' | 'lastGoalDay'>): number {
  if (!s.lastGoalDay) return 0
  const gap = daysBetween(s.lastGoalDay, dayKey())
  return gap <= 1 ? s.streak : 0
}

export function dueWordIds(progress: Record<string, WordProgress>, today = dayKey()): string[] {
  return Object.entries(progress)
    .filter(([, p]) => p.box > 0 && p.box < MASTERED_BOX && p.due <= today)
    .sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due))
    .map(([id]) => id)
}

/** Nicht gesehene Wörter, leicht nach Seltenheit gestaffelt, aber gemischt. */
export function unseenDeck(progress: Record<string, WordProgress>, seed: number): string[] {
  const rand = seeded(seed)
  const unseen = WORDS.filter((w) => !progress[w.id] || progress[w.id].box === 0)
  return shuffle(unseen, rand)
    .map((w) => ({ id: w.id, score: w.level + rand() * 1.8 }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.id)
}

export function counts(progress: Record<string, WordProgress>) {
  let learning = 0
  let mastered = 0
  let claimed = 0
  let favorites = 0
  for (const p of Object.values(progress)) {
    if (p.favorite) favorites++
    if (p.box === 0) continue
    if (p.box >= MASTERED_BOX) mastered++
    else if (p.claimed) claimed++
    else learning++
  }
  return { learning, mastered, claimed, favorites, seen: learning + mastered + claimed }
}
