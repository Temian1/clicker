/**
 * "Economy Wahala" events. Every minute or two the economy hits your pocket:
 * petrol price jumps, new taxes, NEPA tariffs. You get a few seconds to
 * PROTEST (tap fast) and block it. Fail, and you pay.
 * Some events are lucky ones (palliatives): tap to collect, no penalty.
 *
 * Events are framed as generic economic policy satire, not as any named
 * cast member personally stealing.
 */
export type EventKind = 'drain' | 'nerf' | 'energy' | 'bonus'

export interface EconomyEvent {
  id: string
  title: string
  body: string
  icon: string
  kind: EventKind
  /** drain: share of coins lost · nerf: earnings multiplier · energy: share drained · bonus: coins per level */
  amount: number
  durationMs?: number
}

export const EVENTS: EconomyEvent[] = [
  { id: 'petrol', icon: '⛽', kind: 'nerf', amount: 0.5, durationMs: 45_000, title: 'Petrol price don jump!', body: 'Tap earnings -50% for 45s' },
  { id: 'naira', icon: '📉', kind: 'nerf', amount: 0.65, durationMs: 60_000, title: 'Naira don fall again!', body: 'Tap earnings -35% for 60s' },
  { id: 'tax', icon: '🧾', kind: 'drain', amount: 0.1, title: 'New tax on tapping!', body: 'Lose 10% of your coins' },
  { id: 'bank', icon: '🏦', kind: 'drain', amount: 0.05, title: 'Bank SMS charges!', body: 'Lose 5% of your coins' },
  { id: 'toll', icon: '🚧', kind: 'drain', amount: 0.08, title: 'Agbero toll gate!', body: 'Lose 8% of your coins' },
  { id: 'nepa', icon: '💡', kind: 'energy', amount: 0.5, title: 'NEPA tariff hike!', body: 'Lose 50% of your energy' },
  { id: 'palliative', icon: '🎁', kind: 'bonus', amount: 400, title: 'Palliative dey share!', body: 'Tap fast to collect before e finish' },
]

export const PROTEST_WINDOW_MS = 8_000
export const protestTarget = (level: number) => 30 + Math.min(40, level * 2)
export const protestReward = (level: number) => 300 * level
export const nextEventDelay = () => 60_000 + Math.random() * 60_000

export function pickEvent(): EconomyEvent {
  // palliatives are rarer than bad news 😅
  const pool = Math.random() < 0.15 ? EVENTS.filter((e) => e.kind === 'bonus') : EVENTS.filter((e) => e.kind !== 'bonus')
  return pool[Math.floor(Math.random() * pool.length)]
}
