import { Crown, Fire, Lock, Medal, Snowflake, Target, Trophy } from '@phosphor-icons/react'
import { useState } from 'react'
import { Bar, Button, Card, tint } from '../components/ui'
import { WORDS } from '../data/words'
import { ACHIEVEMENTS, DAILY_GOALS, rankFor } from '../lib/game'
import type { Spelling, ThemePref } from '../lib/types'
import { counts, useStore, visibleStreak } from '../store'

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-btn bg-sunken p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`press rounded-[6px] px-3 py-1.5 text-sm font-medium ${
            value === o.value ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(15,15,15,0.08)]' : 'text-steel hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Profile() {
  const st = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const rank = rankFor(st.xpTotal)
  const c = counts(st.progress)
  const streak = visibleStreak(st)
  const unlocked = ACHIEVEMENTS.filter((a) => st.achievements[a.id]).length
  const accuracy = st.totalAnswers ? Math.round((st.totalCorrect / st.totalAnswers) * 100) : 0

  const stats = [
    { icon: Fire, label: 'Serie', value: streak, sub: `Rekord ${st.bestStreak}` },
    { icon: Target, label: 'Tagesziele', value: st.goalsReached, sub: 'erreicht' },
    { icon: Medal, label: 'Trefferquote', value: `${accuracy}%`, sub: `${st.totalAnswers} Antworten` },
    { icon: Snowflake, label: 'Serienschutz', value: st.freezes, sub: 'alle 7 Tage +1' },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <h1 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-4xl">Profil</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <Card className="border-transparent bg-tint-lavender! p-6 text-tint-ink-lavender lg:col-span-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown size={18} weight="fill" /> Rang {rank.level}
          </div>
          <div className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.03em]">{rank.title}</div>
          <Bar value={rank.progress} className="mt-6 bg-white/60 dark:bg-white/10" />
          <div className="mt-2 text-sm">
            {rank.nextTitle ? (
              <>
                Noch {rank.toNext} XP bis <span className="font-semibold">{rank.nextTitle}</span>
              </>
            ) : (
              'Höchster Rang erreicht.'
            )}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-current/15 pt-5 text-sm">
            <div>
              <div className="text-xl font-semibold tabular-nums">{st.xpTotal}</div>
              XP gesamt
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums">{c.seen}</div>
              entdeckt
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums">{c.mastered}</div>
              gemeistert
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:col-span-7">
          {stats.map(({ icon: I, label, value, sub }) => (
            <Card key={label} className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm text-steel">
                <I size={16} weight="bold" /> {label}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
              <div className="text-sm text-steel">{sub}</div>
            </Card>
          ))}
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em]">
            <Trophy size={22} weight="fill" className="text-primary" /> Auszeichnungen
          </h2>
          <span className="text-sm text-steel">
            {unlocked} von {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const got = !!st.achievements[a.id]
            return (
              <div
                key={a.id}
                className={`rounded-card p-4 ${got ? tint(a.tint) : 'border border-dashed border-hairline-strong bg-canvas text-steel'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.title}</span>
                  {!got && <Lock size={16} />}
                </div>
                <div className="mt-1 text-sm">{a.description}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Einstellungen</h2>
        <Card className="mt-4 divide-y divide-hairline">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">Tagesziel</div>
              <div className="text-sm text-steel">XP pro Tag für deine Serie</div>
            </div>
            <Segmented
              label="Tagesziel"
              value={st.dailyGoal}
              onChange={st.setDailyGoal}
              options={DAILY_GOALS.map((g) => ({ value: g.xp, label: `${g.label} ${g.xp}` }))}
            />
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">Schreibweise</div>
              <div className="text-sm text-steel">Schweiz: ss statt ß</div>
            </div>
            <Segmented<Spelling>
              label="Schreibweise"
              value={st.spelling}
              onChange={st.setSpelling}
              options={[
                { value: 'ch', label: 'Schweiz (ss)' },
                { value: 'de', label: 'Deutschland (ß)' },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">Darstellung</div>
              <div className="text-sm text-steel">Hell, dunkel oder wie dein Gerät</div>
            </div>
            <Segmented<ThemePref>
              label="Darstellung"
              value={st.theme}
              onChange={st.setTheme}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Hell' },
                { value: 'dark', label: 'Dunkel' },
              ]}
            />
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">Fortschritt zurücksetzen</div>
              <div className="text-sm text-steel">Löscht Punkte, Serie und Lernstand auf diesem Gerät.</div>
            </div>
            {confirmReset ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Abbrechen
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    st.resetAll()
                    setConfirmReset(false)
                  }}
                >
                  Endgültig zurücksetzen
                </Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
                Zurücksetzen
              </Button>
            )}
          </div>
        </Card>
        <p className="mt-4 text-sm text-steel">
          {WORDS.length} Wörter im Bestand. Definitionen und Beispiele sind eigene Formulierungen; massgebend bleibt der Duden.
        </p>
      </section>
    </div>
  )
}
