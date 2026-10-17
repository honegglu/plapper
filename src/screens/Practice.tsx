import { ArrowLeft, ArrowRight, Books, Check, Fire, Lightning, Scroll, Sparkle, X } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SessionHeader, XpCounter, type XpPopData } from '../components/SessionBits'
import { SwipeCard, type SwipeDir, type SwipeHandle } from '../components/SwipeCard'
import { Button, Card, ProgressRing } from '../components/ui'
import { Etymology, WordMeta, WordTitle } from '../components/WordBits'
import { comboMultiplier, MASTERED_BOX, XP } from '../lib/game'
import { useKeys, useSpell, vibrate } from '../lib/hooks'
import { buildRound, type Question } from '../lib/quiz'
import { coreWord } from '../lib/text'
import type { Word } from '../lib/types'
import { dueWordIds, todayXp, useStore } from '../store'

interface Answer {
  correct: boolean
  choiceId?: string
  xp: number
  label?: string
}

const PROMPTS: Record<Question['kind'], string> = {
  meaning: 'Was bedeutet das Wort?',
  word: 'Welches Wort passt zur Bedeutung?',
  cloze: 'Welches Wort fehlt im Satz?',
  truefalse: 'Stimmt die Bedeutung?',
}

function optionState(q: Question, opt: Word, answer: Answer | null) {
  if (!answer) return 'idle'
  if (opt.id === q.word.id) return 'right'
  if (opt.id === answer.choiceId) return 'wrong'
  return 'dim'
}

const optionClass = {
  idle: 'border-hairline bg-canvas hover:border-primary/60 hover:bg-primary-soft/40',
  right: 'border-success bg-success-soft text-success-ink',
  wrong: 'border-error bg-error-soft text-error-ink',
  dim: 'border-hairline bg-canvas text-steel',
}

function Options({ q, answer, onChoose }: { q: Exclude<Question, { kind: 'truefalse' }>; answer: Answer | null; onChoose: (w: Word) => void }) {
  const s = useSpell()
  const asDefinitions = q.kind === 'meaning'
  return (
    <div className={`grid gap-2.5 ${asDefinitions ? '' : 'sm:grid-cols-2'}`}>
      {q.options.map((opt, i) => {
        const st = optionState(q, opt, answer)
        return (
          <button
            key={opt.id}
            disabled={!!answer}
            onClick={() => onChoose(opt)}
            className={`press flex min-h-14 items-center gap-3 rounded-card border px-4 py-3 text-left ${optionClass[st]}`}
          >
            <span className="hidden h-6 w-6 shrink-0 place-items-center rounded-[6px] border border-hairline text-xs font-semibold text-steel sm:grid">
              {i + 1}
            </span>
            <span lang="de" className={`hyphenate flex-1 ${asDefinitions ? 'text-[15px] leading-snug' : 'text-[17px] font-semibold tracking-[-0.01em]'}`}>
              {asDefinitions ? s(opt.definition) : s(q.kind === 'cloze' ? coreWord(opt.word) : opt.word)}
            </span>
            {st === 'right' && <Check size={20} weight="bold" className="shrink-0" />}
            {st === 'wrong' && <X size={20} weight="bold" className="shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}

function Prompt({ q }: { q: Question }) {
  const s = useSpell()
  if (q.kind === 'meaning') {
    return (
      <div>
        <WordMeta word={q.word} />
        <WordTitle word={q.word} className="mt-4" />
      </div>
    )
  }
  if (q.kind === 'word') {
    return (
      <div>
        <WordMeta word={q.word} />
        <p lang="de" className="mt-4 text-2xl font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-[28px]">
          {s(q.word.definition)}
        </p>
      </div>
    )
  }
  if (q.kind === 'cloze') {
    return (
      <p lang="de" className="text-xl font-medium leading-relaxed text-charcoal sm:text-2xl">
        {s(q.before)}
        <span className="mx-1 inline-block min-w-24 border-b-2 border-primary align-baseline">&nbsp;</span>
        {s(q.after)}
      </p>
    )
  }
  return null
}

function Feedback({ q, answer, onNext, onHold }: { q: Question; answer: Answer; onNext: () => void; onHold: () => void }) {
  const s = useSpell()
  const reduce = useReducedMotion()
  const [showOrigin, setShowOrigin] = useState(false)
  const hasOrigin = !!(q.word.etymology ?? q.word.origin)
  const showSolution = !answer.correct || q.kind !== 'meaning'
  return (
    <motion.div
      initial={reduce ? false : { y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`rounded-card border p-4 ${answer.correct ? 'border-success/30 bg-success-soft' : 'border-error/30 bg-error-soft'}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
            answer.correct ? 'bg-success text-white' : 'bg-error text-white'
          }`}
        >
          {answer.correct ? <Check size={18} weight="bold" /> : <X size={18} weight="bold" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`font-semibold ${answer.correct ? 'text-success-ink' : 'text-error-ink'}`}>
            {answer.correct ? `Richtig! +${answer.xp} XP` : 'Nicht ganz. Das Wort kommt bald wieder.'}
            {answer.label && <span className="font-medium"> · {answer.label}</span>}
          </div>
          {showSolution && (
            <p lang="de" className="mt-1 text-[15px] leading-snug text-charcoal">
              <span className="font-semibold">{s(q.word.word)}</span>: {s(q.word.definition)}
            </p>
          )}
          {hasOrigin && !showOrigin && (
            <button
              onClick={() => {
                onHold()
                setShowOrigin(true)
              }}
              className="press mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink underline-offset-2 hover:underline"
            >
              <Scroll size={15} weight="bold" /> Woher kommt das Wort?
            </button>
          )}
        </div>
      </div>
      {showOrigin && <Etymology word={q.word} className="mt-3 bg-canvas/70!" />}
      <Button className="mt-4 w-full" onClick={onNext}>
        Weiter <ArrowRight size={18} weight="bold" />
      </Button>
    </motion.div>
  )
}

export function Practice() {
  const go = useStore((s) => s.go)
  const answerWord = useStore((s) => s.answer)
  const finishRound = useStore((s) => s.finishRound)
  const reduce = useReducedMotion()
  const s = useSpell()

  const [round, setRound] = useState(() => buildRound(useStore.getState().progress))
  const { questions, extra } = round
  const [qi, setQi] = useState(0)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [combo, setCombo] = useState(0)
  const [stats, setStats] = useState({ correct: 0, xp: 0, bestCombo: 0, promoted: 0, mastered: 0 })
  const [pop, setPop] = useState<XpPopData | null>(null)
  const [bonus, setBonus] = useState<number | null>(null)
  const shownAt = useRef(Date.now())
  const timer = useRef<number | undefined>(undefined)
  const swipeRef = useRef<SwipeHandle>(null)

  const q = questions[qi]
  const finished = questions.length > 0 && qi >= questions.length

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (finished && bonus === null) {
      const perfect = stats.correct === questions.length
      setBonus(finishRound({ perfect, bestCombo: stats.bestCombo, questions: questions.length }))
    }
  }, [finished, bonus, stats, questions.length, finishRound])

  const next = () => {
    window.clearTimeout(timer.current)
    setAnswer(null)
    setQi((i) => i + 1)
    shownAt.current = Date.now()
  }

  const submit = (correct: boolean, choiceId?: string) => {
    if (!q || answer) return
    const fast = Date.now() - shownAt.current < 6000
    const before = useStore.getState().progress[q.word.id]?.box ?? 1
    let xp = 0
    let label: string | undefined
    const newCombo = correct ? combo + 1 : 0
    if (correct) {
      const mult = comboMultiplier(newCombo)
      xp = Math.round(XP.correct * mult) + (fast ? XP.fastBonus : 0)
      if (q.gold) xp *= XP.goldMultiplier
      label = q.gold ? 'Goldwort ×3' : mult > 1 ? `Kombo ×${mult}` : fast ? 'Blitzschnell' : undefined
    }
    answerWord(q.word.id, correct, xp)
    const after = useStore.getState().progress[q.word.id]?.box ?? 1
    setCombo(newCombo)
    setStats((st) => ({
      correct: st.correct + (correct ? 1 : 0),
      xp: st.xp + xp,
      bestCombo: Math.max(st.bestCombo, newCombo),
      promoted: st.promoted + (after > before ? 1 : 0),
      mastered: st.mastered + (after >= MASTERED_BOX && before < MASTERED_BOX ? 1 : 0),
    }))
    setAnswer({ correct, choiceId, xp, label })
    if (correct) {
      vibrate(15)
      setPop({ id: Date.now(), amount: xp })
      timer.current = window.setTimeout(next, q.kind === 'meaning' ? 1100 : 1800)
    } else {
      vibrate([30, 40, 30])
    }
  }

  const onSwipe = (dir: SwipeDir) => {
    if (!q || q.kind !== 'truefalse') return
    const isMatch = q.shown.id === q.word.id
    submit((dir === 'right') === isMatch)
  }

  const keyMap = useMemo(() => {
    const m: Record<string, () => void> = {}
    if (!q) return m
    if (answer) {
      m.Enter = next
      m[' '] = next
    } else if (q.kind === 'truefalse') {
      m.ArrowRight = () => swipeRef.current?.swipe('right')
      m.ArrowLeft = () => swipeRef.current?.swipe('left')
    } else {
      q.options.forEach((o, i) => {
        m[String(i + 1)] = () => submit(o.id === q.word.id, o.id)
      })
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, answer, combo])
  useKeys(keyMap, !finished)

  /* ---------- Leerer Lernstapel ---------- */
  if (questions.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="grid h-14 w-14 place-items-center rounded-card bg-tint-lavender text-tint-ink-lavender">
          <Books size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">Dein Lernstapel ist noch leer.</h1>
        <p className="mt-2 text-slate">
          Entdecke zuerst ein paar Wörter. Alles, was neu für dich ist, landet hier und wird in klugen Abständen abgefragt.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={() => go('discover')}>
            Wörter entdecken
          </Button>
          <Button variant="ghost" onClick={() => go('home')}>
            Zur Übersicht
          </Button>
        </div>
      </div>
    )
  }

  /* ---------- Zusammenfassung ---------- */
  if (finished) {
    const st = useStore.getState()
    const due = dueWordIds(st.progress).length
    const today = todayXp(st)
    const goalDone = today >= st.dailyGoal
    const accuracy = Math.round((stats.correct / questions.length) * 100)
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            {accuracy === 100 ? 'Makellos.' : accuracy >= 70 ? 'Starke Runde.' : 'Gut gekämpft.'}
          </h1>
          <p className="mt-2 text-slate">
            {stats.correct} von {questions.length} richtig.
            {stats.promoted > 0 && ` ${stats.promoted} ${stats.promoted === 1 ? 'Wort ist' : 'Wörter sind'} eine Stufe aufgestiegen.`}
            {stats.mastered > 0 && ` ${stats.mastered} gemeistert!`}
          </p>

          <Card className="mt-6 flex items-center gap-5 p-5">
            <ProgressRing value={today / st.dailyGoal} size={76} stroke={7} color={goalDone ? 'var(--success)' : 'var(--primary)'}>
              <span className="text-sm font-semibold tabular-nums">{Math.min(100, Math.round((today / st.dailyGoal) * 100))}%</span>
            </ProgressRing>
            <div>
              <div className="font-semibold">{goalDone ? 'Tagesziel erreicht' : `Noch ${st.dailyGoal - today} XP bis zum Tagesziel`}</div>
              <div className="text-sm text-steel">
                +{stats.xp + (bonus ?? 0)} XP in dieser Runde{bonus ? ` (inkl. ${bonus} Bonus)` : ''}
              </div>
            </div>
          </Card>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Card className="border-transparent bg-tint-peach! p-4 text-tint-ink-peach">
              <div className="flex items-center gap-1.5 text-2xl font-semibold">
                <Fire size={22} weight="fill" /> {stats.bestCombo}
              </div>
              <div className="text-sm">beste Kombo</div>
            </Card>
            <Card className="border-transparent bg-tint-sky! p-4 text-tint-ink-sky">
              <div className="text-2xl font-semibold">{accuracy}%</div>
              <div className="text-sm">Trefferquote</div>
            </Card>
          </div>

          <div className="mt-8 flex flex-col gap-2">
            {due > 0 ? (
              <Button
                size="lg"
                onClick={() => {
                  setRound(buildRound(useStore.getState().progress))
                  setQi(0)
                  setAnswer(null)
                  setCombo(0)
                  setStats({ correct: 0, xp: 0, bestCombo: 0, promoted: 0, mastered: 0 })
                  setBonus(null)
                  shownAt.current = Date.now()
                }}
              >
                Noch eine Runde ({due} fällig)
              </Button>
            ) : (
              <Button size="lg" onClick={() => go('discover')}>
                Neue Wörter entdecken
              </Button>
            )}
            <Button variant="ghost" onClick={() => go('home')}>
              Zur Übersicht
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ---------- Frage ---------- */
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-6">
      <SessionHeader
        onClose={() => go('home')}
        done={qi + (answer ? 1 : 0)}
        total={questions.length}
        right={
          combo >= 3 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-tint-peach px-2 py-1 text-sm font-semibold text-tint-ink-peach">
              <Fire size={16} weight="fill" /> ×{comboMultiplier(combo)}
            </span>
          ) : (
            <XpCounter xp={stats.xp} />
          )
        }
        pop={pop}
      />

      {extra && qi === 0 && !answer && (
        <div className="mb-3 rounded-card bg-tint-sky px-4 py-3 text-sm text-tint-ink-sky">
          Gerade ist nichts fällig. Das ist eine Extrarunde mit Wörtern, die bald drankommen.
        </div>
      )}

      <div className="flex items-center gap-2 text-sm font-medium text-steel">
        <Lightning size={16} weight="fill" className="text-primary" />
        {PROMPTS[q.kind]}
        {q.gold && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[13px] font-semibold text-[#3d2e00]">
            <Sparkle size={13} weight="fill" /> ×3
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qi}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-4 flex flex-1 flex-col"
        >
          {q.kind === 'truefalse' ? (
            <>
              <div className="relative" style={{ height: 'min(48dvh, 400px)' }}>
                {!answer ? (
                  <SwipeCard ref={swipeRef} onSwipe={onSwipe} leftLabel="Stimmt nicht" rightLabel="Stimmt">
                    <div
                      className={`flex h-full flex-col rounded-deck border p-6 shadow-lift sm:p-8 ${
                        q.gold ? 'border-2 border-gold bg-gold-soft' : 'border-hairline bg-canvas'
                      }`}
                    >
                      <WordMeta word={q.word} />
                      <WordTitle word={q.word} className="mt-5" />
                      <div className="mt-auto border-t border-hairline pt-5">
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-steel">Bedeutung</div>
                        <p lang="de" className="mt-2 text-lg font-medium leading-snug text-charcoal">
                          {s(q.shown.definition)}
                        </p>
                      </div>
                    </div>
                  </SwipeCard>
                ) : (
                  <div className="absolute inset-0 flex flex-col rounded-deck border border-hairline bg-canvas p-6 sm:p-8">
                    <WordMeta word={q.word} />
                    <WordTitle word={q.word} className="mt-5" compact />
                    <p lang="de" className="mt-4 text-[15px] italic leading-relaxed text-slate">
                      „{s(q.word.example)}“
                    </p>
                  </div>
                )}
              </div>
              {!answer && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button variant="secondary" size="lg" className="text-error-ink!" onClick={() => swipeRef.current?.swipe('left')}>
                    <ArrowLeft size={18} weight="bold" /> Stimmt nicht
                  </Button>
                  <Button variant="secondary" size="lg" className="text-success-ink!" onClick={() => swipeRef.current?.swipe('right')}>
                    Stimmt <ArrowRight size={18} weight="bold" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <Card className={`p-6 sm:p-7 ${q.gold ? 'border-2 border-gold! bg-gold-soft!' : ''}`}>
                <Prompt q={q} />
              </Card>
              <div className="mt-4">
                <Options q={q} answer={answer} onChoose={(w) => submit(w.id === q.word.id, w.id)} />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {answer && (
        <div className="mt-4">
          <Feedback q={q} answer={answer} onNext={next} onHold={() => window.clearTimeout(timer.current)} />
        </div>
      )}
    </div>
  )
}
