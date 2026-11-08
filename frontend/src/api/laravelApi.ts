import type { CharacterDef, LeaderboardEntry, OvertakeAlert, Period } from '../game/types'
import type { GameApi, HeartbeatResult, LeaderboardResponse, PlayerSnapshot, SupportTicket } from './types'

/**
 * HTTP client for the Laravel backend in /backend (Sanctum bearer tokens).
 * See backend/API.md for the full contract.
 */
export class LaravelApi implements GameApi {
  readonly mode = 'remote' as const
  private token: string | null = localStorage.getItem('ttp-token')
  private readonly base: string

  constructor(base: string) {
    this.base = base.replace(/\/$/, '')
  }

  private who: { id: string; name: string; avatar: string } | null = null

  private async req<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    const res = await fetch(`${this.base}/api${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401 && retry && this.who && path !== '/auth/guest') {
      // token expired / revoked → log in again as the same guest and retry once
      await this.login(this.who)
      return this.req<T>(method, path, body, false)
    }
    if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`)
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
  }

  async login(p: { id: string; name: string; avatar: string }) {
    this.who = p
    const r = await this.req<{ token: string }>('POST', '/auth/guest', { device_id: p.id, nickname: p.name, avatar: p.avatar })
    this.token = r.token
    localStorage.setItem('ttp-token', r.token)
  }

  async heartbeat(me: PlayerSnapshot): Promise<HeartbeatResult> {
    const sync = await this.req<{ you_passed: { name: string; period: Period; new_rank: number }[] }>('POST', '/progress/sync', {
      coins: me.pending.coins,
      taps: me.pending.taps,
      character_id: me.characterId,
      best_combo: me.bestCombo,
    })
    const alerts = await this.req<{ data: { id: string; by_name: string; by_avatar: string; period: Period; new_rank: number; created_at: string }[] }>(
      'GET',
      '/alerts?unread=1',
    )
    if (alerts.data.length) await this.req('POST', '/alerts/read', { ids: alerts.data.map((a) => a.id) })
    return {
      overtakenBy: alerts.data.map<OvertakeAlert>((a) => ({
        id: a.id,
        byName: a.by_name,
        byAvatar: a.by_avatar,
        period: a.period,
        newRank: a.new_rank,
        at: Date.parse(a.created_at),
      })),
      youPassed: (sync.you_passed ?? []).map((y) => ({ name: y.name, period: y.period, newRank: y.new_rank })),
    }
  }

  async leaderboard(period: Period): Promise<LeaderboardResponse> {
    type Row = { user_id: string; name: string; avatar: string; score: number; rank: number; is_me?: boolean }
    const r = await this.req<{ period: Period; entries: Row[]; me: Row; total: number }>('GET', `/leaderboard?period=${period}`)
    const map = (x: Row): LeaderboardEntry => ({ id: x.user_id, name: x.name, avatar: x.avatar, score: x.score, rank: x.rank, isMe: x.is_me })
    return { period: r.period, entries: r.entries.map(map), me: { ...map(r.me), isMe: true }, total: r.total }
  }

  async duelOpponent() {
    const r = await this.req<{ name: string; avatar: string; tps: number }>('GET', '/duels/opponent')
    return r
  }

  async characters() {
    const r = await this.req<{ data: CharacterDef[] }>('GET', '/characters')
    return r.data.length ? r.data : null
  }

  async reportBattle(kind: 'boss' | 'duel', r: { win: boolean; taps: number; level?: number }) {
    await this.req('POST', kind === 'boss' ? '/boss/results' : '/duels/results', r)
  }

  async sendSupport(t: SupportTicket) {
    await this.req('POST', '/support', t)
  }
}
