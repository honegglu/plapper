import { Scroll, SpeakerHigh } from '@phosphor-icons/react'
import { useSpell } from '../lib/hooks'
import { canSpeak, speak } from '../lib/speech'
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

/** Lautschrift mit Knopf zum Vorlesen. */
export function Pronunciation({ word, compact = false }: { word: Word; compact?: boolean }) {
  if (!word.ipa) return null
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <div className={`flex items-center gap-2 ${compact ? 'mt-1' : 'mt-2'}`}>
      <span className={`font-normal tracking-normal text-steel ${compact ? 'text-sm' : 'text-base sm:text-lg'}`} aria-label="Aussprache">
        {word.ipa}
      </span>
      {canSpeak() && (
        <button
          type="button"
          onPointerDown={stop}
          onKeyDown={stop}
          onClick={(e) => {
            e.stopPropagation()
            speak(word.word)
          }}
          className="press grid h-8 w-8 shrink-0 place-items-center rounded-full text-primary-ink hover:bg-primary-soft"
          aria-label={`${word.word} vorlesen`}
        >
          <SpeakerHigh size={compact ? 16 : 18} weight="bold" />
        </button>
      )}
    </div>
  )
}

/** Das Wort selbst, mit Artikel davor und Aussprache darunter, Grösse nach Wortlänge. */
export function WordTitle({
  word,
  compact = false,
  showIpa = true,
  className = '',
}: {
  word: Word
  compact?: boolean
  showIpa?: boolean
  className?: string
}) {
  const s = useSpell()
  const text = s(word.word)
  return (
    <div className={className} lang="de">
      {word.article && (
        <div className={`font-medium text-steel ${compact ? 'text-sm' : 'text-base'}`}>{word.article}</div>
      )}
      <h2 className={`hyphenate font-semibold leading-[1.08] tracking-[-0.03em] text-ink ${sizeFor(text, compact)}`}>{text}</h2>
      {showIpa && <Pronunciation word={word} compact={compact} />}
    </div>
  )
}

/** Wortherkunft als eigener, ruhiger Block. */
export function Etymology({ word, className = '' }: { word: Word; className?: string }) {
  const s = useSpell()
  const text = word.etymology ?? word.origin
  if (!text) return null
  return (
    <div className={`rounded-btn bg-sunken p-3.5 ${className}`} lang="de">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-primary-ink">
        <Scroll size={15} weight="bold" /> Wortherkunft
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate">{s(text)}</p>
    </div>
  )
}

/** Bedeutung, Beispiel, Wortherkunft und Synonyme. */
export function WordDetails({ word, showDefinition = true }: { word: Word; showDefinition?: boolean }) {
  const s = useSpell()
  return (
    <div className="space-y-4" lang="de">
      {showDefinition && <p className="text-lg font-medium leading-snug text-charcoal sm:text-xl">{s(word.definition)}</p>}
      <p className="border-l-2 border-primary/40 pl-3 text-[15px] italic leading-relaxed text-slate">„{s(word.example)}“</p>
      {word.synonyms.length > 0 && (
        <p className="text-sm text-steel">
          <span className="font-medium text-slate">Ähnlich: </span>
          {word.synonyms.map(s).join(', ')}
        </p>
      )}
      <Etymology word={word} />
    </div>
  )
}
