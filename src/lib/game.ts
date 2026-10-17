/** Punkte, Ränge, Wiederholungsintervalle und Auszeichnungen. */

/** Leitner-Intervalle in Tagen je Box (Index = Box). Box 6 = gemeistert. */
export const BOX_INTERVALS = [0, 0, 1, 3, 7, 16, 40]
export const MASTERED_BOX = 6
/** "Kenne ich" startet hier und wird beim nächsten Fälligwerden geprüft. */
export const CLAIMED_BOX = 4

export const XP = {
  discoverNew: 3,
  discoverKnown: 2,
  flipBonus: 1,
  correct: 10,
  fastBonus: 3,
  goldMultiplier: 3,
  roundComplete: 5,
  perfectRound: 15,
} as const

/** Kombo-Multiplikator nach Anzahl richtiger Antworten in Folge. */
export function comboMultiplier(combo: number): number {
  if (combo >= 8) return 3
  if (combo >= 5) return 2
  if (combo >= 3) return 1.5
  return 1
}

export const GOLD_CHANCE = 0.08

export const DAILY_GOALS = [
  { xp: 30, label: 'Locker', hint: 'Etwa 3 Minuten am Tag' },
  { xp: 60, label: 'Normal', hint: 'Etwa 6 Minuten am Tag' },
  { xp: 100, label: 'Ernsthaft', hint: 'Etwa 10 Minuten am Tag' },
  { xp: 160, label: 'Ehrgeizig', hint: 'Etwa 15 Minuten am Tag' },
] as const

export const DEFAULT_GOAL = 60

const RANKS = [
  'Wortneuling',
  'Wortsammler',
  'Silbenspürer',
  'Wortjäger',
  'Sprachgourmet',
  'Bildungsbürger',
  'Feingeist',
  'Wortakrobat',
  'Lexikonleser',
  'Sprachvirtuose',
  'Wortgelehrter',
  'Lexikograf',
  'Sprachschatzmeister',
  'Wortpatron',
  'Sprachgenie',
]

/** XP-Schwelle, ab der Rang n (0-basiert) erreicht ist. */
export function rankThreshold(n: number): number {
  // wächst moderat: 0, 80, 200, 360, 560, 800, ...
  return 20 * n * (n + 3)
}

export function rankFor(xp: number) {
  let n = 0
  while (n < RANKS.length - 1 && xp >= rankThreshold(n + 1)) n++
  const floor = rankThreshold(n)
  const isMax = n === RANKS.length - 1
  const ceil = isMax ? floor : rankThreshold(n + 1)
  return {
    level: n + 1,
    title: RANKS[n],
    nextTitle: isMax ? null : RANKS[n + 1],
    floor,
    ceil,
    progress: isMax ? 1 : (xp - floor) / (ceil - floor),
    toNext: isMax ? 0 : ceil - xp,
  }
}

export interface AchievementContext {
  discovered: number
  learning: number
  mastered: number
  bestCombo: number
  streak: number
  goalsReached: number
  goldFound: number
  perfectRounds: number
  totalCorrect: number
  hour: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  tint: 'peach' | 'rose' | 'mint' | 'lavender' | 'sky' | 'yellow'
  check: (c: AchievementContext) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'start', title: 'Erster Schritt', description: 'Plapper eingerichtet', tint: 'lavender', check: () => true },
  { id: 'disc-10', title: 'Neugierig', description: '10 Wörter entdeckt', tint: 'sky', check: (c) => c.discovered >= 10 },
  { id: 'disc-50', title: 'Wortforscher', description: '50 Wörter entdeckt', tint: 'sky', check: (c) => c.discovered >= 50 },
  { id: 'disc-150', title: 'Expeditionsleiter', description: '150 Wörter entdeckt', tint: 'sky', check: (c) => c.discovered >= 150 },
  { id: 'correct-25', title: 'Treffsicher', description: '25 richtige Antworten', tint: 'mint', check: (c) => c.totalCorrect >= 25 },
  { id: 'correct-250', title: 'Scharfsinnig', description: '250 richtige Antworten', tint: 'mint', check: (c) => c.totalCorrect >= 250 },
  { id: 'master-1', title: 'Sitzt', description: 'Erstes Wort gemeistert', tint: 'yellow', check: (c) => c.mastered >= 1 },
  { id: 'master-25', title: 'Wortschatzkiste', description: '25 Wörter gemeistert', tint: 'yellow', check: (c) => c.mastered >= 25 },
  { id: 'master-100', title: 'Schatzkammer', description: '100 Wörter gemeistert', tint: 'yellow', check: (c) => c.mastered >= 100 },
  { id: 'combo-5', title: 'Im Fluss', description: '5 richtige in Folge', tint: 'peach', check: (c) => c.bestCombo >= 5 },
  { id: 'combo-12', title: 'Unaufhaltsam', description: '12 richtige in Folge', tint: 'peach', check: (c) => c.bestCombo >= 12 },
  { id: 'streak-3', title: 'Dranbleiber', description: '3 Tage Serie', tint: 'rose', check: (c) => c.streak >= 3 },
  { id: 'streak-7', title: 'Wochenwerk', description: '7 Tage Serie', tint: 'rose', check: (c) => c.streak >= 7 },
  { id: 'streak-30', title: 'Gewohnheitstier', description: '30 Tage Serie', tint: 'rose', check: (c) => c.streak >= 30 },
  { id: 'goal-1', title: 'Tagwerk', description: 'Tagesziel erreicht', tint: 'mint', check: (c) => c.goalsReached >= 1 },
  { id: 'goal-10', title: 'Verlässlich', description: '10 Tagesziele erreicht', tint: 'mint', check: (c) => c.goalsReached >= 10 },
  { id: 'gold', title: 'Goldgräber', description: 'Ein Goldwort gefunden', tint: 'yellow', check: (c) => c.goldFound >= 1 },
  { id: 'perfect', title: 'Makellos', description: 'Runde ohne Fehler', tint: 'lavender', check: (c) => c.perfectRounds >= 1 },
  { id: 'owl', title: 'Nachteule', description: 'Nach 22 Uhr gelernt', tint: 'lavender', check: (c) => c.hour >= 22 || c.hour < 4 },
  { id: 'lark', title: 'Frühaufsteher', description: 'Vor 7 Uhr gelernt', tint: 'peach', check: (c) => c.hour >= 4 && c.hour < 7 },
]
