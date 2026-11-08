import type { ChallengeMetric, DailyChallenge, StageInfo, UpgradeDef, UpgradeId } from './types'

// ---------------------------------------------------------------------------
// Stages: each run's score is added to the selected politician's "wahala".
// As wahala builds they move through 6 poses; at the meltdown you LEVEL UP and
// the next politician in the cast steps up. Each lap of the cast = a new,
// harder term, so the game never ends.
// ---------------------------------------------------------------------------
export const STAGES: StageInfo[] = [
  { index: 0, name: 'Fresh Agbada', tagline: 'Confident smile, ironed agbada', min: 0, color: '#00a859' },
  { index: 1, name: 'Who Touch Me?', tagline: 'Surprised, starting to sweat', min: 300, color: '#3ec7ff' },
  { index: 2, name: 'Sweating Small', tagline: 'Nervous grin, sweat drops', min: 900, color: '#ffc93c' },
  { index: 3, name: 'Abeg, Na Wetin I Do?', tagline: 'Complaining loudly', min: 1_800, color: '#ff9f1c' },
  { index: 4, name: 'Cartoon Tears', tagline: 'Dramatic tears', min: 2_800, color: '#ff4d4d' },
  { index: 5, name: 'Wahala Don Land', tagline: 'Full meltdown!', min: 3_800, color: '#9b5cff' },
]

export const termScale = (term: number) => 1 + (term - 1) * 0.6
export const meltdownAt = (term: number) => Math.round(4_500 * termScale(term))

export function stageFor(wahala: number, term: number): number {
  const s = termScale(term)
  let idx = 0
  for (const st of STAGES) if (wahala >= st.min * s) idx = st.index
  return idx
}

export function stageProgress(wahala: number, term: number) {
  const s = termScale(term)
  const stage = stageFor(wahala, term)
  const cur = STAGES[stage].min * s
  const next = stage < 5 ? STAGES[stage + 1].min * s : meltdownAt(term)
  return { stage, pct: Math.min(1, (wahala - cur) / Math.max(1, next - cur)), next, total: wahala / meltdownAt(term) }
}

export const meltdownReward = (term: number, bonus: number) => Math.round(1_500 * term * term * bonus)

// ---------------------------------------------------------------------------
// Upgrades (deliberately expensive: you have to grind runs to afford them)
// ---------------------------------------------------------------------------
export const UPGRADES: UpgradeDef[] = [
  {
    id: 'coinValue',
    name: 'Loud Microphone',
    description: 'More coins from every run',
    icon: 'mic',
    baseCost: 500,
    growth: 1.9,
    maxLevel: 40,
    effectLabel: (l) => `+${Math.round((coinMultFor(l) - 1) * 100)}% coins`,
  },
  {
    id: 'basket',
    name: 'Wide Basket',
    description: 'Promise Catcher: bigger basket',
    icon: 'bag',
    baseCost: 1_200,
    growth: 2.2,
    maxLevel: 10,
    effectLabel: (l) => `${Math.round(basketWidthFor(l) * 100)}% width`,
  },
  {
    id: 'magnet',
    name: 'Naira Magnet',
    description: 'Promise Catcher: pulls good items in',
    icon: 'coin',
    baseCost: 3_000,
    growth: 2.3,
    maxLevel: 10,
    effectLabel: (l) => (l === 0 ? 'none' : `${magnetFor(l)}px pull`),
  },
  {
    id: 'lives',
    name: 'Extra Heart',
    description: 'Both games: +1 heart per run',
    icon: 'star',
    baseCost: 8_000,
    growth: 4,
    maxLevel: 3,
    effectLabel: (l) => `${3 + l} hearts`,
  },
  {
    id: 'luck',
    name: 'Golden Ballot',
    description: 'More golden items & golden politicians (x5)',
    icon: 'crown',
    baseCost: 15_000,
    growth: 2.4,
    maxLevel: 10,
    effectLabel: (l) => `${Math.round(luckFor(l) * 100)}% golden`,
  },
  {
    id: 'calm',
    name: 'Calm Crowd',
    description: 'Both games speed up more slowly',
    icon: 'clock',
    baseCost: 5_000,
    growth: 2.2,
    maxLevel: 8,
    effectLabel: (l) => `-${l * 6}% speed-up`,
  },
]

export const upgradeCost = (u: UpgradeDef, level: number) => Math.round(u.baseCost * Math.pow(u.growth, level))
export const getUpgrade = (id: UpgradeId) => UPGRADES.find((u) => u.id === id)!

export const coinMultFor = (l: number) => 1 + l * 0.15
export const basketWidthFor = (l: number) => 1 + l * 0.08
export const magnetFor = (l: number) => l * 14
export const livesFor = (l: number) => 3 + l
export const luckFor = (l: number) => 0.03 + l * 0.02
export const calmFor = (l: number) => 1 - l * 0.06

/** Combo multiplier shared by both games. */
export const comboMult = (combo: number) => Math.min(3, 1 + Math.floor(combo / 10) * 0.5)

/** Coins awarded for a finished run. */
export const runCoins = (score: number, coinLvl: number, charBonus: number, modMult: number) =>
  Math.round(score * coinMultFor(coinLvl) * charBonus * modMult)

// Daily login streak rewards (day 1..7, then loops ×weeks)
export const STREAK_REWARDS = [300, 600, 1_200, 2_500, 5_000, 8_000, 15_000]

// ---------------------------------------------------------------------------
// Daily challenges, seeded by date so every player gets the same set per day
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const seeded = (key: string) => {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return mulberry32(h)
}

const TEMPLATES: { metric: ChallengeMetric; targets: number[]; label: (n: number) => string; reward: number }[] = [
  { metric: 'runs', targets: [3, 5, 8], label: (n) => `Play ${n} games`, reward: 1.0 },
  { metric: 'coins', targets: [2_000, 6_000, 15_000], label: (n) => `Earn ${n.toLocaleString()} coins`, reward: 1.2 },
  { metric: 'catcherBest', targets: [300, 600, 1_000], label: (n) => `Score ${n} in Promise Catcher`, reward: 1.3 },
  { metric: 'whackBest', targets: [250, 500, 800], label: (n) => `Score ${n} in Whack-a-Politician`, reward: 1.3 },
  { metric: 'caught', targets: [50, 120, 250], label: (n) => `Catch ${n} good items`, reward: 1.1 },
  { metric: 'whacked', targets: [40, 100, 200], label: (n) => `Vote out ${n} politicians`, reward: 1.1 },
  { metric: 'maxCombo', targets: [15, 30, 50], label: (n) => `Reach a ${n} combo`, reward: 1.2 },
  { metric: 'upgrades', targets: [1, 2, 3], label: (n) => `Buy ${n} upgrade${n > 1 ? 's' : ''}`, reward: 0.8 },
]

export function dailyChallenges(dateKey: string): DailyChallenge[] {
  const rnd = seeded('challenges-v2-' + dateKey)
  const pool = [...TEMPLATES]
  const out: DailyChallenge[] = []
  for (let i = 0; i < 3; i++) {
    const t = pool.splice(Math.floor(rnd() * pool.length), 1)[0]
    const ti = Math.floor(rnd() * t.targets.length)
    const target = t.targets[ti]
    out.push({
      id: `${dateKey}-${t.metric}`,
      metric: t.metric,
      target,
      reward: Math.round(((ti + 1) * 1_500 * t.reward) / 100) * 100,
      label: t.label(target),
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Date helpers (local time)
// ---------------------------------------------------------------------------
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const wk = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}
