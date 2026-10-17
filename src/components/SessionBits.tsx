import { X } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Bar } from './ui'

/** Kopfzeile in Lernrunden: Schliessen, Fortschritt, Punkte. */
export function SessionHeader({
  onClose,
  done,
  total,
  right,
  pop = null,
}: {
  onClose: () => void
  done: number
  total: number
  right?: ReactNode
  pop?: XpPopData | null
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={onClose} className="press -ml-2 grid h-10 w-10 place-items-center rounded-btn text-slate hover:bg-sunken" aria-label="Runde beenden">
        <X size={22} />
      </button>
      <Bar value={total ? done / total : 0} className="flex-1" />
      <div className="relative min-w-[64px] text-right">
        {right}
        <XpPop pop={pop} />
      </div>
    </div>
  )
}

export interface XpPopData {
  id: number
  amount: number
}

/** Kurz aufsteigendes "+12" direkt unter dem XP-Zähler, ohne die Karte zu verdecken. */
function XpPop({ pop }: { pop: XpPopData | null }) {
  const reduce = useReducedMotion()
  return (
    <div className="pointer-events-none absolute right-0 top-full z-20" aria-live="polite">
      <AnimatePresence>
        {pop && (
          <motion.div
            key={pop.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduce ? { opacity: [0, 1, 1, 0] } : { opacity: [0, 1, 1, 0], y: [8, 0, -4, -14] }}
            transition={{ duration: 1.2, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
            className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-xs font-semibold tabular-nums text-on-primary"
          >
            +{pop.amount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** XP-Zähler, der beim Hochzählen kurz aufspringt. */
export function XpCounter({ xp }: { xp: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      key={xp}
      initial={reduce || xp === 0 ? false : { scale: 1.25 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="inline-block origin-right text-sm font-semibold tabular-nums text-primary-ink"
    >
      {xp} XP
    </motion.span>
  )
}
