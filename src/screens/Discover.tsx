import { ArrowLeft, ArrowRight, ArrowsClockwise, Confetti, HandTap, Sparkle } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { SessionHeader, XpCounter, type XpPopData } from '../components/SessionBits'
import { SwipeCard, type SwipeDir, type SwipeHandle } from '../components/SwipeCard'
import { Button, Card } from '../components/ui'
import { WordDetails, WordMeta, WordTitle } from '../components/WordBits'
import { WORDS, WORDS_BY_ID } from '../data/words'
import { GOLD_CHANCE } from '../lib/game'
import { useKeys, vibrate } from '../lib/hooks'
import type { Word } from '../lib/types'
import { unseenDeck, useStore } from '../store'

const ROUND = 10

interface DeckCard {
  word: Word
  gold: boolean
}

function CardFace({ card, flipped, onFlip }: { card: DeckCard; flipped: boolean; onFlip: () => void }) {
  const reduce = useReducedMotion()
  const { word, gold } = card
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={(e) => e.key === 'Enter' && onFlip()}
      aria-label={flipped ? 'Bedeutung wird angezeigt' : 'Karte umdrehen'}
      className={`flex h-full flex-col overflow-hidden rounded-deck border p-6 shadow-lift sm:p-8 ${
        gold ? 'border-2 border-gold bg-gold-soft' : 'border-hairline bg-canvas'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <WordMeta word={word} />
        {gold && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[13px] font-semibold text-[#3d2e00]">
            <Sparkle size={14} weight="fill" /> Goldwort ×3
          </span>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {!flipped ? (
          <motion.div
            key="front"
            className="flex flex-1 flex-col justify-center"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <WordTitle word={word} />
            <p className="mt-4 text-[15px] text-steel">Weisst du, was es bedeutet?</p>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className="no-scrollbar mt-5 flex-1 overflow-y-auto"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <WordTitle word={word} compact />
            <div className="mt-4">
              <WordDetails word={word} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!flipped && (
        <div className="flex items-center gap-2 text-sm text-steel">
          <HandTap size={18} /> Tippen für die Bedeutung
        </div>
      )}
    </div>
  )
}

export function Discover() {
  const progress = useStore((s) => s.progress)
  const seed = useStore((s) => s.deckSeed)
  const discover = useStore((s) => s.discover)
  const go = useStore((s) => s.go)

  // Deck einmal pro Runde festlegen; spätere Änderungen am Fortschritt mischen nicht neu.
  const [roundKey, setRoundKey] = useState(0)
  const deck = useMemo<DeckCard[]>(() => {
    const ids = unseenDeck(useStore.getState().progress, seed + roundKey * 7919).slice(0, ROUND)
    return ids.map((id) => ({ word: WORDS_BY_ID[id], gold: Math.random() < GOLD_CHANCE }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey, seed])

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<{ known: number; fresh: number; xp: number }>({ known: 0, fresh: 0, xp: 0 })
  const [pop, setPop] = useState<XpPopData | null>(null)
  const cardRef = useRef<SwipeHandle>(null)

  const card = deck[index]
  const next = deck[index + 1]
  const finished = deck.length > 0 && index >= deck.length

  const handleSwipe = (dir: SwipeDir) => {
    if (!card) return
    const known = dir === 'right'
    const xp = discover(card.word.id, known, { flipped, gold: card.gold })
    vibrate(12)
    setPop({ id: Date.now(), amount: xp })
    setResults((r) => ({ known: r.known + (known ? 1 : 0), fresh: r.fresh + (known ? 0 : 1), xp: r.xp + xp }))
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  const keyMap = useMemo(
    () => ({
      ArrowRight: () => cardRef.current?.swipe('right'),
      ArrowLeft: () => cardRef.current?.swipe('left'),
      ' ': () => setFlipped((f) => !f),
      ArrowUp: () => setFlipped((f) => !f),
    }),
    [],
  )
  useKeys(keyMap, !!card)

  const restart = () => {
    setRoundKey((k) => k + 1)
    setIndex(0)
    setFlipped(false)
    setResults({ known: 0, fresh: 0, xp: 0 })
  }

  if (deck.length === 0) {
    const seen = Object.values(progress).filter((p) => p.box > 0).length
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10 text-center">
        <Confetti size={44} className="mx-auto text-primary" />
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">Du hast alle {seen} Wörter gesehen.</h1>
        <p className="mt-2 text-slate">Neue Wörter kommen mit dem nächsten Update. Bis dahin: festigen, was im Lernstapel liegt.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => go('practice')}>Abfragen starten</Button>
          <Button variant="ghost" onClick={() => go('home')}>
            Zur Übersicht
          </Button>
        </div>
      </div>
    )
  }

  if (finished) {
    const remaining = WORDS.length - Object.values(useStore.getState().progress).filter((p) => p.box > 0).length
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Runde geschafft.</h1>
          <p className="mt-2 text-slate">
            {results.fresh > 0
              ? `${results.fresh} neue Wörter warten im Lernstapel. Frag sie jetzt ab, solange sie frisch sind.`
              : 'Du kanntest alles. Wir prüfen das bei Gelegenheit.'}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            <Card className="bg-tint-peach! border-transparent p-4">
              <div className="text-2xl font-semibold text-tint-ink-peach">{results.fresh}</div>
              <div className="text-sm text-tint-ink-peach">neu</div>
            </Card>
            <Card className="bg-tint-mint! border-transparent p-4">
              <div className="text-2xl font-semibold text-tint-ink-mint">{results.known}</div>
              <div className="text-sm text-tint-ink-mint">gekannt</div>
            </Card>
            <Card className="bg-tint-lavender! border-transparent p-4">
              <div className="text-2xl font-semibold text-tint-ink-lavender">+{results.xp}</div>
              <div className="text-sm text-tint-ink-lavender">XP</div>
            </Card>
          </div>
          <div className="mt-8 flex flex-col gap-2">
            {results.fresh > 0 ? (
              <>
                <Button size="lg" onClick={() => go('practice')}>
                  Jetzt abfragen
                </Button>
                {remaining > 0 && (
                  <Button variant="secondary" onClick={restart}>
                    <ArrowsClockwise size={18} /> Weitere Wörter
                  </Button>
                )}
              </>
            ) : (
              remaining > 0 && (
                <Button size="lg" onClick={restart}>
                  <ArrowsClockwise size={18} /> Weitere Wörter
                </Button>
              )
            )}
            <Button variant="ghost" onClick={() => go('home')}>
              Zur Übersicht
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-6">
      <SessionHeader
        onClose={() => go('home')}
        done={index}
        total={deck.length}
        right={<XpCounter xp={results.xp} />}
        pop={pop}
      />

      <div className="flex flex-1 flex-col justify-center">
      <div className="relative mt-2" style={{ height: 'min(62dvh, 500px)' }}>
        {next && (
          <div className="absolute inset-0 translate-y-3 scale-[0.95] rounded-deck border border-hairline bg-canvas opacity-70" aria-hidden />
        )}
        <SwipeCard
          key={card.word.id}
          ref={cardRef}
          onSwipe={handleSwipe}
          leftLabel="Neu für mich"
          rightLabel="Kenne ich"
        >
          <CardFace card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
        </SwipeCard>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Button variant="secondary" size="lg" className="px-3! text-sm! text-tint-ink-peach! sm:px-6!" onClick={() => cardRef.current?.swipe('left')}>
          <ArrowLeft size={18} weight="bold" className="hidden sm:block" /> Neu für mich
        </Button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="press grid h-13 w-13 place-items-center rounded-btn border border-hairline-strong bg-canvas text-slate hover:bg-surface-soft"
          aria-label="Karte umdrehen"
        >
          <ArrowsClockwise size={20} />
        </button>
        <Button variant="secondary" size="lg" className="px-3! text-sm! text-tint-ink-mint! sm:px-6!" onClick={() => cardRef.current?.swipe('right')}>
          Kenne ich <ArrowRight size={18} weight="bold" className="hidden sm:block" />
        </Button>
      </div>
      <p className="mt-3 hidden text-center text-xs text-steel sm:block">Tastatur: ← neu, → kenne ich, Leertaste dreht um</p>
      </div>
    </div>
  )
}
