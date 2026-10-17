import type { Spelling, Word } from './types'

/** Schweizer Schreibweise: ß wird zu ss. */
export function spell(text: string, spelling: Spelling): string {
  return spelling === 'ch' ? text.replace(/ß/g, 'ss') : text
}

export function slug(word: string): string {
  return word
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function levelLabel(level: Word['level']): string {
  return level === 1 ? 'anspruchsvoll' : level === 2 ? 'selten' : 'sehr selten'
}

/** Wort ohne "sich" (für Lückentexte und Suche). */
export function coreWord(word: string): string {
  return word.replace(/^sich\s+/, '')
}

/**
 * Sucht im Beispielsatz die (evtl. flektierte) Form des Wortes und ersetzt sie
 * durch eine Lücke. Gibt null zurück, wenn keine sichere Stelle gefunden wird.
 */
export function makeCloze(word: Word): { before: string; after: string; answer: string } | null {
  const core = coreWord(word.word)
  if (core.includes(' ')) {
    const idx = word.example.toLowerCase().indexOf(core.toLowerCase())
    if (idx < 0) return null
    return {
      before: word.example.slice(0, idx),
      after: word.example.slice(idx + core.length),
      answer: word.example.slice(idx, idx + core.length),
    }
  }
  const lower = core.toLowerCase()
  // Stamm: Wort ohne typische Endungen, mindestens 4 Zeichen
  const stemLen = Math.max(4, lower.length - (lower.endsWith('ieren') ? 3 : lower.length > 6 ? 2 : 1))
  const stem = lower.slice(0, stemLen)
  const re = /[A-Za-zÄÖÜäöüßéèêàâçëïîôûœ-]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(word.example))) {
    const token = m[0]
    const t = token.toLowerCase()
    // auch Partizipien wie "geschurigelt" oder trennbare Verben finden wir nicht immer, dann null
    if (t.startsWith(stem) || (t.startsWith('ge') && t.slice(2).startsWith(stem))) {
      return {
        before: word.example.slice(0, m.index),
        after: word.example.slice(m.index + token.length),
        answer: token,
      }
    }
  }
  return null
}
