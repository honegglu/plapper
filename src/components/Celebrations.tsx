import { Crown, Fire, Snowflake, Trophy, X } from '@phosphor-icons/react'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { ACHIEVEMENTS } from '../lib/game'
import { useStore, type AppEvent } from '../store'

function burst(reduce: boolean | null) {
  if (reduce) return
  const colors = ['#5645d4', '#f5d75e', '#ff64c8', '#2a9d99', '#dd5b00']
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.25 }, colors, disableForReducedMotion: true })
}

function content(e: AppEvent) {
  switch (e.type) {
    case 'goal':
      return {
        icon: <Fire size={22} weight="fill" />,
        tone: 'bg-tint-peach text-tint-ink-peach',
        title: 'Tagesziel erreicht!',
        text: e.streak > 1 ? `${e.streak} Tage in Folge. Weiter so.` : 'Deine Serie beginnt heute.',
      }
    case 'rank':
      return {
        icon: <Crown size={22} weight="fill" />,
        tone: 'bg-tint-lavender text-tint-ink-lavender',
        title: `Neuer Rang: ${e.title}`,
        text: `Du bist jetzt auf Rang ${e.level}.`,
      }
    case 'achievement': {
      const a = ACHIEVEMENTS.find((x) => x.id === e.achievementId)
      return {
        icon: <Trophy size={22} weight="fill" />,
        tone: 'bg-tint-yellow text-gold-ink',
        title: `Auszeichnung: ${a?.title ?? ''}`,
        text: a?.description ?? '',
      }
    }
    case 'freeze':
      return {
        icon: <Snowflake size={22} weight="bold" />,
        tone: 'bg-tint-sky text-tint-ink-sky',
        title: 'Serienschutz eingesetzt',
        text: e.days === 1 ? 'Ein verpasster Tag wurde überbrückt.' : `${e.days} verpasste Tage wurden überbrückt.`,
      }
  }
}

/** Zeigt Erfolge als Toasts oben an, mit Konfetti für Tagesziel und Rang. */
export function Celebrations() {
  const events = useStore((s) => s.events)
  const consume = useStore((s) => s.consumeEvent)
  const reduce = useReducedMotion()
  const current = events[0]

  useEffect(() => {
    if (!current) return
    if (current.type === 'goal' || current.type === 'rank') burst(reduce)
    const t = window.setTimeout(() => consume(current.id), current.type === 'achievement' ? 2600 : 3600)
    return () => window.clearTimeout(t)
  }, [current, consume, reduce])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))] lg:justify-end lg:px-6" aria-live="polite">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={reduce ? false : { y: -40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card border border-hairline bg-canvas p-3 shadow-modal"
          >
            {(() => {
              const c = content(current)
              return (
                <>
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-btn ${c.tone}`}>{c.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-sm text-steel">{c.text}</div>
                  </div>
                  <button onClick={() => consume(current.id)} className="grid h-8 w-8 place-items-center rounded-btn text-steel hover:bg-sunken" aria-label="Schliessen">
                    <X size={16} />
                  </button>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
