export type Headwear = 'fila' | 'gele' | 'okpu' | 'zanna' | 'bowler' | 'beret'
export type Accessory = 'sunglasses' | 'bag' | 'mic' | 'phone' | 'beads' | 'passport' | 'fan' | 'calculator'
export type FacialHair = 'none' | 'moustache' | 'beard' | 'goatee'
export type Build = 'round' | 'tall' | 'stout'

/**
 * Data-driven character definition. The Politician component displays a
 * six-pose sprite sheet when supplied, with layered SVG as its fallback.
 */
export interface CharacterDef {
  id: string
  name: string
  title: string
  bio: string
  unlockCost: number
  /** Coin bonus multiplier while this character is selected */
  coinBonus: number
  look: {
    skin: string
    skinShade: string
    robe: string
    robeTrim: string
    robePattern: 'stripes' | 'dots' | 'embroidery' | 'zigzag'
    cap: string
    capTrim: string
    headwear: Headwear
    facialHair: FacialHair
    build: Build
    accessories: Accessory[]
    lipstick?: string
    /** Transparent 3-column, 2-row atlas, ordered by reaction stage. */
    spriteSheet?: string
  }
  /** Optional voice lines per stage (0-5); merged with the generic pool */
  lines?: Partial<Record<number, string[]>>
  /** Absurd promises used in the boss rally */
  promises?: string[]
  comingSoon?: boolean
}

export interface StageInfo {
  index: number
  name: string
  tagline: string
  min: number
  color: string
}

export type UpgradeId = 'coinValue' | 'basket' | 'magnet' | 'lives' | 'luck' | 'calm'

/** The two game modes. */
export type GameMode = 'catcher' | 'whack'

/** Leaderboards: total coins earned, or best run score per game. */
export type Board = 'coins' | GameMode

export interface UpgradeDef {
  id: UpgradeId
  name: string
  description: string
  icon: string
  baseCost: number
  growth: number
  maxLevel: number
  effectLabel: (level: number) => string
}

export type Period = 'daily' | 'weekly' | 'all'

export interface LeaderboardEntry {
  id: string
  name: string
  avatar: string
  score: number
  rank: number
  isMe?: boolean
}

export interface OvertakeAlert {
  id: string
  byName: string
  byAvatar: string
  period: Period
  newRank: number
  at: number
  read?: boolean
}

export type ChallengeMetric = 'runs' | 'coins' | 'maxCombo' | 'catcherBest' | 'whackBest' | 'caught' | 'whacked' | 'upgrades'

/** What a finished run reports back to the store. */
export interface RunResult {
  mode: GameMode
  score: number
  /** good items caught (catcher) or politicians voted out (whack) */
  hits: number
  maxCombo: number
  durationMs: number
  modifier: string | null
}

export interface DailyChallenge {
  id: string
  metric: ChallengeMetric
  target: number
  reward: number
  label: string
}
