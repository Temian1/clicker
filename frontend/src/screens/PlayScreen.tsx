import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { Politician } from '../components/Politician'
import { GameButton, ProgressBar } from '../components/ui'
import { speak } from '../game/audio'
import { getCharacter } from '../game/characters'
import { fmt } from '../game/format'
import { STAGES, dayKey, meltdownAt, stageProgress } from '../game/progression'
import { useGame } from '../game/store'
import type { GameMode } from '../game/types'
import { useUi } from '../game/ui'

export default function PlayScreen() {
  const selected = useGame((s) => s.selected)
  const cp = useGame((s) => s.chars[s.selected])
  const level = useGame((s) => s.level)
  const best = useGame((s) => s.best)
  const bubble = useGame((s) => s.bubble)
  const streakLast = useGame((s) => s.streak.last)
  const startGame = useUi((s) => s.startGame)
  const open = useUi((s) => s.open)
  const def = getCharacter(selected)
  const { stage } = stageProgress(cp?.wahala ?? 0, cp?.term ?? 1)
  const total = (cp?.wahala ?? 0) / meltdownAt(cp?.term ?? 1)
  const [showBubble, setShowBubble] = useState(false)

  useEffect(() => {
    if (!bubble || Date.now() - bubble.id > 3000) return
    setShowBubble(true)
    speak(bubble.text)
    const t = window.setTimeout(() => setShowBubble(false), 2800)
    return () => window.clearTimeout(t)
  }, [bubble])

  const games: { mode: GameMode; title: string; sub: string; icon: string; tone: 'gold' | 'red'; color: string }[] = [
    { mode: 'catcher', title: 'Promise Catcher', sub: 'Catch every promise they make. Dodge their excuses!', icon: 'bag', tone: 'gold', color: '#ffc93c' },
    { mode: 'whack', title: 'Whack-a-Politician', sub: 'Vote them out before they duck. Spare the citizens!', icon: 'podium', tone: 'red', color: '#ff4d4d' },
  ]

  return (
    <div className="scroll-area flex h-full flex-col px-3 pb-3">
      {/* current politician + level progress */}
      <div className="panel relative mb-3 flex items-center gap-2 overflow-hidden p-3">
        <div className="relative h-36 w-28 shrink-0">
          <Politician def={def} stage={stage} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display rounded-md bg-[#7dffb8] px-1.5 text-sm text-[#042016]">LEVEL {level}</span>
            <span className="rounded-md bg-[#ffc93c] px-1.5 text-xs font-black text-[#3b2400]">TERM {cp?.term ?? 1}</span>
          </div>
          <div className="font-display mt-1 truncate text-xl leading-tight">{def.name}</div>
          <div className="text-xs font-black" style={{ color: STAGES[stage].color }}>
            {STAGES[stage].name}
          </div>
          <ProgressBar pct={total} color="#9b5cff" height={14} className="mt-2" />
          <div className="mt-1 text-[11px] font-bold text-white/60">
            {fmt(cp?.wahala ?? 0)} / {fmt(meltdownAt(cp?.term ?? 1))} wahala · meltdown = next politician
          </div>
        </div>
        <AnimatePresence>
          {showBubble && bubble && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute top-2 left-24 z-10 max-w-[60%] rounded-2xl border-[3px] border-[#042016] bg-white px-2.5 py-1 text-xs font-black text-[#042016]"
            >
              {bubble.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* games */}
      <div className="flex flex-col gap-3">
        {games.map((g, i) => (
          <motion.div
            key={g.mode}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 + i * 0.07 }}
            className="panel relative overflow-hidden p-3"
          >
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full blur-2xl" style={{ background: `${g.color}44` }} />
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-[3px] border-[#042016]" style={{ background: g.color }}>
                <Icon name={g.icon} size={40} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-2xl leading-none">{g.title}</div>
                <div className="mt-0.5 text-xs font-bold text-white/70">{g.sub}</div>
                <div className="mt-1 text-xs font-black text-[#ffc93c]">BEST: {fmt(best[g.mode])}</div>
              </div>
            </div>
            <GameButton tone={g.tone} className="mt-3 w-full text-2xl" onClick={() => startGame(g.mode)}>
              <span className="flex items-center justify-center gap-2">▶ PLAY</span>
            </GameButton>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => open('daily')} className="panel relative flex items-center gap-2 p-2.5 text-left">
          <Icon name="gift" size={30} />
          <span className="font-display text-base leading-tight">
            Daily
            <br />
            <span className="font-body text-[11px] font-bold text-white/60">rewards & challenges</span>
          </span>
          {streakLast !== dayKey() && <span className="absolute top-2 right-2 h-3 w-3 animate-ping rounded-full bg-[#ff4d4d]" />}
        </button>
        <button onClick={() => open('howto')} className="panel flex items-center gap-2 p-2.5 text-left">
          <Icon name="info" size={30} />
          <span className="font-display text-base leading-tight">
            How to play
            <br />
            <span className="font-body text-[11px] font-bold text-white/60">tips & rules</span>
          </span>
        </button>
      </div>
    </div>
  )
}
