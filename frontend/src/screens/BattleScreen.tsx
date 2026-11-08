import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Icon } from '../components/Icon'
import { Politician } from '../components/Politician'
import { CoinAmount, GameButton, ProgressBar, SectionTitle } from '../components/ui'
import { sfx } from '../game/audio'
import { GENERIC_PROMISES, getCharacter, playableCharacters } from '../game/characters'
import { fmt, vibrate } from '../game/format'
import { bossReward, bossTarget, bossTime } from '../game/progression'
import { useGame } from '../game/store'
import { snapshot } from '../game/sync'

type Mode = 'hub' | 'boss' | 'duel'


export default function BattleScreen() {
  const [mode, setMode] = useState<Mode>('hub')
  const bossLevel = useGame((s) => s.bossLevel)
  const best = useGame((s) => s.best)

  if (mode === 'boss') return <BossFight onExit={() => setMode('hub')} />
  if (mode === 'duel') return <Duel onExit={() => setMode('hub')} />

  return (
    <div className="scroll-area h-full px-3 pb-4">
      <SectionTitle icon="battle">Battle Arena</SectionTitle>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="panel relative mb-3 overflow-hidden p-4">
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-[#ff4d4d]/30 blur-2xl" />
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border-[3px] border-[#042016] bg-[#ff4d4d]">
            <Icon name="podium" size={40} />
          </div>
          <div className="flex-1">
            <div className="font-display text-2xl leading-none">Rally Boss</div>
            <div className="text-xs font-bold text-white/70">Fill the Comedy Meter before the campaign promises end!</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Mini label="Boss level" value={`${bossLevel}`} />
          <Mini label="Target" value={`${bossTarget(bossLevel)} taps`} />
          <Mini label="Time" value={`${bossTime(bossLevel)}s`} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold">
            Win: <CoinAmount n={bossReward(bossLevel)} size={16} className="font-black text-[#ffc93c]" />
          </span>
          <span className="text-xs font-bold text-white/60">Best: {best.boss} taps</span>
        </div>
        <GameButton tone="red" className="mt-3 w-full text-xl" onClick={() => setMode('boss')}>
          FIGHT!
        </GameButton>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.06 }} className="panel relative overflow-hidden p-4">
        <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-[#3ec7ff]/30 blur-2xl" />
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border-[3px] border-[#042016] bg-[#3ec7ff]">
            <Icon name="people" size={40} />
          </div>
          <div className="flex-1">
            <div className="font-display flex items-center gap-2 text-2xl leading-none">
              Tap Duel <span className="rounded-md bg-[#9b5cff] px-1.5 py-0.5 font-sans text-[10px] font-black">BETA</span>
            </div>
            <div className="text-xs font-bold text-white/70">60 seconds. Two players. Funniest meltdown wins.</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm font-bold">
          <span>
            Win: <CoinAmount n={2000} size={16} className="font-black text-[#ffc93c]" /> + 10/tap
          </span>
          <span className="text-xs text-white/60">Best: {best.duel} taps</span>
        </div>
        <GameButton tone="blue" className="mt-3 w-full text-xl" onClick={() => setMode('duel')}>
          FIND OPPONENT
        </GameButton>
        <p className="mt-2 text-center text-[11px] font-semibold text-white/50">
          {api.mode === 'local' ? 'Offline: you duel a ghost of a ranked player.' : 'Matched with a ranked player ghost.'}
        </p>
      </motion.div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 px-2 py-1.5">
      <div className="text-[10px] font-bold tracking-wide text-white/60 uppercase">{label}</div>
      <div className="font-display text-lg leading-none">{value}</div>
    </div>
  )
}

function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds * 1000)
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => {
    if (!running) return
    const end = Date.now() + seconds * 1000
    const t = window.setInterval(() => {
      const l = end - Date.now()
      setLeft(Math.max(0, l))
      if (l <= 0) {
        window.clearInterval(t)
        endRef.current()
      }
    }, 50)
    return () => window.clearInterval(t)
  }, [running, seconds])
  return left
}

function ReadyGo({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3)
  useEffect(() => {
    sfx.whistle()
    const t = window.setInterval(() => {
      setN((v) => {
        if (v <= 1) {
          window.clearInterval(t)
          window.setTimeout(onDone, 350)
          return 0
        }
        sfx.ui()
        return v - 1
      })
    }, 650)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/50">
      <AnimatePresence mode="popLayout">
        <motion.div key={n} initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }} className="font-display text-outline text-8xl text-[#ffc93c]">
          {n === 0 ? 'GO!' : n}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Result({ win, title, reward, lines, onAgain, onExit }: { win: boolean; title: string; reward: number; lines: string[]; onAgain: () => void; onExit: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-40 grid place-items-center bg-black/70 px-6">
      <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} className="panel w-full max-w-sm p-5 text-center">
        <Icon name={win ? 'trophy' : 'support'} size={64} className="mx-auto" />
        <div className={`font-display text-outline mt-2 text-4xl ${win ? 'text-[#ffc93c]' : 'text-[#ff4d4d]'}`}>{title}</div>
        {lines.map((l) => (
          <div key={l} className="mt-1 text-sm font-bold text-white/80">
            {l}
          </div>
        ))}
        <div className="font-display mt-3 text-2xl">
          +<CoinAmount n={reward} size={24} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <GameButton tone="dark" onClick={onExit}>
            Back
          </GameButton>
          <GameButton tone="green" onClick={onAgain}>
            Again!
          </GameButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
function BossFight({ onExit }: { onExit: () => void }) {
  const lvl = useGame((s) => s.bossLevel)
  const selected = useGame((s) => s.selected)
  const haptics = useGame((s) => s.settings.haptics)
  const finish = useGame((s) => s.finishBoss)
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready')
  const [taps, setTaps] = useState(0)
  const [result, setResult] = useState<{ win: boolean; reward: number } | null>(null)
  const [scope, animate] = useAnimate()
  const [hit, setHit] = useState(false)
  const target = bossTarget(lvl)
  const time = bossTime(lvl)
  const tapsRef = useRef(0)

  // the boss is a random character other than yours
  const [boss] = useState(() => {
    const pool = playableCharacters().filter((c) => c.id !== selected)
    return pool[Math.floor(Math.random() * pool.length)] ?? getCharacter(selected)
  })
  const promises = boss.promises?.length ? boss.promises : GENERIC_PROMISES
  const [promiseIdx, setPromiseIdx] = useState(0)

  const left = useCountdown(time, phase === 'play', () => end(tapsRef.current >= target))

  useEffect(() => {
    if (phase !== 'play') return
    const t = window.setInterval(() => setPromiseIdx((i) => i + 1), 2400)
    return () => window.clearInterval(t)
  }, [phase])

  function end(win: boolean) {
    if (phase === 'done') return
    setPhase('done')
    const reward = finish(win, tapsRef.current)
    void api.reportBattle('boss', { win, taps: tapsRef.current, level: lvl }).catch(() => undefined)
    if (win) sfx.meltdown()
    else sfx.error()
    setResult({ win, reward })
  }

  function onTap() {
    if (phase !== 'play') return
    tapsRef.current += 1
    setTaps(tapsRef.current)
    sfx.tap(tapsRef.current)
    if (haptics) vibrate(10)
    setHit(true)
    window.setTimeout(() => setHit(false), 90)
    void animate(scope.current, { scale: [0.92, 1.04, 1] }, { duration: 0.2 })
    if (tapsRef.current >= target) end(true)
  }

  const pct = taps / target
  const stage = Math.min(5, Math.floor(pct * 6))

  return (
    <div key={round} className="relative flex h-full flex-col px-3">
      <div className="mb-2 flex items-center gap-2">
        <button onClick={onExit} className="btn-3d grid h-10 w-10 place-items-center bg-[#0e3a28]" aria-label="Back">
          <Icon name="back" size={20} />
        </button>
        <div className="flex-1">
          <div className="font-display text-lg leading-none">Rally Boss Lv {lvl}</div>
          <div className="text-xs font-bold text-white/60">{boss.name}</div>
        </div>
        <div className={`font-display rounded-xl border-2 border-[#042016] px-3 py-1 text-2xl tabular-nums ${left < 5000 ? 'bg-[#ff4d4d]' : 'bg-[#0e3a28]'}`}>{(left / 1000).toFixed(1)}</div>
      </div>
      <div className="font-display mb-1 flex justify-between text-sm">
        <span>COMEDY METER</span>
        <span>
          {taps}/{target}
        </span>
      </div>
      <ProgressBar pct={pct} color="#ff4d4d" height={20} />

      <div className="relative flex min-h-0 flex-1 touch-none flex-col items-center justify-center" onPointerDown={onTap}>
        <AnimatePresence mode="wait">
          {phase === 'play' && (
            <motion.div
              key={promiseIdx}
              initial={{ y: -10, opacity: 0, rotate: -3 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 10, opacity: 0 }}
              className="pointer-events-none z-10 mb-1 max-w-[85%] rounded-2xl border-[3px] border-[#042016] bg-[#ffc93c] px-3 py-2 text-center text-sm font-black text-[#3b2400]"
            >
              📢 “{promises[promiseIdx % promises.length]}”
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={scope} className="relative h-[60%] w-full max-w-[300px]">
          <Politician def={boss} stage={stage} hit={hit} className="h-full w-full" />
        </div>
        {/* podium */}
        <svg viewBox="0 0 300 90" className="-mt-10 w-full max-w-[300px]">
          <path d="M40 10 h220 l-20 80 h-180 z" fill="#00a859" stroke="#042016" strokeWidth="5" strokeLinejoin="round" />
          <rect x="30" y="2" width="240" height="16" rx="5" fill="#fff7e6" stroke="#042016" strokeWidth="5" />
          <circle cx="150" cy="52" r="20" fill="#ffc93c" stroke="#042016" strokeWidth="4" />
          <text x="150" y="60" textAnchor="middle" fontFamily="Lilita One" fontSize="22" fill="#042016">
            VOTE
          </text>
        </svg>
        {phase === 'play' && <div className="font-display text-outline-sm pointer-events-none mt-1 animate-pulse text-xl">TAP TAP TAP!</div>}
      </div>

      {phase === 'ready' && <ReadyGo onDone={() => setPhase('play')} />}
      {result && (
        <Result
          win={result.win}
          title={result.win ? 'BOSS DON FALL!' : 'TIME DON GO!'}
          reward={result.reward}
          lines={[result.win ? `${boss.name} has left the rally in tears.` : `You reached ${taps}/${target}. Consolation coins.`, `Your best: ${Math.max(useGame.getState().best.boss, taps)} taps`]}
          onExit={onExit}
          onAgain={() => {
            tapsRef.current = 0
            setTaps(0)
            setResult(null)
            setPhase('ready')
            setRound((r) => r + 1)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function Duel({ onExit }: { onExit: () => void }) {
  const selected = useGame((s) => s.selected)
  const haptics = useGame((s) => s.settings.haptics)
  const finish = useGame((s) => s.finishDuel)
  const [phase, setPhase] = useState<'search' | 'ready' | 'play' | 'done'>('search')
  const [opp, setOpp] = useState<{ name: string; avatar: string; tps: number } | null>(null)
  const [mine, setMine] = useState(0)
  const [theirs, setTheirs] = useState(0)
  const [result, setResult] = useState<{ win: boolean; reward: number } | null>(null)
  const [round, setRound] = useState(0)
  const mineRef = useRef(0)
  const theirsRef = useRef(0)
  const [hit, setHit] = useState(false)
  const myChar = getCharacter(selected)
  const [oppChar] = useState(() => {
    const pool = playableCharacters().filter((c) => c.id !== selected)
    return pool[Math.floor(Math.random() * pool.length)] ?? myChar
  })

  useEffect(() => {
    if (phase !== 'search') return
    let alive = true
    const started = Date.now()
    api.duelOpponent(snapshot()).then((o) => {
      window.setTimeout(() => {
        if (!alive) return
        setOpp(o)
        setPhase('ready')
      }, Math.max(0, 1600 - (Date.now() - started)))
    })
    return () => {
      alive = false
    }
  }, [phase, round])

  useEffect(() => {
    if (phase !== 'play' || !opp) return
    const t = window.setInterval(() => {
      // ghost taps with bursty human-like rhythm
      const n = Math.random() < (opp.tps / 10) * (0.6 + Math.random() * 0.8) ? 1 + (Math.random() < 0.15 ? 1 : 0) : 0
      theirsRef.current += n
      setTheirs(theirsRef.current)
    }, 100)
    return () => window.clearInterval(t)
  }, [phase, opp])

  const left = useCountdown(60, phase === 'play', () => {
    setPhase('done')
    const win = mineRef.current > theirsRef.current
    const reward = finish(win, mineRef.current)
    void api.reportBattle('duel', { win, taps: mineRef.current }).catch(() => undefined)
    if (win) sfx.meltdown()
    else sfx.error()
    setResult({ win, reward })
  })

  function onTap() {
    if (phase !== 'play') return
    mineRef.current += 1
    setMine(mineRef.current)
    sfx.tap(mineRef.current % 80)
    if (haptics) vibrate(8)
    setHit(true)
    window.setTimeout(() => setHit(false), 90)
  }

  const goal = Math.max(300, Math.round((opp?.tps ?? 6) * 60 * 1.1))
  const myStage = Math.min(5, Math.floor((mine / goal) * 6))
  const theirStage = Math.min(5, Math.floor((theirs / goal) * 6))

  if (phase === 'search')
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
          <Icon name="settings" size={72} />
        </motion.div>
        <div className="font-display text-outline text-3xl">Finding opponent…</div>
        <div className="text-sm font-bold text-white/60">Checking who get strong finger today</div>
        <GameButton tone="dark" onClick={onExit}>
          Cancel
        </GameButton>
      </div>
    )

  return (
    <div key={round} className="relative flex h-full flex-col px-3">
      <div className="mb-2 flex items-center gap-2">
        <button onClick={onExit} className="btn-3d grid h-10 w-10 place-items-center bg-[#0e3a28]" aria-label="Back">
          <Icon name="back" size={20} />
        </button>
        <div className="font-display flex-1 text-lg">Tap Duel</div>
        <div className={`font-display rounded-xl border-2 border-[#042016] px-3 py-1 text-2xl tabular-nums ${left < 10000 ? 'bg-[#ff4d4d]' : 'bg-[#0e3a28]'}`}>{Math.ceil(left / 1000)}s</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="panel p-2 text-center">
          <div className="truncate text-xs font-black text-[#ffc93c]">YOU</div>
          <div className="font-display text-3xl tabular-nums">{fmt(mine)}</div>
        </div>
        <div className="panel p-2 text-center">
          <div className="truncate text-xs font-black text-[#3ec7ff]">
            {opp?.avatar} {opp?.name}
          </div>
          <div className="font-display text-3xl tabular-nums">{fmt(theirs)}</div>
        </div>
      </div>
      <div className="mt-2 flex h-4 overflow-hidden rounded-full border-2 border-[#042016]">
        <motion.div className="bg-[#ffc93c]" animate={{ flexGrow: mine + 1 }} />
        <motion.div className="bg-[#3ec7ff]" animate={{ flexGrow: theirs + 1 }} />
      </div>

      <div className="relative grid min-h-0 flex-1 touch-none grid-cols-2 items-center" onPointerDown={onTap}>
        <motion.div animate={hit ? { scale: 0.93 } : { scale: 1 }} className="h-[70%]">
          <Politician def={oppChar} stage={myStage} hit={hit} className="h-full w-full" />
          <div className="text-center text-xs font-black text-[#ffc93c]">your target</div>
        </motion.div>
        <div className="h-[55%] opacity-90">
          <Politician def={myChar} stage={theirStage} className="h-full w-full" />
          <div className="text-center text-xs font-black text-[#3ec7ff]">their target</div>
        </div>
        {phase === 'play' && <div className="font-display text-outline-sm pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 animate-pulse text-xl">TAP ANYWHERE!</div>}
      </div>

      {phase === 'ready' && <ReadyGo onDone={() => setPhase('play')} />}
      {result && (
        <Result
          win={result.win}
          title={result.win ? 'YOU WIN!' : mine === theirs ? 'DRAW!' : 'YOU LOSE!'}
          reward={result.reward}
          lines={[`${fmt(mine)} vs ${fmt(theirs)} taps`, result.win ? `${opp?.name} dey cry for corner 😂` : 'Practice that finger, come back stronger!']}
          onExit={onExit}
          onAgain={() => {
            mineRef.current = 0
            theirsRef.current = 0
            setMine(0)
            setTheirs(0)
            setResult(null)
            setOpp(null)
            setPhase('search')
            setRound((r) => r + 1)
          }}
        />
      )}
    </div>
  )
}
