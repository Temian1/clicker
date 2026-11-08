import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CHARACTERS, getCharacter, playableCharacters, randomLine } from './characters'
import { getModifier } from './events'
import {
  STREAK_REWARDS,
  dayKey,
  daysBetween,
  getUpgrade,
  meltdownAt,
  meltdownReward,
  runCoins,
  stageFor,
  upgradeCost,
  weekKey,
} from './progression'
import type { ChallengeMetric, DailyChallenge, GameMode, RunResult, UpgradeId } from './types'

export interface CharProgress {
  unlocked: boolean
  wahala: number
  term: number
  meltdowns: number
  runs: number
}

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: number
}

export interface DailyStats {
  key: string
  runs: number
  coins: number
  maxCombo: number
  catcherBest: number
  whackBest: number
  caught: number
  whacked: number
  upgrades: number
  claimed: string[]
}

export interface Settings {
  sfx: boolean
  music: boolean
  haptics: boolean
  voice: boolean
}

/** Everything the game-over screen needs to show. */
export interface RunOutcome {
  mode: GameMode
  score: number
  coins: number
  newBest: boolean
  best: number
  stageUp: number | null
  meltdown: { reward: number; level: number; nextId: string; nextName: string; newUnlock: boolean; term: number } | null
  /** wahala progress of the politician BEFORE the run (0-1 of meltdown) */
  before: number
  after: number
}

interface Persisted {
  profile: Profile | null
  coins: number
  totalEarned: number
  totalRuns: number
  upgrades: Record<UpgradeId, number>
  selected: string
  chars: Record<string, CharProgress>
  best: { catcher: number; whack: number; combo: number; meltdowns: number }
  daily: DailyStats
  /** per-period coins + best scores, for the leaderboards */
  period: {
    dayKey: string
    weekKey: string
    daily: number
    weekly: number
    catcher: { daily: number; weekly: number }
    whack: { daily: number; weekly: number }
  }
  streak: { last: string | null; count: number }
  /** Global level: +1 per meltdown. Each level moves you to the next cast member. */
  level: number
  settings: Settings
  pendingSync: { coins: number; taps: number }
  pendingRuns: { mode: GameMode; score: number; durationMs: number; maxCombo: number; characterId: string }[]
}

interface Transient {
  bubble: { text: string; id: number } | null
  fxBurst: number
  fxBurstKind: 'stage' | 'meltdown' | 'win'
}

interface Actions {
  setProfile(name: string, avatar: string): void
  ensureDay(): void
  finishRun(r: RunResult): RunOutcome
  buyUpgrade(id: UpgradeId): boolean
  unlockCharacter(id: string): boolean
  selectCharacter(id: string): void
  claimChallenge(c: DailyChallenge): boolean
  claimStreak(): number
  say(text: string): void
  burst(kind: Transient['fxBurstKind']): void
  setSettings(p: Partial<Settings>): void
  takePendingSync(): { coins: number; taps: number }
  takePendingRuns(): Persisted['pendingRuns']
  resetAll(): void
}

export type GameState = Persisted & Transient & Actions

const emptyDaily = (key: string): DailyStats => ({
  key,
  runs: 0,
  coins: 0,
  maxCombo: 0,
  catcherBest: 0,
  whackBest: 0,
  caught: 0,
  whacked: 0,
  upgrades: 0,
  claimed: [],
})

const newChar = (unlocked: boolean): CharProgress => ({ unlocked, wahala: 0, term: 1, meltdowns: 0, runs: 0 })

const initialChars = (): Record<string, CharProgress> =>
  Object.fromEntries(CHARACTERS.filter((c) => !c.comingSoon).map((c) => [c.id, newChar(c.unlockCost === 0)]))

const emptyPeriod = (): Persisted['period'] => ({
  dayKey: dayKey(),
  weekKey: weekKey(),
  daily: 0,
  weekly: 0,
  catcher: { daily: 0, weekly: 0 },
  whack: { daily: 0, weekly: 0 },
})

const initial = (): Persisted => ({
  profile: null,
  coins: 0,
  totalEarned: 0,
  totalRuns: 0,
  upgrades: { coinValue: 0, basket: 0, magnet: 0, lives: 0, luck: 0, calm: 0 },
  selected: CHARACTERS[0].id,
  chars: initialChars(),
  best: { catcher: 0, whack: 0, combo: 0, meltdowns: 0 },
  daily: emptyDaily(dayKey()),
  period: emptyPeriod(),
  streak: { last: null, count: 0 },
  level: 1,
  settings: { sfx: true, music: true, haptics: true, voice: false },
  pendingSync: { coins: 0, taps: 0 },
  pendingRuns: [],
})

const PERSIST_KEYS = Object.keys(initial()) as (keyof Persisted)[]

/** Pure helper: add earned coins to every counter that tracks earnings. */
function earn(s: Persisted, n: number): Pick<Persisted, 'coins' | 'totalEarned' | 'daily' | 'period' | 'pendingSync'> {
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
      bubble: null,
      fxBurst: 0,
      fxBurstKind: 'stage',

      setProfile(name, avatar) {
        const p = get().profile
        set({
          profile: {
            id: p?.id ?? crypto.randomUUID(),
            name: name.trim().slice(0, 18) || 'Oga Player',
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
          const sameDay = s.period.dayKey === dk
          const sameWeek = s.period.weekKey === wk
          patch.period = {
            dayKey: dk,
            weekKey: wk,
            daily: sameDay ? s.period.daily : 0,
            weekly: sameWeek ? s.period.weekly : 0,
            catcher: { daily: sameDay ? s.period.catcher.daily : 0, weekly: sameWeek ? s.period.catcher.weekly : 0 },
            whack: { daily: sameDay ? s.period.whack.daily : 0, weekly: sameWeek ? s.period.whack.weekly : 0 },
          }
        }
        const missing = CHARACTERS.filter((c) => !c.comingSoon && !s.chars[c.id])
        if (missing.length) {
          patch.chars = { ...s.chars }
          for (const c of missing) patch.chars[c.id] = newChar(c.unlockCost === 0)
        }
        if (!s.chars[s.selected] && !patch.chars?.[s.selected]) patch.selected = playableCharacters()[0].id
        if (Object.keys(patch).length) set(patch)
      },

      finishRun(r) {
        get().ensureDay()
        const s = get()
        const char = getCharacter(s.selected)
        const cp = s.chars[s.selected] ?? newChar(true)
        const mod = getModifier(r.modifier)
        const coins = runCoins(r.score, s.upgrades.coinValue, char.coinBonus, mod.reward)

        // wahala: the run's score pushes the politician through their poses
        const beforeStage = stageFor(cp.wahala, cp.term)
        const before = cp.wahala / meltdownAt(cp.term)
        let wahala = cp.wahala + r.score
        let term = cp.term
        let chars = s.chars
        let meltdown: RunOutcome['meltdown'] = null
        let stageUp: number | null = null
        let bonus = 0
        let selected = s.selected
        let level = s.level

        if (wahala >= meltdownAt(term)) {
          bonus = meltdownReward(term, char.coinBonus)
          term += 1
          wahala = 0
          // LEVEL UP → the next politician in the cast steps up (loops forever)
          const cast = playableCharacters()
          const idx = cast.findIndex((c) => c.id === s.selected)
          const next = cast[(idx + 1) % cast.length]
          const nextCp = s.chars[next.id] ?? newChar(false)
          chars = { ...s.chars, [next.id]: { ...nextCp, unlocked: true } }
          level = s.level + 1
          selected = next.id
          meltdown = { reward: bonus, level, nextId: next.id, nextName: next.name, newUnlock: !nextCp.unlocked, term: nextCp.term }
        } else {
          const afterStage = stageFor(wahala, term)
          if (afterStage > beforeStage) stageUp = afterStage
        }
        chars = { ...chars, [s.selected]: { ...cp, wahala, term, meltdowns: cp.meltdowns + (meltdown ? 1 : 0), runs: cp.runs + 1 } }

        const prevBest = s.best[r.mode]
        const e = earn(s, coins + bonus)
        const per = e.period[r.mode]
        set({
          ...e,
          chars,
          selected,
          level,
          totalRuns: s.totalRuns + 1,
          best: {
            ...s.best,
            [r.mode]: Math.max(prevBest, r.score),
            combo: Math.max(s.best.combo, r.maxCombo),
            meltdowns: s.best.meltdowns + (meltdown ? 1 : 0),
          },
          daily: {
            ...e.daily,
            runs: s.daily.runs + 1,
            maxCombo: Math.max(s.daily.maxCombo, r.maxCombo),
            catcherBest: r.mode === 'catcher' ? Math.max(s.daily.catcherBest, r.score) : s.daily.catcherBest,
            whackBest: r.mode === 'whack' ? Math.max(s.daily.whackBest, r.score) : s.daily.whackBest,
            caught: s.daily.caught + (r.mode === 'catcher' ? r.hits : 0),
            whacked: s.daily.whacked + (r.mode === 'whack' ? r.hits : 0),
          },
          period: { ...e.period, [r.mode]: { daily: Math.max(per.daily, r.score), weekly: Math.max(per.weekly, r.score) } },
          pendingSync: { coins: e.pendingSync.coins, taps: s.pendingSync.taps + r.hits },
          pendingRuns: [
            ...s.pendingRuns.slice(-19),
            { mode: r.mode, score: r.score, durationMs: r.durationMs, maxCombo: r.maxCombo, characterId: s.selected },
          ],
        })

        if (meltdown) {
          get().burst('meltdown')
          get().say(randomLine(getCharacter(meltdown.nextId), 0))
        } else if (stageUp !== null) {
          get().burst('stage')
          get().say(randomLine(char, stageUp))
        } else if (r.score > prevBest && prevBest > 0) {
          get().burst('win')
        }

        return {
          mode: r.mode,
          score: r.score,
          coins: coins + bonus,
          newBest: r.score > prevBest,
          best: Math.max(prevBest, r.score),
          stageUp,
          meltdown,
          before,
          after: meltdown ? 1 : wahala / meltdownAt(term),
        }
      },

      buyUpgrade(id) {
        const s = get()
        const u = getUpgrade(id)
        const lvl = s.upgrades[id]
        const cost = upgradeCost(u, lvl)
        if (lvl >= u.maxLevel || s.coins < cost) return false
        set({ coins: s.coins - cost, upgrades: { ...s.upgrades, [id]: lvl + 1 }, daily: { ...s.daily, upgrades: s.daily.upgrades + 1 } })
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
        if (get().chars[id]?.unlocked) set({ selected: id })
      },

      claimChallenge(c) {
        const s = get()
        if (s.daily.claimed.includes(c.id) || metricValue(s.daily, c.metric) < c.target) return false
        const e = earn(s, c.reward)
        set({ ...e, daily: { ...e.daily, claimed: [...s.daily.claimed, c.id] } })
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

      say(text) {
        set({ bubble: { text, id: Date.now() } })
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

      takePendingRuns() {
        const p = get().pendingRuns
        set({ pendingRuns: [] })
        return p
      },

      resetAll() {
        set({ ...initial(), bubble: null })
      },
    }),
    {
      name: 'tap-the-politician',
      // v2: tapper → Promise Catcher + Whack-a-Politician
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => Object.fromEntries(PERSIST_KEYS.map((k) => [k, s[k]])) as unknown as GameState,
      migrate: (old) => {
        // keep coins, cast progress, level, profile and settings; reset tapper-only data
        const o = (old ?? {}) as Partial<Persisted> & { chars?: Record<string, Partial<CharProgress>> }
        const base = initial()
        const chars = { ...base.chars }
        for (const [id, c] of Object.entries(o.chars ?? {})) {
          chars[id] = { ...newChar(!!c.unlocked), unlocked: !!c.unlocked, wahala: 0, term: c.term ?? 1, meltdowns: c.meltdowns ?? 0 }
        }
        return {
          ...base,
          profile: o.profile ?? null,
          coins: o.coins ?? 0,
          totalEarned: o.totalEarned ?? 0,
          selected: o.selected ?? base.selected,
          chars,
          streak: o.streak ?? base.streak,
          level: o.level ?? 1,
          settings: { ...base.settings, ...o.settings },
        } as unknown as GameState
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Persisted>
        return {
          ...current,
          ...p,
          upgrades: { ...current.upgrades, ...p.upgrades },
          settings: { ...current.settings, ...p.settings },
          best: { ...current.best, ...p.best },
          chars: { ...current.chars, ...p.chars },
          period: { ...current.period, ...p.period },
          daily: { ...current.daily, ...p.daily },
        }
      },
    },
  ),
)

export function metricValue(d: DailyStats, m: ChallengeMetric): number {
  return d[m] ?? 0
}
