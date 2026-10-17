import { ArrowLeft, ArrowRight, Check, HandTap } from '@phosphor-icons/react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useState } from 'react'
import { vibrate } from '../lib/hooks'

export type Gesture = 'right' | 'left' | 'tap'
type Status = 'locked' | 'active' | 'done'

const THRESHOLD = 90

const look = {
  right: { tone: 'bg-tint-mint text-tint-ink-mint', ring: 'ring-tint-ink-mint/50', icon: ArrowRight, verb: 'Nach rechts wischen' },
  left: { tone: 'bg-tint-peach text-tint-ink-peach', ring: 'ring-tint-ink-peach/50', icon: ArrowLeft, verb: 'Nach links wischen' },
  tap: { tone: 'bg-tint-lavender text-tint-ink-lavender', ring: 'ring-tint-ink-lavender/50', icon: HandTap, verb: 'Antippen' },
}

/**
 * Übungskarte fürs Onboarding: Die Geste muss tatsächlich ausgeführt werden
 * (wischen in die richtige Richtung oder antippen), dann gilt sie als gelernt.
 */
export function GestureCard({
  gesture,
  status,
  title,
  text,
  onDone,
}: {
  gesture: Gesture
  status: Status
  title: string
  text: string
  onDone: () => void
}) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-4, 4])
  const [wrong, setWrong] = useState(false)
  const { tone, ring, icon: Icon, verb } = look[gesture]
  const active = status === 'active'
  const done = status === 'done'

  const succeed = () => {
    vibrate(15)
    onDone()
  }

  const fail = () => {
    setWrong(true)
    vibrate([20, 30, 20])
    window.setTimeout(() => setWrong(false), 1400)
  }

  const springBack = () => animate(x, 0, { type: 'spring', stiffness: 420, damping: 30 })

  const nudge = async (dir: 1 | -1) => {
    if (reduce) return
    await animate(x, dir * 120, { type: 'tween', duration: 0.2 })
    springBack()
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (!active) return
    if (gesture === 'right' && e.key === 'ArrowRight') {
      e.preventDefault()
      nudge(1)
      succeed()
    } else if (gesture === 'left' && e.key === 'ArrowLeft') {
      e.preventDefault()
      nudge(-1)
      succeed()
    } else if (gesture === 'tap' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      succeed()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      fail()
    }
  }

  const swipe = gesture !== 'tap'

  return (
    <motion.div
      role="button"
      tabIndex={active ? 0 : -1}
      aria-disabled={!active}
      aria-label={`${title}. ${done ? 'Erledigt' : verb}`}
      onKeyDown={onKey}
      onClick={() => active && gesture === 'tap' && succeed()}
      drag={active && swipe ? 'x' : false}
      dragElastic={0.6}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const dx = info.offset.x
        if (gesture === 'right' && dx > THRESHOLD) succeed()
        else if (gesture === 'left' && dx < -THRESHOLD) succeed()
        else if (Math.abs(dx) > THRESHOLD) fail()
        springBack()
      }}
      whileTap={active && gesture === 'tap' ? { scale: 0.97 } : undefined}
      style={{ x, rotate }}
      animate={{ opacity: status === 'locked' ? 0.45 : 1, scale: done ? 0.98 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`relative flex touch-pan-y select-none items-center gap-4 rounded-card p-4 ${tone} ${
        active ? `cursor-grab shadow-card ring-2 ${ring} active:cursor-grabbing` : ''
      } ${gesture === 'tap' && active ? 'cursor-pointer' : ''}`}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center">
        {done ? (
          <motion.span
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="grid h-8 w-8 place-items-center rounded-full bg-current/15"
          >
            <Check size={20} weight="bold" />
          </motion.span>
        ) : (
          <motion.span
            animate={active && !reduce ? (gesture === 'tap' ? { scale: [1, 0.85, 1] } : { x: gesture === 'right' ? [0, 6, 0] : [0, -6, 0] }) : {}}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon size={26} weight="bold" />
          </motion.span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm opacity-80">
          {done ? 'Geschafft.' : wrong ? 'Andere Richtung, probier es nochmal.' : active ? `${verb}, um es auszuprobieren.` : text}
        </div>
      </div>
    </motion.div>
  )
}
