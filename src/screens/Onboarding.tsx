import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { GestureCard, type Gesture } from '../components/GestureCard'
import { Logo } from '../components/Shell'
import { Button } from '../components/ui'
import { WordMeta, WordTitle } from '../components/WordBits'
import { WORDS, WORDS_BY_ID } from '../data/words'
import { DAILY_GOALS, DEFAULT_GOAL } from '../lib/game'
import { useStore } from '../store'

const PREVIEW = ['petitesse', 'hanebuechen', 'antichambrieren']
  .map((id) => WORDS_BY_ID[id])
  .filter(Boolean)

const GESTURES: { gesture: Gesture; title: string; text: string }[] = [
  { gesture: 'right', title: 'Nach rechts: Kenne ich', text: 'Wir fragen es später trotzdem einmal ab.' },
  { gesture: 'left', title: 'Nach links: Neu für mich', text: 'Das Wort kommt in deinen Lernstapel.' },
  { gesture: 'tap', title: 'Tippen: Bedeutung zeigen', text: 'Ehrlich sein lohnt sich: Neues bringt mehr Punkte.' },
]

function CardFan() {
  const reduce = useReducedMotion()
  const cards = PREVIEW.length === 3 ? PREVIEW : WORDS.slice(0, 3)
  const layout = [
    { rotate: -9, x: -64, y: 18, z: 0, tint: 'bg-tint-sky' },
    { rotate: 7, x: 70, y: 26, z: 1, tint: 'bg-tint-peach' },
    { rotate: -1.5, x: 0, y: 0, z: 2, tint: 'bg-canvas' },
  ]
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[340px] sm:h-[340px]" aria-hidden>
      {cards.map((w, i) => (
        <motion.div
          key={w.id}
          className={`absolute inset-x-6 top-4 flex h-[250px] flex-col justify-between rounded-deck border border-hairline p-6 shadow-lift sm:h-[280px] ${layout[i].tint}`}
          style={{ zIndex: layout[i].z }}
          initial={reduce ? false : { opacity: 0, y: 40, rotate: 0 }}
          animate={{ opacity: 1, y: layout[i].y, x: layout[i].x * 0.6, rotate: layout[i].rotate }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.15 + i * 0.12 }}
        >
          <WordMeta word={w} />
          <WordTitle word={w} />
          <div className="text-sm text-steel">Tippen für die Bedeutung</div>
        </motion.div>
      ))}
    </div>
  )
}

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(DEFAULT_GOAL)
  const [learned, setLearned] = useState(0)
  const allLearned = learned >= GESTURES.length
  const complete = useStore((s) => s.completeOnboarding)
  const go = useStore((s) => s.go)
  const reduce = useReducedMotion()

  const finish = () => {
    complete(goal)
    go('discover')
  }

  const slide = {
    initial: reduce ? false : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: reduce ? undefined : { opacity: 0, x: -24 },
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-8 pt-5 sm:px-8">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex gap-1.5" aria-label={`Schritt ${step + 1} von 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-6 bg-primary' : 'w-3 bg-hairline'}`} />
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section key="s0" {...slide} className="grid flex-1 items-center gap-8 py-8 md:grid-cols-2 md:gap-12">
            <div>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[56px]">
                Wörter, die du noch nicht kennst.
              </h1>
              <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-slate">
                Seltene, echte Wörter aus dem Duden. Wische dich durch, frag dich ab und behalte sie wirklich.
              </p>
              <div className="mt-8">
                <Button size="lg" onClick={() => setStep(1)}>
                  Los geht's <ArrowRight size={18} weight="bold" />
                </Button>
              </div>
            </div>
            <CardFan />
          </motion.section>
        )}

        {step === 1 && (
          <motion.section key="s1" {...slide} className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Wie viel Zeit nimmst du dir?</h1>
            <p className="mt-3 text-slate">Ein kleines Tagesziel hält deine Serie am Leben. Du kannst es jederzeit ändern.</p>
            <div className="mt-8 grid gap-2.5" role="radiogroup" aria-label="Tagesziel">
              {DAILY_GOALS.map((g) => {
                const active = goal === g.xp
                return (
                  <button
                    key={g.xp}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setGoal(g.xp)}
                    className={`press flex items-center gap-4 rounded-card border p-4 text-left ${
                      active ? 'border-primary bg-primary-soft' : 'border-hairline bg-canvas hover:border-hairline-strong'
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                        active ? 'border-primary bg-primary text-on-primary' : 'border-hairline-strong'
                      }`}
                    >
                      {active && <Check size={14} weight="bold" />}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2 font-semibold">
                        {g.label}
                        {g.xp === DEFAULT_GOAL && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-on-primary">Empfohlen</span>
                        )}
                      </span>
                      <span className="text-sm text-steel">{g.hint}</span>
                    </span>
                    <span className="text-sm font-medium tabular-nums text-slate">{g.xp} XP</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)} aria-label="Zurück">
                <ArrowLeft size={18} />
              </Button>
              <Button size="lg" className="flex-1 sm:flex-none" onClick={() => setStep(2)}>
                Weiter <ArrowRight size={18} weight="bold" />
              </Button>
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section key="s2" {...slide} className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">So funktioniert's</h1>
            <p className="mt-3 text-slate">Probier die drei Gesten gleich hier aus.</p>
            <div className="mt-8 grid gap-3">
              {GESTURES.map((g, i) => (
                <GestureCard
                  key={g.gesture}
                  gesture={g.gesture}
                  title={g.title}
                  text={g.text}
                  status={i < learned ? 'done' : i === learned ? 'active' : 'locked'}
                  onDone={() => setLearned((n) => Math.max(n, i + 1))}
                />
              ))}
            </div>
            <p className="mt-6 text-sm text-steel">
              {allLearned
                ? 'Als Startbonus bekommst du 10 XP. Dein Tagesziel ist schon angebrochen.'
                : `Noch ${GESTURES.length - learned} von ${GESTURES.length} Gesten, dann geht's los.`}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} aria-label="Zurück">
                <ArrowLeft size={18} />
              </Button>
              <Button size="lg" className="flex-1 sm:flex-none" onClick={finish} disabled={!allLearned}>
                Erste Wörter entdecken <ArrowRight size={18} weight="bold" />
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
