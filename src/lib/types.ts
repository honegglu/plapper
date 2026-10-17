export type WordClass = 'Substantiv' | 'Verb' | 'Adjektiv' | 'Adverb' | 'Wendung'

export interface Word {
  id: string
  word: string
  article: 'der' | 'die' | 'das' | null
  pos: WordClass
  definition: string
  /** Stilangabe, z. B. "gehoben" oder "veraltet" */
  register: string | null
  example: string
  origin: string | null
  /** Aussprache in IPA, z. B. "[kɔnt͡siˈli̯ant]" */
  ipa: string | null
  /** Wortherkunft als kurze Geschichte (2 bis 4 Sätze) */
  etymology: string | null
  synonyms: string[]
  /** Seltenheit: 1 = anspruchsvoll, 2 = selten, 3 = sehr selten */
  level: 1 | 2 | 3
}

/**
 * Lernstand eines Wortes (Leitner-System).
 * box 0 = noch nicht gesehen, 1-5 = in Wiederholung, 6 = gemeistert.
 */
export interface WordProgress {
  box: number
  /** Tag (YYYY-MM-DD), ab dem das Wort wieder fällig ist */
  due: string
  /** Bei "Kenne ich" einsortiert: wird später geprüft */
  claimed: boolean
  seenAt: string
  correct: number
  wrong: number
  favorite: boolean
}

export type Spelling = 'ch' | 'de'
export type ThemePref = 'system' | 'light' | 'dark'

export type Screen = 'home' | 'discover' | 'practice' | 'collection' | 'profile'
