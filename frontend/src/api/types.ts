import type { Board, CharacterDef, GameMode, LeaderboardEntry, OvertakeAlert, Period } from '../game/types'

export interface RunUpload {
  mode: GameMode
  score: number
  durationMs: number
  maxCombo: number
  characterId: string
}

export interface PlayerSnapshot {
  id: string
  name: string
  avatar: string
  /** coins earned per period (the "coins" board) */
  scores: Record<Period, number>
  /** best run score per game per period */
  bests: Record<GameMode, Record<Period, number>>
  /** recent earning rate (coins / sec), used by the mock to pace rivals */
  rate: number
  pending: { coins: number; taps: number }
  runs: RunUpload[]
  characterId: string
  bestCombo: number
}

export interface LeaderboardResponse {
  board: Board
  period: Period
  entries: LeaderboardEntry[]
  me: LeaderboardEntry
  total: number
}

export interface HeartbeatResult {
  /** players that just overtook you (coins board) */
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
  /** Push coins delta + finished runs, pull overtake alerts. Called every few seconds. */
  heartbeat(p: PlayerSnapshot): Promise<HeartbeatResult>
  leaderboard(board: Board, period: Period, me: PlayerSnapshot): Promise<LeaderboardResponse>
  sendSupport(t: SupportTicket): Promise<void>
  /** Server roster (null = use the bundled roster). */
  characters(): Promise<CharacterDef[] | null>
}
