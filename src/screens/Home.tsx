import { ArrowRight, BookmarkSimple, Check, Crown, Fire, Lightning, Snowflake, Sparkle } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { WordDetails, WordMeta, WordTitle } from '../components/WordBits'
import { Bar, Button, Card, ProgressRing } from '../components/ui'
import { WORDS } from '../data/words'
import { dayKey, hoursUntilMidnight, lastDays, weekdayShort } from '../lib/date'
import { MASTERED_BOX, rankFor } from '../lib/game'
import { hashString } from '../lib/random'
import { counts, dueWordIds, todayXp, useStore, visibleStreak } from '../store'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Gute Nacht'
  if (h < 11) return 'Guten Morgen'
  if (h < 17) return 'Guten Tag'
  return 'Guten Abend'
}

function wordOfTheDay() {
  return WORDS[hashString(`wdt-${dayKey()}`) % WORDS.length]
}

export function Home() {
  const st = useStore()
  const reduce = useReducedMotion()
  const today = todayXp(st)
  const goal = st.dailyGoal
  const goalDone = today >= goal
  const streak = visibleStreak(st)
  const due = dueWordIds(st.progress).length
  const c = counts(st.progress)
  const rank = rankFor(st.xpTotal)
  const wotd = wordOfTheDay()
  const wotdProgress = st.progress[wotd.id]
  const week = lastDays(7)
  const hours = hoursUntilMidnight()

  // Nudge: Fällige Wiederholungen haben Vorrang vor neuen Wörtern
  const primary =
    due > 0
      ? { label: `${due} ${due === 1 ? 'Wort' : 'Wörter'} wiederholen`, to: 'practice' as const }
      : { label: 'Neue Wörter entdecken', to: 'discover' as const }

  const rise = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { type: 'spring' as const, stiffness: 160, damping: 22, delay: i * 0.05 },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-steel">{greeting()}</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-4xl">Heute</h1>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
              streak > 0 ? 'border-transparent bg-tint-peach text-tint-ink-peach' : 'border-hairline text-steel'
            }`}
            title="Tage in Folge mit erreichtem Tagesziel"
          >
            <Fire size={18} weight="fill" /> {streak}
          </div>
          {st.freezes > 0 && (
            <div
              className="inline-flex items-center gap-1 rounded-full bg-tint-sky px-3 py-1.5 text-sm font-semibold text-tint-ink-sky"
              title="Serienschutz: rettet deine Serie an einem verpassten Tag"
            >
              <Snowflake size={16} weight="bold" /> {st.freezes}
            </div>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        {/* Tagesziel */}
        <motion.div {...rise(0)} className="lg:col-span-7">
          <Card className="h-full p-5 sm:p-6">
            <div className="flex items-center gap-5">
              <ProgressRing value={today / goal} size={96} stroke={9} color={goalDone ? 'var(--success)' : 'var(--primary)'}>
                {goalDone ? (
                  <Check size={34} weight="bold" className="text-success" />
                ) : (
                  <div className="text-center leading-none">
                    <div className="text-xl font-semibold tabular-nums">{today}</div>
                    <div className="mt-1 text-[11px] text-steel">von {goal}</div>
                  </div>
                )}
              </ProgressRing>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-[-0.01em]">
                  {goalDone ? 'Tagesziel erreicht.' : today === 0 ? 'Dein Tagesziel wartet.' : `Noch ${goal - today} XP.`}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate">
                  {goalDone
                    ? 'Deine Serie ist für heute gesichert. Alles Weitere ist Bonus.'
                    : today === 0
                      ? `${goal} XP sind etwa eine Abfragerunde.`
                      : 'Du bist schon unterwegs. Eine kurze Runde reicht.'}
                </p>
              </div>
            </div>

            {!goalDone && streak > 0 && (
              <div className="mt-5 flex items-start gap-2.5 rounded-btn bg-tint-rose px-3.5 py-3 text-sm text-tint-ink-rose">
                <Fire size={18} weight="fill" className="mt-px shrink-0" />
                <span>
                  Deine Serie von {streak} {streak === 1 ? 'Tag' : 'Tagen'} endet in {hours} {hours === 1 ? 'Stunde' : 'Stunden'}, wenn du heute nicht übst.
                </span>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="sm:flex-1" onClick={() => st.go(primary.to)}>
                {primary.to === 'practice' ? <Lightning size={18} weight="fill" /> : <Sparkle size={18} weight="fill" />}
                {primary.label}
              </Button>
              {primary.to === 'practice' && (
                <Button variant="secondary" size="lg" onClick={() => st.go('discover')}>
                  Entdecken
                </Button>
              )}
            </div>

            {/* Wochenstreifen */}
            <div className="mt-6 grid grid-cols-7 gap-1.5" aria-label="Letzte 7 Tage">
              {week.map((d) => {
                const xp = st.xpByDay[d] ?? 0
                const reached = xp >= goal
                const isToday = d === dayKey()
                return (
                  <div key={d} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-full text-xs font-semibold ${
                        reached
                          ? 'bg-orange text-white'
                          : xp > 0
                            ? 'bg-tint-peach text-tint-ink-peach'
                            : isToday
                              ? 'border-2 border-dashed border-hairline-strong text-steel'
                              : 'bg-sunken text-stone'
                      }`}
                      title={`${xp} XP`}
                    >
                      {reached ? <Fire size={16} weight="fill" /> : xp > 0 ? xp : ''}
                    </div>
                    <span className={`text-[11px] ${isToday ? 'font-semibold text-ink' : 'text-steel'}`}>{weekdayShort(d)}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* Rang */}
        <motion.div {...rise(1)} className="lg:col-span-5">
          <Card className="flex h-full flex-col border-transparent bg-tint-lavender! p-5 text-tint-ink-lavender sm:p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Crown size={18} weight="fill" /> Rang {rank.level}
            </div>
            <div className="mt-2 text-[28px] font-semibold tracking-[-0.03em]">{rank.title}</div>
            <div className="mt-auto pt-6">
              <Bar value={rank.progress} color="bg-primary" className="bg-white/60 dark:bg-white/10" />
              <div className="mt-2 flex justify-between text-sm">
                <span className="tabular-nums">{st.xpTotal} XP</span>
                {rank.nextTitle && (
                  <span>
                    noch {rank.toNext} bis <span className="font-semibold">{rank.nextTitle}</span>
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Wort des Tages */}
        <motion.div {...rise(2)} className="lg:col-span-7">
          <div className="h-full rounded-card bg-tint-yellow-bold p-5 text-charcoal sm:p-7 dark:bg-tint-yellow">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gold-ink">Wort des Tages</span>
              <WordMeta word={wotd} />
            </div>
            <WordTitle word={wotd} className="mt-4" />
            <div className="mt-4">
              <WordDetails word={wotd} />
            </div>
            <div className="mt-5">
              {!wotdProgress || wotdProgress.box === 0 ? (
                <Button
                  variant="dark"
                  onClick={() => {
                    st.discover(wotd.id, false, { flipped: true, gold: false })
                  }}
                >
                  <BookmarkSimple size={18} weight="bold" /> In den Lernstapel
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate">
                  <Check size={16} weight="bold" />
                  {wotdProgress.box >= MASTERED_BOX ? 'Gemeistert' : 'Liegt in deinem Lernstapel'}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Zahlen */}
        <motion.div {...rise(3)} className="grid grid-cols-2 gap-3 lg:col-span-5 lg:grid-cols-2">
          <button onClick={() => st.go('collection')} className="press rounded-card bg-tint-peach p-4 text-left text-tint-ink-peach">
            <div className="text-[28px] font-semibold tabular-nums">{c.learning + c.claimed}</div>
            <div className="text-sm">im Lernstapel</div>
          </button>
          <button onClick={() => st.go('collection')} className="press rounded-card bg-tint-mint p-4 text-left text-tint-ink-mint">
            <div className="text-[28px] font-semibold tabular-nums">{c.mastered}</div>
            <div className="text-sm">gemeistert</div>
          </button>
          <button onClick={() => st.go('discover')} className="press col-span-2 flex items-center justify-between rounded-card border border-hairline bg-canvas p-4 text-left">
            <div>
              <div className="text-sm text-steel">Entdeckt</div>
              <div className="text-lg font-semibold tabular-nums">
                {c.seen} <span className="text-steel">von {WORDS.length} Wörtern</span>
              </div>
            </div>
            <ArrowRight size={20} className="text-steel" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
