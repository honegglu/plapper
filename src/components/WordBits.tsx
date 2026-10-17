import { useSpell } from '../lib/hooks'
import { levelLabel } from '../lib/text'
import type { Word } from '../lib/types'
import { Tag, type Tint } from './ui'

const levelTint: Record<Word['level'], Tint> = { 1: 'sky', 2: 'lavender', 3: 'rose' }

export function WordMeta({ word }: { word: Word }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag tint="peach">{word.pos}</Tag>
      <Tag tint={levelTint[word.level]}>{levelLabel(word.level)}</Tag>
      {word.register && <Tag tint="yellow">{word.register}</Tag>}
    </div>
  )
}

function sizeFor(text: string, compact: boolean) {
  const n = text.length
  if (compact) return n > 16 ? 'text-2xl' : 'text-[28px]'
  if (n <= 9) return 'text-[44px] sm:text-[52px]'
  if (n <= 13) return 'text-[38px] sm:text-[46px]'
  if (n <= 17) return 'text-[32px] sm:text-[40px]'
  return 'text-[27px] sm:text-[34px]'
}

/** Das Wort selbst, mit Artikel davor, Grösse nach Wortlänge. */
export function WordTitle({ word, compact = false, className = '' }: { word: Word; compact?: boolean; className?: string }) {
  const s = useSpell()
  const text = s(word.word)
  return (
    <div className={className} lang="de">
      {word.article && (
        <div className={`font-medium text-steel ${compact ? 'text-sm' : 'text-base'}`}>{word.article}</div>
      )}
      <h2 className={`hyphenate font-semibold leading-[1.08] tracking-[-0.03em] text-ink ${sizeFor(text, compact)}`}>{text}</h2>
    </div>
  )
}

/** Bedeutung, Beispiel, Herkunft und Synonyme. */
export function WordDetails({ word, showDefinition = true }: { word: Word; showDefinition?: boolean }) {
  const s = useSpell()
  return (
    <div className="space-y-4" lang="de">
      {showDefinition && <p className="text-lg font-medium leading-snug text-charcoal sm:text-xl">{s(word.definition)}</p>}
      <p className="border-l-2 border-primary/40 pl-3 text-[15px] italic leading-relaxed text-slate">„{s(word.example)}“</p>
      <div className="space-y-2 text-sm text-steel">
        {word.origin && (
          <p>
            <span className="font-medium text-slate">Herkunft: </span>
            {s(word.origin)}
          </p>
        )}
        {word.synonyms.length > 0 && (
          <p>
            <span className="font-medium text-slate">Ähnlich: </span>
            {word.synonyms.map(s).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
