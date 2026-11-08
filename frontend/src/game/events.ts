/**
 * "Today's Wahala": a random economy modifier that sometimes hits a run.
 * Harder runs pay more. Framed as generic economic satire, not as any named
 * cast member personally stealing.
 */
export interface Modifier {
  id: string
  icon: string
  title: string
  body: string
  /** coin multiplier for the run */
  reward: number
  /** items fall / politicians hide faster */
  speed: number
  /** more bad items (catcher) / more citizens (whack) */
  bad: number
  /** more good & golden stuff */
  good: number
  /** screen goes dark (NEPA) */
  dark: boolean
}

export const MODIFIERS: Modifier[] = [
  { id: 'petrol', icon: '⛽', title: 'Petrol price don jump!', body: 'Everything moves 25% faster', reward: 1.5, speed: 1.25, bad: 1, good: 1, dark: false },
  { id: 'naira', icon: '📉', title: 'Naira don fall again!', body: 'More bad items and citizens in the way', reward: 1.4, speed: 1, bad: 1.5, good: 1, dark: false },
  { id: 'nepa', icon: '💡', title: 'NEPA don take light!', body: 'Play in the dark', reward: 1.6, speed: 1, bad: 1, good: 1, dark: true },
  { id: 'tax', icon: '🧾', title: 'Tax season!', body: 'Faster AND more bad items', reward: 2, speed: 1.15, bad: 1.3, good: 1, dark: false },
  { id: 'palliative', icon: '🎁', title: 'Palliative season!', body: 'More good & golden items (no bonus)', reward: 1, speed: 1, bad: 0.7, good: 1.6, dark: false },
]

export const NO_MODIFIER: Modifier = { id: 'none', icon: '☀️', title: 'Normal day', body: '', reward: 1, speed: 1, bad: 1, good: 1, dark: false }

/** ~40% of runs get a modifier. */
export function rollModifier(): Modifier {
  if (Math.random() > 0.4) return NO_MODIFIER
  return MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]
}

export const getModifier = (id: string | null) => MODIFIERS.find((m) => m.id === id) ?? NO_MODIFIER
