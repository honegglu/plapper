import { X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Bar } from './ui'

/** Kopfzeile in Lernrunden: Schliessen, Fortschritt, Punkte. */
export function SessionHeader({
  onClose,
  done,
  total,
  right,
}: {
  onClose: () => void
  done: number
  total: number
  right?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={onClose} className="press -ml-2 grid h-10 w-10 place-items-center rounded-btn text-slate hover:bg-sunken" aria-label="Runde beenden">
        <X size={22} />
      </button>
      <Bar value={total ? done / total : 0} className="flex-1" />
      <div className="min-w-[64px] text-right">{right}</div>
    </div>
  )
}

/** Kurz aufsteigende "+12 XP"-Anzeige. */
export function XpPop({ pop }: { pop: { id: number; amount: number; label?: string } | null }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[38%] z-20 flex justify-center">
      <AnimatePresence>
        {pop && (
          <motion.div
            key={pop.id}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-page shadow-modal"
          >
            +{pop.amount} XP{pop.label ? ` · ${pop.label}` : ''}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
