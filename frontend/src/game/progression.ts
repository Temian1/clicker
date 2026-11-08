import type { ChallengeMetric, DailyChallenge, StageInfo, UpgradeDef, UpgradeId } from './types'

// ---------------------------------------------------------------------------
// Stages: the cartoon transformation. Measured in "wahala" points
// (taps × tap power). Each completed meltdown re-elects the politician into a
// new term with higher thresholds — so the game never ends.
// ---------------------------------------------------------------------------
export const STAGES: StageInfo[] = [
  { index: 0, name: 'Fresh Agbada', tagline: 'Confident smile, ironed agbada', min: 0, color: '#00a859' },
  { index: 1, name: 'Who Touch Me?', tagline: 'Face changes, sunglasses shake', min: 100, color: '#3ec7ff' },
  { index: 2, name: 'Sweating Small', tagline: 'Sweat drops, crooked cap', min: 500, color: '#ffc93c' },
  { index: 3, name: 'Abeg, Na Wetin I Do?', tagline: 'Rumpled agbada, complaints', min: 2_000, color: '#ff9f1c' },
  { index: 4, name: 'Cartoon Tears', tagline: 'Dramatic tears, wild reactions', min: 5_000, color: '#ff4d4d' },
  { index: 5, name: 'Wahala Don Land', tagline: 'Full meltdown!', min: 10_000, color: '#9b5cff' },
]

/** Wahala needed to finish a term and trigger the meltdown. */
export const termScale = (term: number) => 1 + (term - 1) * 0.6
export const meltdownAt = (term: number) => Math.round(12_000 * termScale(term))

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
  return { stage, pct: Math.min(1, (wahala - cur) / Math.max(1, next - cur)), next }
}

export const meltdownReward = (term: number, bonus: number) => Math.round(2_500 * term * term * bonus)

// ---------------------------------------------------------------------------
// Upgrades
// ---------------------------------------------------------------------------
export const UPGRADES: UpgradeDef[] = [
  {
    id: 'tapPower',
    name: 'Loud Microphone',
    description: 'More coins & wahala per tap',
    icon: 'mic',
    baseCost: 300,
    growth: 1.9,
    maxLevel: 200,
    effectLabel: (l) => `+${tapPowerFor(l)} / tap`,
  },
  {
    id: 'maxEnergy',
    name: 'Bigger Generator',
    description: 'Raise your energy tank',
    icon: 'bolt',
    baseCost: 800,
    growth: 1.95,
    maxLevel: 100,
    effectLabel: (l) => `${maxEnergyFor(l)} max`,
  },
  {
    id: 'regen',
    name: 'Solar Panel',
    description: 'Energy refills faster',
    icon: 'sun',
    baseCost: 1_500,
    growth: 2.1,
    maxLevel: 50,
    effectLabel: (l) => `${regenFor(l)}/s`,
  },
  {
    id: 'autoTap',
    name: 'Hype Man Aide',
    description: 'Earns coins automatically, even offline (3h)',
    icon: 'robot',
    baseCost: 5_000,
    growth: 1.85,
    maxLevel: 300,
    effectLabel: (l) => `${autoFor(l)}/s`,
  },
  {
    id: 'comboCap',
    name: 'Crowd Hype',
    description: 'Higher combo multiplier cap',
    icon: 'fire',
    baseCost: 15_000,
    growth: 2.6,
    maxLevel: 20,
    effectLabel: (l) => `x${comboCapFor(l).toFixed(1)} max`,
  },
  {
    id: 'crit',
    name: 'Ghana-Must-Go Bag',
    description: 'Chance of a x10 jackpot tap',
    icon: 'bag',
    baseCost: 40_000,
    growth: 2.4,
    maxLevel: 25,
    effectLabel: (l) => `${Math.round(critFor(l) * 100)}% jackpot`,
  },
]

export const upgradeCost = (u: UpgradeDef, level: number) => Math.round(u.baseCost * Math.pow(u.growth, level))
export const tapPowerFor = (l: number) => 1 + l + Math.floor(l * l * 0.05)
export const maxEnergyFor = (l: number) => 500 + l * 250
export const regenFor = (l: number) => 2 + l
export const autoFor = (l: number) => (l === 0 ? 0 : Math.round(l * 2 + Math.pow(l, 1.6)))
export const comboCapFor = (l: number) => 3 + l * 0.5
export const critFor = (l: number) => Math.min(0.5, l * 0.02)

export const getUpgrade = (id: UpgradeId) => UPGRADES.find((u) => u.id === id)!

// Boss rally
export const bossTarget = (lvl: number) => Math.min(300, 110 + 18 * (lvl - 1))
export const bossTime = (lvl: number) => Math.max(20, 30 - Math.max(0, lvl - 12))
export const bossReward = (lvl: number) => Math.round(3_000 * Math.pow(1.45, lvl - 1))

// Combo
export const COMBO_WINDOW_MS = 700
export const comboMultiplier = (combo: number, cap: number) => Math.min(cap, 1 + Math.floor(combo / 20) * 0.25)

// Boosts (per day)
export const BOOSTS = {
  refill: { name: 'Full Tank', description: 'Refill all energy instantly', perDay: 3 },
  turbo: { name: 'Turbo Rally', description: 'x5 coins for 20 seconds', perDay: 3, durationMs: 20_000, mult: 5 },
} as const

// Daily login streak rewards (day 1..7, then loops at day 7 value × weeks)
export const STREAK_REWARDS = [500, 1_000, 2_500, 5_000, 10_000, 15_000, 25_000]

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
  { metric: 'taps', targets: [500, 1_000, 2_000], label: (n) => `Tap ${n.toLocaleString()} times`, reward: 1.0 },
  { metric: 'coins', targets: [5_000, 20_000, 50_000], label: (n) => `Earn ${n.toLocaleString()} coins`, reward: 1.2 },
  { metric: 'maxCombo', targets: [50, 100, 200], label: (n) => `Hit a ${n} tap combo`, reward: 1.1 },
  { metric: 'bossWins', targets: [1, 2, 3], label: (n) => `Win ${n} rally boss fight${n > 1 ? 's' : ''}`, reward: 1.5 },
  { metric: 'stageUps', targets: [2, 4, 6], label: (n) => `Trigger ${n} stage changes`, reward: 1.3 },
  { metric: 'duelWins', targets: [1, 2], label: (n) => `Win ${n} tap duel${n > 1 ? 's' : ''}`, reward: 1.5 },
  { metric: 'upgrades', targets: [3, 5, 8], label: (n) => `Buy ${n} upgrades`, reward: 1.0 },
]

export function dailyChallenges(dateKey: string): DailyChallenge[] {
  const rnd = seeded('challenges-' + dateKey)
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
      reward: Math.round(((ti + 1) * 2_000 * t.reward) / 100) * 100,
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
