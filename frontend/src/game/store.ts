import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CHARACTERS, getCharacter, playableCharacters, randomLine } from './characters'
import {
  BOOSTS,
  COMBO_WINDOW_MS,
  STREAK_REWARDS,
  UPGRADES,
  autoFor,
  bossReward,
  comboCapFor,
  comboMultiplier,
  critFor,
  dayKey,
  daysBetween,
  getUpgrade,
  maxEnergyFor,
  meltdownAt,
  meltdownReward,
  regenFor,
  stageFor,
  tapPowerFor,
  upgradeCost,
  weekKey,
} from './progression'
import type { ChallengeMetric, DailyChallenge, UpgradeId } from './types'

export interface CharProgress {
  unlocked: boolean
  wahala: number
  term: number
  meltdowns: number
  taps: number
}

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: number
}

export interface DailyStats {
  key: string
  taps: number
  coins: number
  maxCombo: number
  bossWins: number
  stageUps: number
  duelWins: number
  upgrades: number
  claimed: string[]
  refillUsed: number
  turboUsed: number
}

export interface Settings {
  sfx: boolean
  music: boolean
  haptics: boolean
  voice: boolean
}

export interface TapResult {
  coins: number
  crit: boolean
  combo: number
  mult: number
  stageUp: number | null
  meltdown: { reward: number; term: number; level: number; nextId: string; nextName: string; newUnlock: boolean } | null
}

interface Persisted {
  profile: Profile | null
  coins: number
  totalEarned: number
  totalTaps: number
  energy: number
  upgrades: Record<UpgradeId, number>
  selected: string
  chars: Record<string, CharProgress>
  best: { combo: number; boss: number; duel: number; jackpot: number; meltdowns: number }
  daily: DailyStats
  period: { dayKey: string; weekKey: string; daily: number; weekly: number }
  streak: { last: string | null; count: number }
  turboUntil: number
  bossLevel: number
  /** Global level: +1 per meltdown. Each level moves you to the next cast member. */
  level: number
  settings: Settings
  lastSeen: number
  pendingSync: { coins: number; taps: number }
}

interface Transient {
  combo: number
  lastTapAt: number
  bubble: { text: string; id: number } | null
  fxBurst: number
  fxBurstKind: 'stage' | 'meltdown' | 'win'
  lastBubbleAt: number
}

interface Actions {
  setProfile(name: string, avatar: string): void
  ensureDay(): void
  tap(): TapResult | null
  tick(dtMs: number): void
  applyOffline(): { coins: number; ms: number } | null
  buyUpgrade(id: UpgradeId): boolean
  unlockCharacter(id: string): boolean
  selectCharacter(id: string): void
  useBoost(kind: 'refill' | 'turbo'): boolean
  claimChallenge(c: DailyChallenge): boolean
  claimStreak(): number
  finishBoss(win: boolean, score: number): number
  finishDuel(win: boolean, score: number): number
  say(text: string): void
  burst(kind: Transient['fxBurstKind']): void
  setSettings(p: Partial<Settings>): void
  takePendingSync(): { coins: number; taps: number }
  resetAll(): void
}

export type GameState = Persisted & Transient & Actions

const emptyDaily = (key: string): DailyStats => ({
  key,
  taps: 0,
  coins: 0,
  maxCombo: 0,
  bossWins: 0,
  stageUps: 0,
  duelWins: 0,
  upgrades: 0,
  claimed: [],
  refillUsed: 0,
  turboUsed: 0,
})

const initialChars = (): Record<string, CharProgress> =>
  Object.fromEntries(
    CHARACTERS.filter((c) => !c.comingSoon).map((c) => [
      c.id,
      { unlocked: c.unlockCost === 0, wahala: 0, term: 1, meltdowns: 0, taps: 0 },
    ]),
  )

const initial = (): Persisted => ({
  profile: null,
  coins: 0,
  totalEarned: 0,
  totalTaps: 0,
  energy: maxEnergyFor(0),
  upgrades: { tapPower: 0, maxEnergy: 0, regen: 0, autoTap: 0, comboCap: 0, crit: 0 },
  selected: CHARACTERS[0].id,
  chars: initialChars(),
  best: { combo: 0, boss: 0, duel: 0, jackpot: 0, meltdowns: 0 },
  daily: emptyDaily(dayKey()),
  period: { dayKey: dayKey(), weekKey: weekKey(), daily: 0, weekly: 0 },
  streak: { last: null, count: 0 },
  turboUntil: 0,
  bossLevel: 1,
  level: 1,
  settings: { sfx: true, music: true, haptics: true, voice: false },
  lastSeen: Date.now(),
  pendingSync: { coins: 0, taps: 0 },
})

const PERSIST_KEYS = Object.keys(initial()) as (keyof Persisted)[]

/** Pure helper: add earned coins to every counter that tracks earnings. */
function earn(s: Persisted, n: number): Partial<Persisted> {
  return {
    coins: s.coins + n,
    totalEarned: s.totalEarned + n,
    daily: { ...s.daily, coins: s.daily.coins + n },
    period: { ...s.period, daily: s.period.daily + n, weekly: s.period.weekly + n },
    pendingSync: { ...s.pendingSync, coins: s.pendingSync.coins + n },
  }
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial(),
      combo: 0,
      lastTapAt: 0,
      bubble: null,
      fxBurst: 0,
      fxBurstKind: 'stage',
      lastBubbleAt: 0,

      setProfile(name, avatar) {
        const p = get().profile
        set({
          profile: {
            id: p?.id ?? crypto.randomUUID(),
            name: name.trim().slice(0, 18) || 'Oga Tapper',
            avatar,
            createdAt: p?.createdAt ?? Date.now(),
          },
        })
      },

      ensureDay() {
        const s = get()
        const dk = dayKey()
        const wk = weekKey()
        const patch: Partial<Persisted> = {}
        if (s.daily.key !== dk) patch.daily = emptyDaily(dk)
        if (s.period.dayKey !== dk || s.period.weekKey !== wk) {
          patch.period = {
            dayKey: dk,
            weekKey: wk,
            daily: s.period.dayKey === dk ? s.period.daily : 0,
            weekly: s.period.weekKey === wk ? s.period.weekly : 0,
          }
        }
        // Make sure newly-added characters exist in the save.
        const missing = CHARACTERS.filter((c) => !c.comingSoon && !s.chars[c.id])
        if (missing.length) {
          patch.chars = { ...s.chars }
          for (const c of missing) patch.chars[c.id] = { unlocked: c.unlockCost === 0, wahala: 0, term: 1, meltdowns: 0, taps: 0 }
        }
        if (Object.keys(patch).length) set(patch)
      },

      tap() {
        const s = get()
        if (s.energy < 1) return null
        const now = Date.now()
        const char = getCharacter(s.selected)
        const cp = s.chars[s.selected]
        if (!cp?.unlocked) return null

        const combo = now - s.lastTapAt < COMBO_WINDOW_MS ? s.combo + 1 : 1
        const mult = comboMultiplier(combo, comboCapFor(s.upgrades.comboCap))
        const crit = Math.random() < critFor(s.upgrades.crit)
        const power = tapPowerFor(s.upgrades.tapPower)
        const turbo = s.turboUntil > now ? BOOSTS.turbo.mult : 1
        const wahalaGain = Math.round(power * mult * (crit ? 10 : 1))
        const coins = Math.max(1, Math.round(wahalaGain * turbo * char.coinBonus))

        const before = stageFor(cp.wahala, cp.term)
        let wahala = cp.wahala + wahalaGain
        let term = cp.term
        let meltdowns = cp.meltdowns
        let meltdown: TapResult['meltdown'] = null
        let stageUp: number | null = null
        let bonus = 0
        let chars = s.chars

        if (wahala >= meltdownAt(term)) {
          bonus = meltdownReward(term, char.coinBonus)
          term += 1
          meltdowns += 1
          wahala = 0
          // LEVEL UP → move on to the next politician in the cast (loops forever;
          // each lap they come back one term harder).
          const cast = playableCharacters()
          const idx = cast.findIndex((c) => c.id === s.selected)
          const next = cast[(idx + 1) % cast.length]
          const nextCp = s.chars[next.id] ?? { unlocked: false, wahala: 0, term: 1, meltdowns: 0, taps: 0 }
          chars = { ...s.chars, [next.id]: { ...nextCp, unlocked: true } }
          meltdown = { reward: bonus, term: nextCp.term, level: s.level + 1, nextId: next.id, nextName: next.name, newUnlock: !nextCp.unlocked }
        } else {
          const after = stageFor(wahala, term)
          if (after > before) stageUp = after
        }

        const e = earn(s, coins + bonus)
        set({
          ...e,
          energy: s.energy - 1,
          totalTaps: s.totalTaps + 1,
          combo,
          lastTapAt: now,
          chars: { ...chars, [s.selected]: { ...cp, wahala, term, meltdowns, taps: cp.taps + 1 } },
          ...(meltdown ? { selected: meltdown.nextId, level: meltdown.level, combo: 0 } : {}),
          best: {
            ...s.best,
            combo: Math.max(s.best.combo, combo),
            jackpot: crit ? Math.max(s.best.jackpot, coins) : s.best.jackpot,
            meltdowns: s.best.meltdowns + (meltdown ? 1 : 0),
          },
          daily: {
            ...e.daily!,
            taps: s.daily.taps + 1,
            maxCombo: Math.max(s.daily.maxCombo, combo),
            stageUps: s.daily.stageUps + (stageUp !== null || meltdown ? 1 : 0),
          },
          pendingSync: { coins: e.pendingSync!.coins, taps: s.pendingSync.taps + 1 },
        })

        if (meltdown) {
          get().burst('meltdown')
          get().say(randomLine(getCharacter(meltdown.nextId), 0))
        } else if (stageUp !== null) {
          get().burst('stage')
          get().say(randomLine(char, stageUp))
        } else if (now - s.lastBubbleAt > 2500 && Math.random() < 0.06) {
          get().say(randomLine(char, before))
        }

        return { coins, crit, combo, mult, stageUp, meltdown }
      },

      tick(dtMs) {
        const s = get()
        const max = maxEnergyFor(s.upgrades.maxEnergy)
        const regen = (regenFor(s.upgrades.regen) * dtMs) / 1000
        const auto = (autoFor(s.upgrades.autoTap) * dtMs) / 1000
        const patch: Partial<GameState> = { energy: Math.min(max, s.energy + regen), lastSeen: Date.now() }
        if (auto > 0) Object.assign(patch, earn(s, auto))
        if (s.combo && Date.now() - s.lastTapAt > COMBO_WINDOW_MS * 1.6) patch.combo = 0
        set(patch)
      },

      applyOffline() {
        const s = get()
        const ms = Math.min(Date.now() - s.lastSeen, 3 * 3600_000)
        if (ms < 60_000) return null
        const coins = Math.floor((autoFor(s.upgrades.autoTap) * ms) / 1000)
        const max = maxEnergyFor(s.upgrades.maxEnergy)
        set({
          energy: Math.min(max, s.energy + (regenFor(s.upgrades.regen) * ms) / 1000),
          lastSeen: Date.now(),
          ...(coins > 0 ? earn(s, coins) : {}),
        })
        return coins > 0 ? { coins, ms } : null
      },

      buyUpgrade(id) {
        const s = get()
        const u = getUpgrade(id)
        const lvl = s.upgrades[id]
        const cost = upgradeCost(u, lvl)
        if (lvl >= u.maxLevel || s.coins < cost) return false
        set({
          coins: s.coins - cost,
          upgrades: { ...s.upgrades, [id]: lvl + 1 },
          daily: { ...s.daily, upgrades: s.daily.upgrades + 1 },
          // a bigger generator also tops up the new capacity
          energy: id === 'maxEnergy' ? s.energy + 250 : s.energy,
        })
        return true
      },

      unlockCharacter(id) {
        const s = get()
        const c = getCharacter(id)
        const cp = s.chars[id]
        if (!cp || cp.unlocked || s.coins < c.unlockCost) return false
        set({ coins: s.coins - c.unlockCost, chars: { ...s.chars, [id]: { ...cp, unlocked: true } }, selected: id })
        return true
      },

      selectCharacter(id) {
        if (get().chars[id]?.unlocked) set({ selected: id, combo: 0 })
      },

      useBoost(kind) {
        const s = get()
        const used = kind === 'refill' ? s.daily.refillUsed : s.daily.turboUsed
        if (used >= BOOSTS[kind].perDay) return false
        if (kind === 'refill') {
          set({ energy: maxEnergyFor(s.upgrades.maxEnergy), daily: { ...s.daily, refillUsed: used + 1 } })
        } else {
          set({ turboUntil: Date.now() + BOOSTS.turbo.durationMs, daily: { ...s.daily, turboUsed: used + 1 } })
        }
        return true
      },

      claimChallenge(c) {
        const s = get()
        if (s.daily.claimed.includes(c.id) || metricValue(s.daily, c.metric) < c.target) return false
        const e = earn(s, c.reward)
        set({ ...e, daily: { ...e.daily!, claimed: [...s.daily.claimed, c.id] } })
        return true
      },

      claimStreak() {
        const s = get()
        const today = dayKey()
        if (s.streak.last === today) return 0
        const continued = s.streak.last && daysBetween(s.streak.last, today) === 1
        const count = continued ? s.streak.count + 1 : 1
        const week = Math.floor((count - 1) / 7)
        const reward = STREAK_REWARDS[(count - 1) % 7] * (1 + week)
        set({ ...earn(s, reward), streak: { last: today, count } })
        return reward
      },

      finishBoss(win, score) {
        const s = get()
        const reward = win ? bossReward(s.bossLevel) : Math.round(score * 2)
        const e = earn(s, reward)
        set({
          ...e,
          bossLevel: win ? s.bossLevel + 1 : s.bossLevel,
          best: { ...s.best, boss: Math.max(s.best.boss, score) },
          daily: { ...e.daily!, bossWins: s.daily.bossWins + (win ? 1 : 0) },
        })
        if (win) get().burst('win')
        return reward
      },

      finishDuel(win, score) {
        const s = get()
        const reward = win ? 2_000 + score * 10 : score * 2
        const e = earn(s, reward)
        set({
          ...e,
          best: { ...s.best, duel: Math.max(s.best.duel, score) },
          daily: { ...e.daily!, duelWins: s.daily.duelWins + (win ? 1 : 0) },
        })
        if (win) get().burst('win')
        return reward
      },

      say(text) {
        set({ bubble: { text, id: Date.now() }, lastBubbleAt: Date.now() })
      },

      burst(kind) {
        set((s) => ({ fxBurst: s.fxBurst + 1, fxBurstKind: kind }))
      },

      setSettings(p) {
        set((s) => ({ settings: { ...s.settings, ...p } }))
      },

      takePendingSync() {
        const p = get().pendingSync
        set({ pendingSync: { coins: 0, taps: 0 } })
        return p
      },

      resetAll() {
        set({ ...initial(), combo: 0, bubble: null })
      },
    }),
    {
      name: 'tap-the-politician',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) =>
        Object.fromEntries(PERSIST_KEYS.map((k) => [k, s[k]])) as unknown as GameState,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Persisted>
        return {
          ...current,
          ...p,
          upgrades: { ...current.upgrades, ...p.upgrades },
          settings: { ...current.settings, ...p.settings },
          best: { ...current.best, ...p.best },
          chars: { ...current.chars, ...p.chars },
        }
      },
    },
  ),
)

export function metricValue(d: DailyStats, m: ChallengeMetric): number {
  return d[m]
}

// Derived selectors
export const useMaxEnergy = () => useGame((s) => maxEnergyFor(s.upgrades.maxEnergy))
export const useTapPower = () => useGame((s) => tapPowerFor(s.upgrades.tapPower))
export const useAutoRate = () => useGame((s) => autoFor(s.upgrades.autoTap))
export const allUpgradeIds = UPGRADES.map((u) => u.id)
