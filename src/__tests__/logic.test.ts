// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WORDS } from '../data/words'
import { addDays, dayKey } from '../lib/date'
import { comboMultiplier, MASTERED_BOX, rankFor } from '../lib/game'
import { buildRound } from '../lib/quiz'
import { makeCloze, spell } from '../lib/text'
import { dueWordIds, useStore, visibleStreak } from '../store'

beforeEach(() => {
  useStore.getState().resetAll()
  useStore.setState({ onboarded: true, dailyGoal: 30 })
  vi.useRealTimers()
})

describe('Wortbestand', () => {
  it('hat eindeutige IDs und vollständige Einträge', () => {
    const ids = new Set(WORDS.map((w) => w.id))
    expect(ids.size).toBe(WORDS.length)
    for (const w of WORDS) {
      expect(w.definition.length).toBeGreaterThan(2)
      expect(w.example.length).toBeGreaterThan(10)
      expect(/[–—]/.test(w.definition + w.example)).toBe(false)
    }
  })

  it('findet für die meisten Beispielsätze eine Lücke', () => {
    const ok = WORDS.filter((w) => makeCloze(w)).length
    expect(ok / WORDS.length).toBeGreaterThan(0.8)
  })

  it('setzt die Lücke im Beispielsatz an die richtige Stelle', () => {
    for (const w of WORDS) {
      const c = makeCloze(w)
      if (c) expect(c.before + c.answer + c.after).toBe(w.example)
    }
  })

  it('trennt Stilangaben von der Definition', () => {
    const w = WORDS.find((x) => x.word === 'Gestade')!
    expect(w.register).toBe('dichterisch')
    expect(w.definition.startsWith('dichterisch')).toBe(false)
  })
})

describe('Schreibweise', () => {
  it('ersetzt ß in der Schweizer Variante', () => {
    expect(spell('Muße und Maß', 'ch')).toBe('Musse und Mass')
    expect(spell('Muße', 'de')).toBe('Muße')
  })
})

describe('Lernstand (Leitner)', () => {
  it('legt neue Wörter heute fällig in Box 1 ab', () => {
    const id = WORDS[0].id
    useStore.getState().discover(id, false, { flipped: false, gold: false })
    const p = useStore.getState().progress[id]
    expect(p.box).toBe(1)
    expect(p.due).toBe(dayKey())
    expect(dueWordIds(useStore.getState().progress)).toContain(id)
  })

  it('befördert bei richtiger Antwort und setzt bei falscher zurück', () => {
    const id = WORDS[1].id
    const s = useStore.getState()
    s.discover(id, false, { flipped: false, gold: false })
    s.answer(id, true, 10)
    expect(useStore.getState().progress[id].box).toBe(2)
    expect(useStore.getState().progress[id].due).toBe(addDays(dayKey(), 1))
    s.answer(id, false, 0)
    expect(useStore.getState().progress[id].box).toBe(1)
  })

  it('meistert ein Wort nach genug richtigen Antworten', () => {
    const id = WORDS[2].id
    const s = useStore.getState()
    s.discover(id, false, { flipped: false, gold: false })
    for (let i = 0; i < 6; i++) s.answer(id, true, 10)
    expect(useStore.getState().progress[id].box).toBe(MASTERED_BOX)
    expect(useStore.getState().achievements['master-1']).toBeTruthy()
  })

  it('stellt Runden nur aus Wörtern im Lernstapel zusammen', () => {
    const s = useStore.getState()
    WORDS.slice(0, 5).forEach((w) => s.discover(w.id, false, { flipped: false, gold: false }))
    const { questions } = buildRound(useStore.getState().progress)
    expect(questions).toHaveLength(5)
    for (const q of questions) {
      if (q.kind !== 'truefalse') expect(q.options.map((o) => o.id)).toContain(q.word.id)
    }
  })
})

describe('Punkte, Tagesziel und Serie', () => {
  it('startet die Serie beim Erreichen des Tagesziels', () => {
    useStore.getState().addXp(30)
    const st = useStore.getState()
    expect(st.streak).toBe(1)
    expect(st.lastGoalDay).toBe(dayKey())
    expect(st.events.some((e) => e.type === 'goal')).toBe(true)
    // ein zweites Mal am selben Tag zählt nicht doppelt
    useStore.getState().addXp(30)
    expect(useStore.getState().streak).toBe(1)
  })

  it('setzt die Serie fort, wenn gestern erreicht', () => {
    useStore.setState({ streak: 4, lastGoalDay: addDays(dayKey(), -1) })
    useStore.getState().addXp(30)
    expect(useStore.getState().streak).toBe(5)
  })

  it('verliert die Serie nach verpasstem Tag ohne Serienschutz', () => {
    useStore.setState({ streak: 4, lastGoalDay: addDays(dayKey(), -2), freezes: 0 })
    expect(visibleStreak(useStore.getState())).toBe(0)
    useStore.getState().checkStreak()
    expect(useStore.getState().streak).toBe(0)
  })

  it('rettet die Serie mit Serienschutz', () => {
    useStore.setState({ streak: 9, lastGoalDay: addDays(dayKey(), -2), freezes: 1 })
    useStore.getState().checkStreak()
    const st = useStore.getState()
    expect(st.streak).toBe(9)
    expect(st.freezes).toBe(0)
    expect(visibleStreak(st)).toBe(9)
  })

  it('berechnet Kombo und Rang', () => {
    expect(comboMultiplier(2)).toBe(1)
    expect(comboMultiplier(3)).toBe(1.5)
    expect(comboMultiplier(9)).toBe(3)
    expect(rankFor(0).level).toBe(1)
    expect(rankFor(80).level).toBe(2)
    expect(rankFor(79).toNext).toBe(1)
  })
})
