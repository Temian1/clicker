import { dayKey, seeded, weekKey } from '../game/progression'
import type { Board, GameMode, LeaderboardEntry, Period } from '../game/types'
import type { GameApi, HeartbeatResult, LeaderboardResponse, PlayerSnapshot, SupportTicket } from './types'

/**
 * Offline mock backend. Simulates a living leaderboard of other players so the
 * "someone surpassed you" alerts work before the Laravel API is deployed.
 * Rivals pace themselves to your earning speed, so they overtake you when you
 * stop tapping — and you can overtake them back.
 */

const KEY = 'ttp-mock-backend-v2'
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
      kind === 'top' ? Math.round(5e5 * (1 + rnd() * 6)) : kind === 'mid' ? Math.round(1e4 + rnd() * 2e5) : Math.round(50 + rnd() * 600)
    const daily = kind === 'top' ? Math.round(1.5e4 + rnd() * 5e4) : kind === 'mid' ? Math.round(rnd() * 1e4) : Math.round(rnd() * 400)
    return {
      id: `bot-${i}`,
      name,
      avatar: AVATARS[Math.floor(rnd() * AVATARS.length)],
      kind,
      speed: kind === 'top' ? 3 + rnd() * 20 : kind === 'mid' ? 0.5 + rnd() * 4 : 0.55 + rnd() * 0.6,
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


/** Simulated best run scores: they creep up through the day as bots "play". */
function botBest(b: Bot, mode: GameMode, period: Period, s: MockState): number {
  const rnd = seeded(`${b.id}-${mode}`)
  const base =
    b.kind === 'top' ? 1_400 + rnd() * 1_800 : b.kind === 'mid' ? 350 + rnd() * 1_100 : 120 + rnd() * 450
  const scale = mode === 'whack' ? 0.8 : 1
  const now = new Date()
  const dayFrac = (now.getHours() * 60 + now.getMinutes()) / 1440
  const dayRnd = seeded(`${b.id}-${mode}-${s.dayKey}`)()
  const daily = base * (0.35 + 0.65 * Math.min(1, dayFrac * 1.4)) * (0.7 + dayRnd * 0.4)
  const v = period === 'daily' ? daily : period === 'weekly' ? Math.max(daily, base * 1.05) : base * 1.35
  return Math.round(v * scale)
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

  async leaderboard(board: Board, period: Period, me: PlayerSnapshot): Promise<LeaderboardResponse> {
    rollPeriods(this.s)
    const score = (b: Bot) => (board === 'coins' ? b.scores[period] : botBest(b, board, period, this.s))
    const rows: LeaderboardEntry[] = this.s.bots.map((b) => ({ id: b.id, name: b.name, avatar: b.avatar, score: score(b), rank: 0 }))
    const myScore = board === 'coins' ? me.scores[period] : me.bests[board][period]
    const mine: LeaderboardEntry = { id: me.id, name: me.name, avatar: me.avatar, score: myScore, rank: 0, isMe: true }
    rows.push(mine)
    rows.sort((a, b) => b.score - a.score || (a.isMe ? -1 : 1))
    rows.forEach((r, i) => (r.rank = i + 1))
    return { board, period, entries: rows.slice(0, 50), me: { ...mine, rank: rows.findIndex((r) => r.isMe) + 1 }, total: rows.length }
  }

  async characters() {
    return null
  }

  async sendSupport(t: SupportTicket) {
    const list = JSON.parse(localStorage.getItem('ttp-support-outbox') ?? '[]') as unknown[]
    list.push({ ...t, at: Date.now() })
    localStorage.setItem('ttp-support-outbox', JSON.stringify(list))
  }
}

