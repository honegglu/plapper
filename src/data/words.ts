import raw from './words.json'
import { slug } from '../lib/text'
import type { Word } from '../lib/types'

type RawWord = Omit<Word, 'id' | 'register' | 'ipa' | 'etymology'> & { ipa?: string; etymology?: string }

// Stilangaben wie "gehoben:" oder "veraltet:" stehen in den Rohdaten vor der Definition.
// Sie werden abgetrennt und als eigenes Etikett angezeigt (sonst verraten sie in der Abfrage die Lösung).
const REGISTER_WORDS = new Set([
  'umgangssprachlich',
  'gehoben',
  'veraltet',
  'veraltend',
  'dichterisch',
  'landschaftlich',
  'scherzhaft',
  'abwertend',
  'historisch',
  'österreichisch',
  'norddeutsch',
  'süddeutsch',
  'schweizerisch',
  'regional',
  'bildungssprachlich',
  'noch',
  'und',
])

function splitRegister(definition: string): { register: string | null; definition: string } {
  const m = /^([^:]{3,48}):\s+(.+)$/.exec(definition)
  if (!m) return { register: null, definition }
  const parts = m[1].toLowerCase().split(/[\s,]+/).filter(Boolean)
  if (!parts.every((p) => REGISTER_WORDS.has(p))) return { register: null, definition }
  return { register: m[1], definition: m[2] }
}

export const WORDS: Word[] = (raw as RawWord[]).map((w) => ({
  ...w,
  ...splitRegister(w.definition),
  ipa: w.ipa ?? null,
  etymology: w.etymology ?? null,
  id: slug(w.word),
}))

export const WORDS_BY_ID: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]))
