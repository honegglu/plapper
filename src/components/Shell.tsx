import { Books, Cards, Fire, House, Lightning, UserCircle, type Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { rankFor } from '../lib/game'
import type { Screen } from '../lib/types'
import { dueWordIds, useStore, visibleStreak } from '../store'

const NAV: { id: Screen; label: string; icon: Icon }[] = [
  { id: 'home', label: 'Heute', icon: House },
  { id: 'discover', label: 'Entdecken', icon: Cards },
  { id: 'practice', label: 'Abfragen', icon: Lightning },
  { id: 'collection', label: 'Sammlung', icon: Books },
  { id: 'profile', label: 'Profil', icon: UserCircle },
]

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-btn bg-primary text-[17px] font-bold text-on-primary">P</div>
      <span className="text-[17px] font-semibold tracking-[-0.02em]">Plapper</span>
    </div>
  )
}

function DueBadge({ n }: { n: number }) {
  if (n <= 0) return null
  return (
    <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] font-semibold leading-5 text-on-primary">
      {n > 99 ? '99+' : n}
    </span>
  )
}

/** Navigation: Seitenleiste auf dem Desktop, Tab-Leiste auf dem Handy. */
export function Shell({ children, focus }: { children: ReactNode; focus: boolean }) {
  const screen = useStore((s) => s.screen)
  const go = useStore((s) => s.go)
  const progress = useStore((s) => s.progress)
  const xp = useStore((s) => s.xpTotal)
  const streak = useStore(visibleStreak)
  const due = dueWordIds(progress).length
  const rank = rankFor(xp)

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-hairline bg-surface-soft px-3 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 space-y-0.5" aria-label="Hauptnavigation">
          {NAV.map(({ id, label, icon: I }) => {
            const active = screen === id
            return (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={active ? 'page' : undefined}
                className={`press flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left text-sm font-medium ${
                  active ? 'bg-sunken text-ink' : 'text-slate hover:bg-sunken/70'
                }`}
              >
                <I size={18} weight={active ? 'fill' : 'regular'} className={active ? 'text-primary' : ''} />
                {label}
                {id === 'practice' && <DueBadge n={due} />}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto space-y-3 rounded-card border border-hairline bg-canvas p-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-charcoal">{rank.title}</span>
            <span className="text-steel">Rang {rank.level}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate">
            <Fire size={18} weight="fill" className={streak > 0 ? 'text-orange' : 'text-stone'} />
            {streak === 1 ? '1 Tag Serie' : `${streak} Tage Serie`}
          </div>
        </div>
      </aside>

      <main className={`min-w-0 ${focus ? '' : 'pb-24 lg:pb-0'}`}>{children}</main>

      {!focus && (
        <nav
          className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas/95 backdrop-blur lg:hidden"
          aria-label="Hauptnavigation"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {NAV.map(({ id, label, icon: I }) => {
              const active = screen === id
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`press relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                    active ? 'text-primary' : 'text-steel'
                  }`}
                >
                  <I size={24} weight={active ? 'fill' : 'regular'} />
                  {label}
                  {id === 'practice' && due > 0 && (
                    <span className="absolute left-1/2 top-1.5 ml-2 min-w-[18px] rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-[18px] text-on-primary">
                      {due > 99 ? '99+' : due}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
