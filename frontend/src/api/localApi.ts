import { dayKey, seeded, weekKey } from '../game/progression'
import type { LeaderboardEntry, Period } from '../game/types'
import type { GameApi, HeartbeatResult, LeaderboardResponse, PlayerSnapshot, SupportTicket } from './types'

/**
 * Offline mock backend. Simulates a living leaderboard of other players so the
 * "someone surpassed you" alerts work before the Laravel API is deployed.
 * Rivals pace themselves to your earning speed, so they overtake you when you
 * stop tapping — and you can overtake them back.
 */

const KEY = 'ttp-mock-backend'
const PERIODS: Period[] = ['daily', 'weekly', 'all']

const NAMES = [
  'Tunde_Taps', 'Chioma💅', 'BigBoyEmeka', 'Aisha.K', 'MallamSpeed', 'Ngozi_Queen', 'Seun4Real', 'IbroTheGreat',
  'Kemi_Kruise', 'Obinna_OG', 'Funmi.fingers', 'Uche_Ultra', 'Bayo_Blaze', 'Zainab_Z', 'Femi_Fast', 'Adaeze',
  'Yusuf_Yawa', 'Tolu_Turbo', 'Chidi_Chop', 'Halima.H', 'Dapo_Dynamite', 'Amaka_Amazing', 'Sani_Smash', 'Bisi_Boss',
  'Ifeanyi_IQ', 'Lola_Lagos', 'Musa_Machine', 'Nkechi_Nova', 'Wale_Wahala', 'Efe_Energy', 'Gbenga_Go', 'Hauwa_Hype',
  'Jide_Jollof', 'Kunle_King', 'Mercy_Moves', 'Osas_Oga', 'Rotimi_Rush', 'Simi_Swift', 'Timi_Tapper', 'Victor_Vibes',
]
const AVATARS = ['😎', '🤠', '🧢', '👑', '🦁', '🔥', '⚡', '🐐', '💰', '🎤', '🥁', '🌶️']

interface Bot {
  id: string
  name: string
  avatar: string
  kind: 'top' | 'mid' | 'rival'
  speed: number
  scores: Record<Period, number>
}

interface MockState {
  dayKey: string
  weekKey: string
  bots: Bot[]
  above: Record<Period, string[]> | null
  lastTick: number
}

function makeBots(): Bot[] {
  const rnd = seeded('ttp-bots-v1')
  return NAMES.map((name, i) => {
    const kind: Bot['kind'] = i < 8 ? 'top' : i < 28 ? 'mid' : 'rival'
    const all =
      kind === 'top' ? Math.round(5e6 * (1 + rnd() * 9)) : kind === 'mid' ? Math.round(2e4 + rnd() * 6e5) : Math.round(50 + rnd() * 600)
    const daily = kind === 'top' ? Math.round(5e4 + rnd() * 3e5) : kind === 'mid' ? Math.round(rnd() * 2e4) : Math.round(rnd() * 400)
    return {
      id: `bot-${i}`,
      name,
      avatar: AVATARS[Math.floor(rnd() * AVATARS.length)],
      kind,
      speed: kind === 'top' ? 30 + rnd() * 200 : kind === 'mid' ? 2 + rnd() * 25 : 0.55 + rnd() * 0.6,
      scores: { daily, weekly: daily + Math.round(rnd() * daily * 4), all },
    }
  })
}

function load(): MockState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as MockState
  } catch {
    /* corrupted / unavailable */
  }
  return { dayKey: dayKey(), weekKey: weekKey(), bots: makeBots(), above: null, lastTick: Date.now() }
}

function save(s: MockState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

function rollPeriods(s: MockState) {
  const dk = dayKey()
  const wk = weekKey()
  if (s.dayKey !== dk) {
    s.bots.forEach((b) => (b.scores.daily = b.kind === 'top' ? Math.round(Math.random() * 5e4) : 0))
    s.dayKey = dk
    s.above = null
  }
  if (s.weekKey !== wk) {
    s.bots.forEach((b) => (b.scores.weekly = b.scores.daily))
    s.weekKey = wk
    s.above = null
  }
}

function aboveSets(s: MockState, me: PlayerSnapshot): Record<Period, string[]> {
  const out = {} as Record<Period, string[]>
  for (const p of PERIODS) out[p] = s.bots.filter((b) => b.scores[p] > me.scores[p]).map((b) => b.id)
  return out
}

function rankOf(s: MockState, me: PlayerSnapshot, p: Period) {
  return s.bots.filter((b) => b.scores[p] > me.scores[p]).length + 1
}

export class LocalApi implements GameApi {
  readonly mode = 'local' as const
  private s = load()

  async login() {
    /* nothing to do offline */
  }

  async heartbeat(me: PlayerSnapshot): Promise<HeartbeatResult> {
    const s = this.s
    rollPeriods(s)
    const now = Date.now()
    const dt = Math.min(30, (now - s.lastTick) / 1000)
    s.lastTick = now

    const myRate = Math.max(me.rate, 1.5)
    for (const b of s.bots) {
      const burst = Math.random() < 0.15 ? 2.5 : 1 // sometimes a player goes on a tapping spree
      const inc =
        b.kind === 'rival'
          ? dt * myRate * b.speed * (0.3 + Math.random() * 1.4) * burst
          : dt * b.speed * Math.random() * burst * (Math.random() < 0.4 ? 1 : 0)
      const n = Math.round(inc)
      if (n <= 0) continue
      b.scores.daily += n
      b.scores.weekly += n
      b.scores.all += n
    }

    const result: HeartbeatResult = { overtakenBy: [], youPassed: [] }
    const nowAbove = aboveSets(s, me)
    if (s.above) {
      for (const p of PERIODS) {
        const prev = new Set(s.above[p])
        const cur = new Set(nowAbove[p])
        const newRank = nowAbove[p].length + 1
        for (const id of cur) {
          if (prev.has(id)) continue
          const b = s.bots.find((x) => x.id === id)!
          result.overtakenBy.push({ id: `${id}-${p}-${now}`, byName: b.name, byAvatar: b.avatar, period: p, newRank, at: now })
        }
        for (const id of prev) {
          if (cur.has(id)) continue
          const b = s.bots.find((x) => x.id === id)!
          result.youPassed.push({ name: b.name, period: p, newRank })
        }
      }
    }
    s.above = nowAbove
    save(s)
    return result
  }

  async leaderboard(period: Period, me: PlayerSnapshot): Promise<LeaderboardResponse> {
    rollPeriods(this.s)
    const rows: LeaderboardEntry[] = this.s.bots.map((b) => ({ id: b.id, name: b.name, avatar: b.avatar, score: b.scores[period], rank: 0 }))
    const mine: LeaderboardEntry = { id: me.id, name: me.name, avatar: me.avatar, score: me.scores[period], rank: 0, isMe: true }
    rows.push(mine)
    rows.sort((a, b) => b.score - a.score || (a.isMe ? -1 : 1))
    rows.forEach((r, i) => (r.rank = i + 1))
    return { period, entries: rows.slice(0, 50), me: { ...mine, rank: rankOf(this.s, me, period) }, total: rows.length }
  }

  async duelOpponent(me: PlayerSnapshot) {
    const pool = this.s.bots.filter((b) => b.kind !== 'top')
    const b = pool[Math.floor(Math.random() * pool.length)]
    // ghost speed scales a little with the player's best combo
    const tps = 4 + Math.random() * 3 + Math.min(4, me.bestCombo / 150)
    return { name: b.name, avatar: b.avatar, tps }
  }

  async characters() {
    return null
  }

  async reportBattle() {
    /* stored locally by the game store */
  }

  async sendSupport(t: SupportTicket) {
    const list = JSON.parse(localStorage.getItem('ttp-support-outbox') ?? '[]') as unknown[]
    list.push({ ...t, at: Date.now() })
    localStorage.setItem('ttp-support-outbox', JSON.stringify(list))
  }
}

