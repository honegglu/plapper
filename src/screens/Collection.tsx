import { Heart, MagnifyingGlass, X } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui'
import { WordDetails, WordMeta, WordTitle } from '../components/WordBits'
import { WORDS, WORDS_BY_ID } from '../data/words'
import { daysBetween, dayKey } from '../lib/date'
import { MASTERED_BOX } from '../lib/game'
import { useSpell } from '../lib/hooks'
import type { Word, WordProgress } from '../lib/types'
import { counts, useStore } from '../store'

type Tab = 'learning' | 'mastered' | 'favorites' | 'all'

function statusText(p: WordProgress | undefined) {
  if (!p || p.box === 0) return 'Noch nicht entdeckt'
  if (p.box >= MASTERED_BOX) return 'Gemeistert'
  if (p.claimed) return 'Kenne ich (wird geprüft)'
  const d = daysBetween(dayKey(), p.due)
  return d <= 0 ? 'Heute fällig' : d === 1 ? 'Morgen fällig' : `Fällig in ${d} Tagen`
}

/** Stufen 1 bis 6 als kleine Balken: zeigt den echten Lernstand. */
function Stages({ box }: { box: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Stufe ${Math.min(box, MASTERED_BOX)} von ${MASTERED_BOX}`}>
      {Array.from({ length: MASTERED_BOX }, (_, i) => (
        <span key={i} className={`h-1.5 w-3 rounded-full ${i < box ? (box >= MASTERED_BOX ? 'bg-success' : 'bg-primary') : 'bg-hairline'}`} />
      ))}
    </div>
  )
}

export function WordSheet({ word, onClose }: { word: Word | null; onClose: () => void }) {
  const progress = useStore((s) => (word ? s.progress[word.id] : undefined))
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const discover = useStore((s) => s.discover)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!word) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [word, onClose])

  return (
    <AnimatePresence>
      {word && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#070f24]/45" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={word.word}
            initial={reduce ? false : { y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="pb-safe relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-deck bg-canvas p-6 shadow-modal sm:rounded-deck sm:p-8"
          >
            <div className="flex items-start justify-between gap-3">
              <WordMeta word={word} />
              <button onClick={onClose} className="press -mr-2 -mt-2 grid h-10 w-10 place-items-center rounded-btn text-slate hover:bg-sunken" aria-label="Schliessen">
                <X size={20} />
              </button>
            </div>
            <WordTitle word={word} className="mt-4" />
            <div className="mt-5">
              <WordDetails word={word} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-slate">{statusText(progress)}</div>
                {progress && progress.box > 0 && <Stages box={progress.box} />}
              </div>
              <div className="flex gap-2">
                {(!progress || progress.box === 0) && (
                  <Button size="sm" onClick={() => discover(word.id, false, { flipped: true, gold: false })}>
                    In den Lernstapel
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleFavorite(word.id)}
                  aria-pressed={!!progress?.favorite}
                  className={progress?.favorite ? 'text-tint-ink-rose!' : ''}
                >
                  <Heart size={16} weight={progress?.favorite ? 'fill' : 'regular'} />
                  {progress?.favorite ? 'Lieblingswort' : 'Merken'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Collection() {
  const progress = useStore((s) => s.progress)
  const go = useStore((s) => s.go)
  const s = useSpell()
  const [tab, setTab] = useState<Tab>('learning')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Word | null>(null)
  const c = counts(progress)

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'learning', label: 'Lernstapel', n: c.learning + c.claimed },
    { id: 'mastered', label: 'Gemeistert', n: c.mastered },
    { id: 'favorites', label: 'Lieblingswörter', n: c.favorites },
    { id: 'all', label: 'Alle Wörter', n: WORDS.length },
  ]

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = WORDS.filter((w) => {
      const p = progress[w.id]
      if (tab === 'learning' && !(p && p.box > 0 && p.box < MASTERED_BOX)) return false
      if (tab === 'mastered' && !(p && p.box >= MASTERED_BOX)) return false
      if (tab === 'favorites' && !p?.favorite) return false
      if (!q) return true
      return (
        s(w.word).toLowerCase().includes(q) || w.word.toLowerCase().includes(q) || s(w.definition).toLowerCase().includes(q)
      )
    })
    return items.sort((a, b) => a.word.replace(/^sich /, '').localeCompare(b.word.replace(/^sich /, ''), 'de'))
  }, [progress, tab, query, s])

  // In "Alle Wörter" bleiben unentdeckte Wörter verdeckt, damit Entdecken spannend bleibt.
  const hidden = (w: Word) => tab === 'all' && !(progress[w.id] && progress[w.id].box > 0) && !query

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-4xl">Sammlung</h1>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`press shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'border-ink bg-ink text-page' : 'border-hairline text-steel hover:text-ink'
            }`}
          >
            {t.label} <span className="ml-1 tabular-nums opacity-70">{t.n}</span>
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Wörter durchsuchen</span>
        <div className="flex h-11 items-center gap-2 rounded-btn border border-hairline bg-surface-soft px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <MagnifyingGlass size={18} className="text-steel" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wort oder Bedeutung suchen"
            className="h-full flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-steel"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Suche leeren" className="text-steel">
              <X size={16} />
            </button>
          )}
        </div>
      </label>

      {list.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-hairline-strong p-8 text-center">
          <p className="font-medium">
            {query
              ? 'Keine Treffer.'
              : tab === 'learning'
                ? 'Dein Lernstapel ist leer.'
                : tab === 'mastered'
                  ? 'Noch nichts gemeistert.'
                  : 'Noch keine Lieblingswörter.'}
          </p>
          <p className="mt-1 text-sm text-steel">
            {tab === 'mastered'
              ? 'Ein Wort gilt als gemeistert, wenn du es über mehrere Wochen hinweg fünfmal richtig hattest.'
              : tab === 'favorites'
                ? 'Tippe bei einem Wort auf "Merken".'
                : 'Entdecke neue Wörter, um ihn zu füllen.'}
          </p>
          {tab === 'learning' && !query && (
            <Button className="mt-5" onClick={() => go('discover')}>
              Wörter entdecken
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-2.5 md:grid-cols-2">
          {list.map((w) => {
            const p = progress[w.id]
            const hide = hidden(w)
            return (
              <button
                key={w.id}
                onClick={() => (hide ? undefined : setOpen(WORDS_BY_ID[w.id]))}
                disabled={hide}
                className="press flex flex-col gap-1.5 rounded-card border border-hairline bg-canvas p-4 text-left enabled:hover:border-hairline-strong disabled:cursor-default"
              >
                <div className="flex w-full items-baseline justify-between gap-3">
                  <span lang="de" className="hyphenate text-[17px] font-semibold tracking-[-0.01em]">
                    {w.article && <span className="mr-1 font-normal text-steel">{w.article}</span>}
                    {s(w.word)}
                  </span>
                  {p?.favorite && <Heart size={16} weight="fill" className="shrink-0 text-tint-ink-rose" />}
                </div>
                {hide ? (
                  <span className="text-sm text-stone">Noch nicht entdeckt</span>
                ) : (
                  <span lang="de" className="line-clamp-2 text-sm text-slate">
                    {s(w.definition)}
                  </span>
                )}
                {p && p.box > 0 && (
                  <div className="mt-1 flex w-full items-center justify-between gap-2">
                    <Stages box={p.box} />
                    <span className="text-xs text-steel">{statusText(p)}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <WordSheet word={open} onClose={() => setOpen(null)} />
    </div>
  )
}
