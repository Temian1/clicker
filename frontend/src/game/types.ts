export type Headwear = 'fila' | 'gele' | 'okpu' | 'zanna' | 'bowler' | 'beret'
export type Accessory = 'sunglasses' | 'bag' | 'mic' | 'phone' | 'beads' | 'passport' | 'fan' | 'calculator'
export type FacialHair = 'none' | 'moustache' | 'beard' | 'goatee'
export type Build = 'round' | 'tall' | 'stout'

/**
 * Fully data-driven character definition. The Politician SVG component renders
 * every layer (robe, cap, eyes, mouth, props) from this config, so new characters
 * can be added from the Laravel admin without shipping new art.
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

export type UpgradeId = 'tapPower' | 'maxEnergy' | 'regen' | 'autoTap' | 'comboCap' | 'crit'

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

export type ChallengeMetric = 'taps' | 'coins' | 'maxCombo' | 'bossWins' | 'stageUps' | 'duelWins' | 'upgrades'

export interface DailyChallenge {
  id: string
  metric: ChallengeMetric
  target: number
  reward: number
  label: string
}
