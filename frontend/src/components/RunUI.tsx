import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { sfx } from '../game/audio'
import { getCharacter } from '../game/characters'
import type { Modifier } from '../game/events'
import { fmt } from '../game/format'
import { STAGES } from '../game/progression'
import type { RunOutcome } from '../game/store'
import { useGame } from '../game/store'
import { Icon } from './Icon'
import { Politician } from './Politician'
import { CoinAmount, GameButton, ProgressBar } from './ui'

/** Pre-run card: rules + today's economy modifier. */
export function PreRun({ title, icon, rules, modifier, best, onStart, onExit }: {
  title: string
  icon: string
  rules: [string, string][]
  modifier: Modifier
  best: number
  onStart: () => void
  onExit: () => void
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/60 px-5 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} className="panel w-full max-w-sm p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon name={icon} size={34} />
          <div className="font-display text-outline-sm flex-1 text-2xl">{title}</div>
          <span className="chip px-2 py-0.5 text-xs font-black">BEST {fmt(best)}</span>
        </div>
        <div className="mb-3 flex flex-col gap-1.5">
          {rules.map(([e, t]) => (
            <div key={t} className="flex items-center gap-2 rounded-xl bg-black/25 px-2.5 py-1.5 text-sm font-bold">
              <span className="w-7 text-center text-xl">{e}</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
        {modifier.id !== 'none' && (
          <motion.div
            initial={{ rotate: -4, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className={`mb-3 rounded-2xl border-[3px] border-[#042016] p-3 ${modifier.reward > 1 ? 'bg-[#ff4d4d]' : 'bg-[#00a859]'}`}
          >
            <div className="text-[11px] font-black tracking-widest text-white/80">TODAY'S WAHALA</div>
            <div className="font-display text-outline-sm flex items-center gap-2 text-xl">
              <span className="wobble text-2xl">{modifier.icon}</span> {modifier.title}
            </div>
            <div className="text-sm font-bold">
              {modifier.body}
              {modifier.reward > 1 && <span className="text-[#ffe082]"> · coins x{modifier.reward}</span>}
            </div>
          </motion.div>
        )}
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <GameButton tone="dark" onClick={onExit} aria-label="Back">
            <Icon name="back" size={20} />
          </GameButton>
          <GameButton tone="gold" className="shine text-2xl" onClick={onStart}>
            START
          </GameButton>
        </div>
      </motion.div>
    </div>
  )
}

export function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3)
  useEffect(() => {
    sfx.whistle()
    let v = 3
    const t = window.setInterval(() => {
      v -= 1
      setN(v)
      if (v <= 0) {
        window.clearInterval(t)
        window.setTimeout(onDone, 350)
      } else sfx.ui()
    }, 600)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-black/40">
      <AnimatePresence mode="popLayout">
        <motion.div key={n} initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }} className="font-display text-outline text-8xl text-[#ffc93c]">
          {n === 0 ? 'GO!' : n}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Game over: score, coins, politician wahala progress, level-up. */
export function GameOver({ outcome, charId, modifier, onAgain, onHome }: {
  outcome: RunOutcome
  charId: string
  modifier: Modifier
  onAgain: () => void
  onHome: () => void
}) {
  const def = getCharacter(charId)
  const term = useGame((s) => s.chars[charId]?.term ?? 1)
  const [bar, setBar] = useState(outcome.before)
  useEffect(() => {
    const t = window.setTimeout(() => setBar(outcome.after), 400)
    return () => window.clearTimeout(t)
  }, [outcome.after])
  const stage = outcome.meltdown ? 5 : Math.min(5, Math.floor(outcome.after * 6))

  return (
    <div className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-black/70 px-5 py-6 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.6, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 16 }} className="panel w-full max-w-sm p-4 text-center">
        <div className="font-display text-outline text-4xl text-[#ff4d4d]">GAME OVER</div>
        {outcome.newBest && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.3 }} className="font-display text-outline-sm mt-1 inline-block rounded-xl border-2 border-[#042016] bg-[#ffc93c] px-3 py-0.5 text-lg text-[#3b2400]">
            ⭐ NEW BEST!
          </motion.div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-black/30 p-2">
            <div className="text-[11px] font-black text-white/60">SCORE</div>
            <div className="font-display text-3xl">{fmt(outcome.score)}</div>
            <div className="text-[11px] font-bold text-white/50">best {fmt(outcome.best)}</div>
          </div>
          <div className="rounded-2xl bg-black/30 p-2">
            <div className="text-[11px] font-black text-white/60">COINS</div>
            <div className="font-display text-3xl">
              <CoinAmount n={outcome.coins} size={24} />
            </div>
            {modifier.reward > 1 && <div className="text-[11px] font-bold text-[#ffc93c]">{modifier.icon} x{modifier.reward} bonus</div>}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/25 p-2 text-left">
          <Politician def={def} stage={stage} className="h-20 w-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-extrabold">{def.name}</div>
            <div className="text-[11px] font-bold" style={{ color: STAGES[stage].color }}>
              {STAGES[stage].name}
            </div>
            <ProgressBar pct={bar} color="#9b5cff" height={12} className="mt-1" />
            <div className="mt-0.5 text-[10px] font-bold text-white/50">{outcome.meltdown ? 'MELTDOWN!' : `${Math.round(outcome.after * 100)}% to meltdown · Term ${term}`}</div>
          </div>
        </div>

        {outcome.meltdown && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.8, type: 'spring' }} className="mt-3 rounded-2xl border-[3px] border-[#042016] bg-[#9b5cff] p-3">
            <div className="font-display text-outline text-3xl">LEVEL {outcome.meltdown.level}!</div>
            <div className="text-sm font-bold">Wahala don land! +{fmt(outcome.meltdown.reward)} coins</div>
            <div className="font-display mt-1 text-lg text-[#ffe082]">
              {outcome.meltdown.newUnlock ? '🔓 New politician: ' : 'Next up: '}
              {outcome.meltdown.nextName}
            </div>
          </motion.div>
        )}
        {!outcome.meltdown && outcome.stageUp !== null && (
          <div className="mt-2 text-sm font-black" style={{ color: STAGES[outcome.stageUp].color }}>
            Stage up: {STAGES[outcome.stageUp].name}!
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <GameButton tone="dark" onClick={onHome}>
            Home
          </GameButton>
          <GameButton tone="green" onClick={onAgain}>
            Play again
          </GameButton>
        </div>
      </motion.div>
    </div>
  )
}

/** Hearts row for HUDs. */
export function Hearts({ n, max }: { n: number; max: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <motion.span key={i} animate={{ scale: i < n ? 1 : 0.7, opacity: i < n ? 1 : 0.3 }} className="text-xl">
          {i < n ? '❤️' : '🖤'}
        </motion.span>
      ))}
    </div>
  )
}
