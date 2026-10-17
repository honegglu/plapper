import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useImperativeHandle, useRef, type ReactNode, type Ref } from 'react'

export type SwipeDir = 'left' | 'right'
export interface SwipeHandle {
  swipe: (dir: SwipeDir) => void
}

/**
 * Wischbare Karte im Tinder-Stil. Zieht man sie weit genug nach links oder rechts
 * (oder schnell genug), fliegt sie raus und `onSwipe` wird ausgelöst.
 */
export function SwipeCard({
  children,
  onSwipe,
  leftLabel,
  rightLabel,
  leftClass = 'bg-tint-peach text-tint-ink-peach border-tint-ink-peach/40',
  rightClass = 'bg-tint-mint text-tint-ink-mint border-tint-ink-mint/40',
  disabled = false,
  className = '',
  ref,
}: {
  children: ReactNode
  onSwipe: (dir: SwipeDir) => void
  leftLabel: string
  rightLabel: string
  leftClass?: string
  rightClass?: string
  disabled?: boolean
  className?: string
  ref?: Ref<SwipeHandle>
}) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-14, 14])
  const rightOpacity = useTransform(x, [20, 110], [0, 1])
  const leftOpacity = useTransform(x, [-110, -20], [1, 0])

  const gone = useRef(false)
  const dragged = useRef(false)
  const fly = (dir: SwipeDir) => {
    if (gone.current) return
    gone.current = true
    const target = (dir === 'right' ? 1 : -1) * Math.max(560, window.innerWidth)
    if (reduce) {
      onSwipe(dir)
      return
    }
    animate(x, target, { type: 'tween', duration: 0.28, ease: [0.4, 0, 1, 1] }).then(() => onSwipe(dir))
  }

  useImperativeHandle(ref, () => ({ swipe: fly }))

  return (
    <motion.div
      className={`absolute inset-0 touch-pan-y select-none ${disabled ? '' : 'cursor-grab active:cursor-grabbing'} ${className}`}
      style={{ x, rotate }}
      drag={disabled ? false : 'x'}
      dragElastic={0.9}
      dragMomentum={false}
      onPointerDownCapture={() => {
        dragged.current = false
      }}
      onDragStart={() => {
        dragged.current = true
      }}
      onClickCapture={(e) => {
        // Nach einem Wischversuch kein Klick (sonst dreht sich die Karte ungewollt um)
        if (dragged.current) {
          e.stopPropagation()
          dragged.current = false
        }
      }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110 || info.velocity.x > 650) fly('right')
        else if (info.offset.x < -110 || info.velocity.x < -650) fly('left')
        else animate(x, 0, { type: 'spring', stiffness: 420, damping: 30 })
      }}
      initial={reduce ? false : { scale: 0.94, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      {children}
      <motion.div
        style={{ opacity: rightOpacity }}
        className={`pointer-events-none absolute left-5 top-5 -rotate-6 rounded-btn border-2 px-3 py-1.5 text-sm font-semibold ${rightClass}`}
      >
        {rightLabel}
      </motion.div>
      <motion.div
        style={{ opacity: leftOpacity }}
        className={`pointer-events-none absolute right-5 top-5 rotate-6 rounded-btn border-2 px-3 py-1.5 text-sm font-semibold ${leftClass}`}
      >
        {leftLabel}
      </motion.div>
    </motion.div>
  )
}
