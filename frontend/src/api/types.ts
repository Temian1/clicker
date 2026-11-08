import type { CharacterDef, LeaderboardEntry, OvertakeAlert, Period } from '../game/types'

export interface PlayerSnapshot {
  id: string
  name: string
  avatar: string
  scores: Record<Period, number>
  /** recent earning rate (coins / sec), used by the mock to pace rivals */
  rate: number
  pending: { coins: number; taps: number }
  characterId: string
  bestCombo: number
}

export interface LeaderboardResponse {
  period: Period
  entries: LeaderboardEntry[]
  me: LeaderboardEntry
  total: number
}

export interface HeartbeatResult {
  /** players that just overtook you */
  overtakenBy: OvertakeAlert[]
  /** players you just overtook */
  youPassed: { name: string; period: Period; newRank: number }[]
}

export interface SupportTicket {
  category: 'bug' | 'idea' | 'account' | 'other'
  message: string
  email?: string
}

export interface GameApi {
  readonly mode: 'local' | 'remote'
  /** Register (or resume) a guest player. */
  login(p: { id: string; name: string; avatar: string }): Promise<void>
  /** Push progress delta + pull overtake alerts. Called every few seconds. */
  heartbeat(p: PlayerSnapshot): Promise<HeartbeatResult>
  leaderboard(period: Period, me: PlayerSnapshot): Promise<LeaderboardResponse>
  /** Pick a ghost opponent for the 60s duel */
  duelOpponent(me: PlayerSnapshot): Promise<{ name: string; avatar: string; tps: number }>
  sendSupport(t: SupportTicket): Promise<void>
  /** Server roster (null = use the bundled roster). */
  characters(): Promise<CharacterDef[] | null>
  reportBattle(kind: 'boss' | 'duel', r: { win: boolean; taps: number; level?: number }): Promise<void>
}
