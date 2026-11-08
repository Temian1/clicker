import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Politician } from '../components/Politician'
import { Countdown, GameOver, Hearts, PreRun } from '../components/RunUI'
import { sfx } from '../game/audio'
import { getCharacter, playableCharacters, randomLine } from '../game/characters'
import { rollModifier, type Modifier } from '../game/events'
import { vibrate } from '../game/format'
import { calmFor, comboMult, livesFor, luckFor, stageFor } from '../game/progression'
import { useGame, type RunOutcome } from '../game/store'

/**
 * WHACK-A-POLITICIAN
 * Politicians pop up from 9 rally podiums making promises. Tap them to VOTE
 * THEM OUT before they duck back down. Don't tap the citizens. Golden
 * politicians are worth x5, the ⏱️ clock adds time. It keeps getting faster.
 */

const ROUND_SECONDS = 45
const CITIZENS = ['👩🏾‍🌾', '👨🏾‍🔧', '👩🏾‍🎓', '👨🏾‍🍳', '👵🏾', '👨🏾‍💼', '👩🏾‍⚕️']
const PROMISES = ['Vote me!', 'I go fix am!', 'Free light!', 'Trust me!', '4 more years!', 'Na me be am!']

type Kind = 'pol' | 'gold' | 'citizen' | 'clock'
interface Hole {
  id: number
  kind: Kind
  charId: string
  emoji: string
  until: number
  hitAt: number | null
  promise: string
}
interface Pop {
  id: number
  hole: number
  text: string
  color: string
}

const RULES: [string, string][] = [
  ['👆', 'Tap politicians to VOTE THEM OUT'],
  ['👩🏾‍🌾', "Don't tap citizens: each one costs a heart"],
  ['🌟', 'Golden politician = x5 points · ⏱️ = +5 seconds'],
  ['🔥', 'Hit in a row for combos · escapes break your combo'],
]

let uid = 0

export default function WhackGame({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'count' | 'play' | 'paused' | 'over'>('intro')
  const [modifier, setModifier] = useState<Modifier>(() => rollModifier())
  const [holes, setHoles] = useState<(Hole | null)[]>(() => Array(9).fill(null))
  const [pops, setPops] = useState<Pop[]>([])
  const [hud, setHud] = useState({ score: 0, hearts: 3, combo: 0, left: ROUND_SECONDS })
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [shake, setShake] = useState(0)
  const [lightOn, setLightOn] = useState(true)
  const [bubble, setBubble] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [charId, setCharId] = useState(() => useGame.getState().selected)
  const best = useGame((s) => s.best.whack)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const hitRef = useRef<(i: number) => void>(() => {})

  const g = useRef({
    t: 0,
    score: 0,
    hearts: 3,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    timeLeft: ROUND_SECONDS,
    spawnIn: 0.6,
    holes: Array(9).fill(null) as (Hole | null)[],
    startedAt: 0,
    stage: 0,
    over: false,
  })

  // ---------------------------------------------------------------- engine
  useEffect(() => {
    if (phase !== 'play' && phase !== 'paused') return
    const st = useGame.getState()
    const sel = st.selected
    const selDef = getCharacter(sel)
    const cp = st.chars[sel]
    const up = st.upgrades
    const calm = calmFor(up.calm)
    const luck = luckFor(up.luck) * modifier.good
    const haptics = st.settings.haptics
    const cast = playableCharacters().filter((c) => st.chars[c.id]?.unlocked || c.id === sel)
    const G = g.current
    if (G.startedAt === 0) {
      Object.assign(G, {
        t: 0,
        score: 0,
        hearts: livesFor(up.lives),
        combo: 0,
        maxCombo: 0,
        hits: 0,
        timeLeft: ROUND_SECONDS,
        spawnIn: 0.6,
        holes: Array(9).fill(null),
        startedAt: performance.now(),
        stage: stageFor(cp.wahala, cp.term),
        over: false,
      })
    }

    const pop = (hole: number, text: string, color: string) => {
      const id = ++uid
      setPops((p) => [...p.slice(-8), { id, hole, text, color }])
      window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 700)
    }

    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      let dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (phaseRef.current === 'paused' || G.over) return
      G.t += dt
      G.timeLeft -= dt

      // expire holes
      let changed = false
      G.holes = G.holes.map((h, i) => {
        if (!h) return h
        if (h.hitAt !== null) {
          if (now - h.hitAt > 380) {
            changed = true
            return null
          }
          return h
        }
        if (now > h.until) {
          changed = true
          if (h.kind === 'pol' || h.kind === 'gold') {
            G.combo = 0
            pop(i, 'ESCAPED!', '#ff9f1c')
          }
          return null
        }
        return h
      })

      // spawn
      G.spawnIn -= dt
      const upCount = G.holes.filter((h) => h && h.hitAt === null).length
      const maxUp = Math.min(4, 1 + Math.floor(G.t / 10))
      if (G.spawnIn <= 0 && upCount < maxUp) {
        const free = G.holes.map((h, i) => (h ? -1 : i)).filter((i) => i >= 0)
        if (free.length) {
          const idx = free[Math.floor(Math.random() * free.length)]
          const r = Math.random()
          const citizenP = Math.min(0.32, (0.12 + G.t * 0.004) * modifier.bad)
          let kind: Kind = 'pol'
          if (r < 0.03) kind = 'clock'
          else if (r < 0.03 + luck) kind = 'gold'
          else if (r < 0.03 + luck + citizenP) kind = 'citizen'
          const showFor = (Math.max(0.55, 1.3 - G.t * 0.014 * calm) / modifier.speed) * 1000
          G.holes[idx] = {
            id: ++uid,
            kind,
            charId: Math.random() < 0.5 ? sel : cast[Math.floor(Math.random() * cast.length)].id,
            emoji: CITIZENS[Math.floor(Math.random() * CITIZENS.length)],
            until: now + (kind === 'citizen' ? showFor * 1.2 : showFor),
            hitAt: null,
            promise: PROMISES[Math.floor(Math.random() * PROMISES.length)],
          }
          changed = true
        }
        G.spawnIn = (Math.max(0.28, 0.85 - G.t * 0.012 * calm) / modifier.speed) * (0.7 + Math.random() * 0.6)
      }

      if (changed) setHoles([...G.holes])
      setHud({ score: G.score, hearts: G.hearts, combo: G.combo, left: Math.max(0, G.timeLeft) })

      if (G.timeLeft <= 0 || G.hearts <= 0) {
        G.over = true
        const out = useGame.getState().finishRun({
          mode: 'whack',
          score: G.score,
          hits: G.hits,
          maxCombo: G.maxCombo,
          durationMs: now - G.startedAt,
          modifier: modifier.id === 'none' ? null : modifier.id,
        })
        if (out.meltdown) sfx.meltdown()
        else if (out.newBest) sfx.stageUp()
        else sfx.whistle()
        setOutcome(out)
        setPhase('over')
      }
    }

    // expose the hit handler to the render
    hitRef.current = (i: number) => {
      if (phaseRef.current !== 'play' || G.over) return
      const h = G.holes[i]
      if (!h || h.hitAt !== null) return
      const now = performance.now()
      if (h.kind === 'citizen') {
        G.hearts -= 1
        G.combo = 0
        pop(i, 'OUCH! Na citizen!', '#ff4d4d')
        sfx.error()
        if (haptics) vibrate([40, 30, 40])
        setShake((s) => s + 1)
        G.holes[i] = null
      } else if (h.kind === 'clock') {
        G.timeLeft += 5
        pop(i, '+5s', '#3ec7ff')
        sfx.buy()
        G.holes[i] = null
      } else {
        G.combo += 1
        G.hits += 1
        G.maxCombo = Math.max(G.maxCombo, G.combo)
        const pts = Math.round((h.kind === 'gold' ? 50 : 10) * comboMult(G.combo))
        G.score += pts
        pop(i, h.kind === 'gold' ? `+${pts} 🌟` : `+${pts}`, h.kind === 'gold' ? '#ffc93c' : '#ffffff')
        if (h.kind === 'gold') sfx.crit()
        else sfx.tap(G.combo)
        if (haptics) vibrate(10)
        G.holes[i] = { ...h, hitAt: now }
        // the selected politician panics live as wahala builds
        const ns = stageFor(cp.wahala + G.score, cp.term)
        if (ns > G.stage) {
          G.stage = ns
          setBubble(randomLine(selDef, ns))
          window.setTimeout(() => setBubble(null), 2000)
          sfx.stageUp()
        }
      }
      setHoles([...G.holes])
      setHud({ score: G.score, hearts: G.hearts, combo: G.combo, left: Math.max(0, G.timeLeft) })
    }

    const id = window.setInterval(tick, 50)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, phase === 'play' || phase === 'paused'])


  // NEPA blackout: lights flicker on briefly every few seconds
  useEffect(() => {
    if (!modifier.dark || phase !== 'play') {
      setLightOn(true)
      return
    }
    setLightOn(false)
    const t = window.setInterval(() => {
      setLightOn(true)
      window.setTimeout(() => setLightOn(false), 700)
    }, 2600)
    return () => window.clearInterval(t)
  }, [modifier.dark, phase])

  const restart = () => {
    g.current.startedAt = 0
    g.current.over = false
    setHoles(Array(9).fill(null))
    setPops([])
    setOutcome(null)
    setModifier(rollModifier())
    setHud({ score: 0, hearts: livesFor(useGame.getState().upgrades.lives), combo: 0, left: ROUND_SECONDS })
    setCharId(useGame.getState().selected)
    setRound((r) => r + 1)
    setPhase('intro')
  }

  const maxHearts = livesFor(useGame.getState().upgrades.lives)
  const selStage = g.current.stage

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative z-10 flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),10px)] pb-1">
        <button onClick={() => setPhase((p) => (p === 'play' ? 'paused' : p))} className="btn-3d grid h-10 w-10 place-items-center bg-[#0e3a28]" aria-label="Pause">
          <span className="font-display text-lg">II</span>
        </button>
        <Hearts n={hud.hearts} max={maxHearts} />
        <div className="flex-1" />
        <div className={`font-display rounded-xl border-2 border-[#042016] px-2 py-0.5 text-xl tabular-nums ${hud.left < 10 ? 'bg-[#ff4d4d]' : 'bg-[#0e3a28]'}`}>{Math.ceil(hud.left)}s</div>
        <div className="font-display text-outline-sm chip px-3 py-1 text-2xl tabular-nums">{hud.score}</div>
      </div>
      <div className="relative z-10 flex h-7 items-center justify-center">
        {hud.combo >= 3 && (
          <motion.div key={hud.combo} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="font-display text-outline-sm flex items-center gap-1 text-lg text-[#ffc93c]">
            <Icon name="fire" size={18} /> {hud.combo} COMBO x{comboMult(hud.combo)}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {bubble && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 mx-auto mb-1 max-w-[85%] rounded-2xl border-[3px] border-[#042016] bg-white px-3 py-1.5 text-center text-sm font-black text-[#042016]">
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div key={shake} animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : undefined} transition={{ duration: 0.35 }} className="relative grid min-h-0 flex-1 grid-cols-3 content-center gap-x-2 gap-y-0 px-2 pb-4">
        {holes.map((h, i) => (
          <button key={i} onPointerDown={() => hitRef.current(i)} className="relative aspect-[4/5] touch-none select-none" aria-label={`podium ${i + 1}`}>
            {/* pop-up area (clipped behind the podium) */}
            <div className="absolute inset-x-0 top-0 bottom-[24%] overflow-hidden">
              <AnimatePresence>
                {h && (
                  <motion.div
                    key={h.id}
                    initial={{ y: '100%' }}
                    animate={{ y: h.hitAt ? '15%' : '0%', rotate: h.hitAt ? [-8, 8, -4, 0] : 0 }}
                    exit={{ y: '105%' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className="absolute inset-0 flex items-end justify-center"
                  >
                    {h.kind === 'citizen' ? (
                      <div className="mb-1 flex flex-col items-center">
                        <span className="text-[44px] leading-none">{h.emoji}</span>
                        <span className="rounded-md border-2 border-[#042016] bg-[#3ec7ff] px-1 text-[10px] font-black text-[#042016]">CITIZEN</span>
                      </div>
                    ) : h.kind === 'clock' ? (
                      <span className="mb-2 text-[44px] leading-none">⏱️</span>
                    ) : (
                      <div className="relative h-full w-full">
                        <Politician
                          def={getCharacter(h.charId)}
                          stage={h.hitAt ? 4 : h.charId === charId ? Math.min(3, selStage) : 0}
                          className={`absolute -bottom-[22%] left-1/2 h-[128%] w-[150%] max-w-none -translate-x-1/2 ${h.kind === 'gold' ? 'drop-shadow-[0_0_10px_#ffc93c]' : ''}`}
                        />
                        {!h.hitAt && (
                          <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-lg border-2 border-[#042016] bg-white px-1 text-[10px] font-black whitespace-nowrap text-[#042016]">
                            {h.kind === 'gold' ? '🌟 x5!' : h.promise}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {h?.hitAt && (
                <motion.div initial={{ scale: 2.4, rotate: -25, opacity: 0 }} animate={{ scale: 1, rotate: -14, opacity: 1 }} className="font-display absolute inset-x-0 top-1/3 z-10 mx-auto w-fit rounded-md border-[3px] border-[#ff4d4d] bg-white/90 px-1 text-sm leading-tight text-[#ff4d4d]">
                  VOTED OUT!
                </motion.div>
              )}
            </div>
            {/* podium */}
            <svg viewBox="0 0 100 50" className="absolute inset-x-0 bottom-0 h-[28%] w-full" preserveAspectRatio="none">
              <path d="M8 6 h84 l-8 42 h-68 z" fill="#00a859" stroke="#042016" strokeWidth="4" strokeLinejoin="round" />
              <rect x="3" y="1" width="94" height="9" rx="3" fill="#fff7e6" stroke="#042016" strokeWidth="4" />
              <circle cx="50" cy="30" r="9" fill="#ffc93c" stroke="#042016" strokeWidth="3" />
            </svg>
            {/* score pops */}
            {pops
              .filter((p) => p.hole === i)
              .map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ y: 0, opacity: 1, scale: 0.8 }}
                  animate={{ y: -50, opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.7 }}
                  className="font-display text-outline-sm pointer-events-none absolute inset-x-0 top-1/4 z-20 text-center text-xl"
                  style={{ color: p.color }}
                >
                  {p.text}
                </motion.span>
              ))}
          </button>
        ))}
      </motion.div>

      {/* NEPA blackout */}
      {modifier.dark && phase === 'play' && (
        <div className={`pointer-events-none absolute inset-0 z-20 bg-black transition-opacity duration-150 ${lightOn ? 'opacity-0' : 'opacity-80'}`} />
      )}

      {phase === 'intro' && (
        <PreRun title="Whack-a-Politician" icon="podium" rules={RULES} modifier={modifier} best={best} onExit={onExit} onStart={() => setPhase('count')} />
      )}
      {phase === 'count' && <Countdown onDone={() => setPhase('play')} />}
      {phase === 'paused' && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="panel flex w-64 flex-col gap-2 p-4 text-center">
            <div className="font-display text-outline text-3xl">PAUSED</div>
            <button className="btn-3d bg-[#00a859] py-2.5 text-xl [--btn-shadow:#006b3a]" onClick={() => setPhase('play')}>
              Resume
            </button>
            <button className="btn-3d bg-[#ff4d4d] py-2.5 text-xl [--btn-shadow:#b81e1e]" onClick={onExit}>
              Quit
            </button>
          </div>
        </div>
      )}
      {phase === 'over' && outcome && <GameOver outcome={outcome} charId={charId} modifier={modifier} onAgain={restart} onHome={onExit} />}
    </div>
  )
}
