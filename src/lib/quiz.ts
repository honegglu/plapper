import { WORDS, WORDS_BY_ID } from '../data/words'
import { dayKey } from './date'
import { GOLD_CHANCE, MASTERED_BOX } from './game'
import { makeCloze } from './text'
import { shuffle } from './random'
import type { Word, WordProgress } from './types'

export type Question =
  | { kind: 'meaning'; word: Word; options: Word[]; gold: boolean }
  | { kind: 'word'; word: Word; options: Word[]; gold: boolean }
  | { kind: 'cloze'; word: Word; options: Word[]; gold: boolean; before: string; after: string }
  | { kind: 'truefalse'; word: Word; shown: Word; gold: boolean }

export const ROUND_SIZE = 10

function distractors(word: Word, n: number): Word[] {
  const samePos = WORDS.filter((w) => w.id !== word.id && w.pos === word.pos)
  const pool = samePos.length >= n ? samePos : WORDS.filter((w) => w.id !== word.id)
  return shuffle(pool).slice(0, n)
}

export function buildQuestion(word: Word, forceTest = false): Question {
  const gold = Math.random() < GOLD_CHANCE
  const r = Math.random()
  const cloze = makeCloze(word)
  if (forceTest || r < 0.35) {
    return { kind: 'meaning', word, options: shuffle([word, ...distractors(word, 3)]), gold }
  }
  if (r < 0.6) {
    return { kind: 'word', word, options: shuffle([word, ...distractors(word, 3)]), gold }
  }
  if (r < 0.82 || !cloze) {
    const match = Math.random() < 0.5
    return { kind: 'truefalse', word, shown: match ? word : distractors(word, 1)[0], gold }
  }
  return { kind: 'cloze', word, options: shuffle([word, ...distractors(word, 3)]), gold, before: cloze.before, after: cloze.after }
}

/**
 * Stellt eine Abfragerunde zusammen: zuerst fällige Wörter, dann (falls zu wenige)
 * Wörter aus dem Lernstapel, die bald fällig werden.
 */
export function buildRound(progress: Record<string, WordProgress>): { questions: Question[]; extra: boolean } {
  const today = dayKey()
  const active = Object.entries(progress).filter(([id, p]) => p.box > 0 && p.box < MASTERED_BOX && WORDS_BY_ID[id])
  const due = active.filter(([, p]) => p.due <= today).sort((a, b) => a[1].box - b[1].box)
  let chosen = due.slice(0, ROUND_SIZE)
  let extra = false
  if (chosen.length < 4) {
    const upcoming = active
      .filter(([, p]) => p.due > today)
      .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].box - b[1].box)
    chosen = [...chosen, ...upcoming].slice(0, Math.min(ROUND_SIZE, Math.max(chosen.length, 6)))
    extra = due.length === 0
  }
  const questions = shuffle(chosen).map(([id, p]) => buildQuestion(WORDS_BY_ID[id], p.claimed))
  return { questions, extra }
}
