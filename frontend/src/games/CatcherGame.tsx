import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Countdown, GameOver, Hearts, PreRun } from '../components/RunUI'
import { sfx } from '../game/audio'
import { getCharacter, randomLine } from '../game/characters'
import { rollModifier, type Modifier } from '../game/events'
import { vibrate } from '../game/format'
import { basketWidthFor, calmFor, comboMult, livesFor, luckFor, magnetFor, stageFor } from '../game/progression'
import { useGame, type RunOutcome } from '../game/store'

/**
 * PROMISE CATCHER
 * The politician paces the rally stage throwing things at the crowd.
 * Drag the basket to catch real "dividends" (naira, rice, bread, light, books),
 * dodge empty promises, fuel-price tags and tax bills. It keeps speeding up.
 * Every good catch builds wahala, so the politician panics through their poses
 * live during the run.
 */

type Kind = 'good' | 'gold' | 'bad' | 'power'
interface ItemDef {
  emoji: string
  kind: Kind
  points: number
  label?: string
  power?: 'magnet' | 'double' | 'shield' | 'heart' | 'slow'
}

const GOOD: ItemDef[] = [
  { emoji: '💵', kind: 'good', points: 10 },
  { emoji: '🍚', kind: 'good', points: 15 },
  { emoji: '🍞', kind: 'good', points: 10 },
  { emoji: '💡', kind: 'good', points: 20 },
  { emoji: '📚', kind: 'good', points: 15 },
]
const GOLD: ItemDef = { emoji: '🗳️', kind: 'gold', points: 50 }
const BAD: ItemDef[] = [
  { emoji: '💬', kind: 'bad', points: 0, label: 'I go fix am!' },
  { emoji: '⛽', kind: 'bad', points: 0, label: '₦₦₦' },
  { emoji: '🧾', kind: 'bad', points: 0, label: 'TAX' },
]
const POWERS: ItemDef[] = [
  { emoji: '🧲', kind: 'power', points: 0, power: 'magnet' },
  { emoji: '⭐', kind: 'power', points: 0, power: 'double' },
  { emoji: '🛡️', kind: 'power', points: 0, power: 'shield' },
  { emoji: '🐢', kind: 'power', points: 0, power: 'slow' },
  { emoji: '❤️', kind: 'power', points: 0, power: 'heart' },
]

interface Item {
  def: ItemDef
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  r: number
}
interface Floater {
  x: number
  y: number
  text: string
  color: string
  life: number
}
interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

const RULES: [string, string][] = [
  ['👆', 'Drag left/right to move the basket'],
  ['💵', 'Catch dividends: naira, rice, bread, light, books'],
  ['💬', 'Dodge empty promises, fuel prices & tax: they cost a heart'],
  ['🗳️', 'Golden ballot = +50 · power-ups: 🧲 ⭐ 🛡️ 🐢 ❤️'],
]

export default function CatcherGame({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'count' | 'play' | 'paused' | 'over'>('intro')
  const [modifier, setModifier] = useState<Modifier>(() => rollModifier())
  const [hud, setHud] = useState({ score: 0, hearts: 3, combo: 0, powers: [] as string[] })
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null)
  const [charId, setCharId] = useState(() => useGame.getState().selected)
  const best = useGame((s) => s.best.catcher)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const targetX = useRef<number | null>(null)
  const [round, setRound] = useState(0)

  // ---------------------------------------------------------------- engine
  useEffect(() => {
    if (phase !== 'play' && phase !== 'paused') return
    const canvas = canvasRef.current!
    const wrap = wrapRef.current!
    const ctx = canvas.getContext('2d')!
    const st = useGame.getState()
    const def = getCharacter(st.selected)
    const cp = st.chars[st.selected]
    const up = st.upgrades
    const haptics = st.settings.haptics
    const calm = calmFor(up.calm)
    const luck = luckFor(up.luck) * modifier.good
    const maxHearts = livesFor(up.lives)

    let W = 0
    let H = 0
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      W = wrap.clientWidth
      H = wrap.clientHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const sheet = new Image()
    if (def.look.spriteSheet) sheet.src = def.look.spriteSheet

    // state (mutable, outside React for 60fps)
    const g = {
      t: 0,
      score: 0,
      hearts: maxHearts,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      items: [] as Item[],
      floaters: [] as Floater[],
      sparks: [] as Spark[],
      spawnIn: 0.8,
      bx: W / 2,
      shake: 0,
      flash: 0,
      magnet: 0,
      double: 0,
      slow: 0,
      shield: false,
      polX: W / 2,
      polStage: stageFor(cp.wahala, cp.term),
      startedAt: performance.now(),
      over: false,
    }
    const bw = () => 92 * basketWidthFor(up.basket)
    const by = () => H - 74

    const spawn = () => {
      const r = Math.random()
      const badP = Math.min(0.45, (0.2 + g.t * 0.0035) * modifier.bad)
      let d: ItemDef
      if (r < 0.05) d = POWERS[Math.floor(Math.random() * (g.hearts < maxHearts ? 5 : 4))]
      else if (r < 0.05 + luck) d = GOLD
      else if (r < 0.05 + luck + badP) d = BAD[Math.floor(Math.random() * BAD.length)]
      else d = GOOD[Math.floor(Math.random() * GOOD.length)]
      const speed = (150 + g.t * 7 * calm) * modifier.speed
      g.items.push({
        def: d,
        x: g.polX,
        y: 120,
        vx: (Math.random() - 0.5) * 220,
        vy: Math.min(600, speed) * (0.85 + Math.random() * 0.3),
        rot: 0,
        vr: (Math.random() - 0.5) * 4,
        r: d.kind === 'gold' ? 24 : 21,
      })
    }

    const burst = (x: number, y: number, color: string, n = 12) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = 80 + Math.random() * 220
        g.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 0.6 + Math.random() * 0.3, color })
      }
    }

    const catchItem = (it: Item) => {
      const d = it.def
      if (d.kind === 'bad') {
        if (g.shield) {
          g.shield = false
          g.floaters.push({ x: it.x, y: it.y, text: 'BLOCKED!', color: '#3ec7ff', life: 1 })
          sfx.ui()
          return
        }
        g.hearts -= 1
        g.combo = 0
        g.shake = 0.35
        g.flash = 0.25
        g.floaters.push({ x: it.x, y: it.y, text: d.label ?? 'OUCH', color: '#ff4d4d', life: 1 })
        sfx.error()
        if (haptics) vibrate([40, 30, 40])
        if (g.hearts <= 0) g.over = true
        return
      }
      if (d.kind === 'power') {
        if (d.power === 'magnet') g.magnet = 7
        if (d.power === 'double') g.double = 8
        if (d.power === 'slow') g.slow = 6
        if (d.power === 'shield') g.shield = true
        if (d.power === 'heart') g.hearts = Math.min(maxHearts, g.hearts + 1)
        g.floaters.push({ x: it.x, y: it.y, text: { magnet: 'MAGNET!', double: 'x2!', slow: 'SLOW-MO!', shield: 'SHIELD!', heart: '+1 ❤️' }[d.power!], color: '#7dffb8', life: 1.1 })
        sfx.buy()
        burst(it.x, it.y, '#7dffb8')
        return
      }
      g.combo += 1
      g.hits += 1
      g.maxCombo = Math.max(g.maxCombo, g.combo)
      const pts = Math.round(d.points * comboMult(g.combo) * (g.double > 0 ? 2 : 1))
      g.score += pts
      g.floaters.push({ x: it.x, y: it.y, text: `+${pts}`, color: d.kind === 'gold' ? '#ffc93c' : '#ffffff', life: 0.9 })
      burst(it.x, it.y, d.kind === 'gold' ? '#ffc93c' : '#7dffb8', d.kind === 'gold' ? 22 : 8)
      if (d.kind === 'gold') sfx.crit()
      else sfx.tap(g.combo)
      if (haptics) vibrate(8)
      // live pose: the politician panics as wahala builds
      const ns = stageFor(cp.wahala + g.score, cp.term)
      if (ns > g.polStage) {
        g.polStage = ns
        setBubble({ text: randomLine(def, ns), id: performance.now() })
        sfx.stageUp()
      }
    }

    let last = performance.now()
    let raf = 0
    let hudTick = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const paused = phaseRef.current === 'paused'
      let dt = Math.min(0.033, (now - last) / 1000)
      last = now
      if (paused) dt = 0
      const slowF = g.slow > 0 ? 0.55 : 1
      const sdt = dt * slowF

      if (!g.over && dt > 0) {
        g.t += dt
        g.magnet = Math.max(0, g.magnet - dt)
        g.double = Math.max(0, g.double - dt)
        g.slow = Math.max(0, g.slow - dt)
        g.shake = Math.max(0, g.shake - dt)
        g.flash = Math.max(0, g.flash - dt)

        // politician paces the stage
        g.polX = W / 2 + Math.sin(g.t * (0.7 + g.t * 0.004)) * (W / 2 - 70)

        // basket follows finger
        if (targetX.current !== null) g.bx += (targetX.current - g.bx) * Math.min(1, dt * 18)
        g.bx = Math.max(bw() / 2 + 6, Math.min(W - bw() / 2 - 6, g.bx))

        // spawning
        g.spawnIn -= sdt
        if (g.spawnIn <= 0) {
          spawn()
          g.spawnIn = Math.max(0.26, (0.9 - g.t * 0.011 * calm) / modifier.speed) * (0.7 + Math.random() * 0.6)
        }

        const pull = magnetFor(up.magnet) + (g.magnet > 0 ? 160 : 0)
        const bTop = by() - 14
        for (const it of g.items) {
          if (pull > 0 && (it.def.kind === 'good' || it.def.kind === 'gold') && it.y > H * 0.35) {
            const dx = g.bx - it.x
            if (Math.abs(dx) < pull) it.x += Math.sign(dx) * Math.min(Math.abs(dx), 380 * sdt)
          }
          it.x += it.vx * sdt
          it.y += it.vy * sdt
          it.rot += it.vr * sdt
          if (it.x < it.r || it.x > W - it.r) {
            it.vx *= -1
            it.x = Math.max(it.r, Math.min(W - it.r, it.x))
          }
        }
        // collisions
        const keep: Item[] = []
        for (const it of g.items) {
          const inX = Math.abs(it.x - g.bx) < bw() / 2 + it.r * 0.4
          if (inX && it.y + it.r >= bTop && it.y - it.r <= bTop + 22) {
            catchItem(it)
            continue
          }
          if (it.y - it.r > H) {
            if (it.def.kind === 'good' || it.def.kind === 'gold') g.combo = 0
            continue
          }
          keep.push(it)
        }
        g.items = keep
        for (const f of g.floaters) {
          f.y -= 60 * dt
          f.life -= dt
        }
        g.floaters = g.floaters.filter((f) => f.life > 0)
        for (const s of g.sparks) {
          s.x += s.vx * dt
          s.y += s.vy * dt
          s.vy += 500 * dt
          s.life -= dt
        }
        g.sparks = g.sparks.filter((s) => s.life > 0)
      }

      // ------------------------------------------------------------ draw
      ctx.save()
      ctx.clearRect(0, 0, W, H)
      if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 14 * g.shake * 3, (Math.random() - 0.5) * 10 * g.shake * 3)

      // stage
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(0, 118, W, 6)
      ctx.fillStyle = '#00a859'
      for (let x = 0; x < W; x += 36) {
        ctx.fillStyle = (x / 36) % 2 ? '#ffffff' : '#00a859'
        ctx.globalAlpha = 0.35
        ctx.fillRect(x, 112, 36, 8)
      }
      ctx.globalAlpha = 1

      // politician sprite (current pose)
      if (sheet.complete && sheet.naturalWidth) {
        const cw = sheet.naturalWidth / 3
        const ch = sheet.naturalHeight / 2
        const f = g.polStage
        const size = 118
        const bob = Math.sin(g.t * 8) * 2
        ctx.drawImage(sheet, (f % 3) * cw, Math.floor(f / 3) * ch, cw, ch, g.polX - size / 2, 6 + bob, size, size)
      }

      // items
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const it of g.items) {
        ctx.save()
        ctx.translate(it.x, it.y)
        if (it.def.kind === 'gold') {
          ctx.shadowColor = '#ffc93c'
          ctx.shadowBlur = 18
        }
        if (it.def.kind === 'bad') {
          ctx.fillStyle = 'rgba(255,77,77,0.35)'
          ctx.beginPath()
          ctx.arc(0, 0, it.r + 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.rotate(it.rot)
        ctx.font = `${it.r * 1.7}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`
        ctx.fillText(it.def.emoji, 0, 2)
        ctx.restore()
        if (it.def.label) {
          ctx.font = '900 11px Nunito, sans-serif'
          ctx.fillStyle = '#fff'
          ctx.strokeStyle = '#042016'
          ctx.lineWidth = 3
          ctx.strokeText(it.def.label, it.x, it.y + it.r + 9)
          ctx.fillText(it.def.label, it.x, it.y + it.r + 9)
        }
      }

      // basket (checkered "Ghana-must-go" style bag)
      const w = bw()
      const x0 = g.bx - w / 2
      const y0 = by() - 14
      if (g.magnet > 0 || up.magnet > 0) {
        ctx.fillStyle = g.magnet > 0 ? 'rgba(125,255,184,0.18)' : 'rgba(125,255,184,0.07)'
        ctx.beginPath()
        ctx.ellipse(g.bx, y0, w / 2 + (magnetFor(up.magnet) + (g.magnet > 0 ? 160 : 0)) * 0.5, 30, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#2f6fd6'
      ctx.strokeStyle = '#042016'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x0 + w, y0)
      ctx.lineTo(x0 + w - 10, y0 + 46)
      ctx.lineTo(x0 + 10, y0 + 46)
      ctx.closePath()
      ctx.fill()
      ctx.save()
      ctx.clip()
      ctx.strokeStyle = '#e53935'
      ctx.lineWidth = 4
      for (let i = 1; i < 6; i++) {
        ctx.beginPath()
        ctx.moveTo(x0 + (w / 6) * i, y0)
        ctx.lineTo(x0 + (w / 6) * i, y0 + 46)
        ctx.stroke()
      }
      for (let j = 1; j < 3; j++) {
        ctx.beginPath()
        ctx.moveTo(x0, y0 + 15 * j)
        ctx.lineTo(x0 + w, y0 + 15 * j)
        ctx.stroke()
      }
      ctx.restore()
      ctx.strokeStyle = '#042016'
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.fillStyle = '#ffc93c'
      ctx.fillRect(x0 - 4, y0 - 6, w + 8, 8)
      ctx.strokeRect(x0 - 4, y0 - 6, w + 8, 8)
      if (g.shield) {
        ctx.strokeStyle = '#3ec7ff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(g.bx, y0 + 18, w / 2 + 14, Math.PI, 0)
        ctx.stroke()
      }

      // sparks & floaters
      for (const s of g.sparks) {
        ctx.globalAlpha = Math.max(0, s.life)
        ctx.fillStyle = s.color
        ctx.fillRect(s.x - 3, s.y - 3, 6, 6)
      }
      ctx.globalAlpha = 1
      for (const f of g.floaters) {
        ctx.globalAlpha = Math.min(1, f.life * 1.5)
        ctx.font = '22px "Lilita One", sans-serif'
        ctx.lineWidth = 5
        ctx.strokeStyle = '#042016'
        ctx.strokeText(f.text, f.x, f.y)
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y)
      }
      ctx.globalAlpha = 1

      // NEPA blackout: darkness with spotlights on the basket and stage
      if (modifier.dark) {
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.72)'
        ctx.beginPath()
        ctx.rect(0, 0, W, H)
        ctx.arc(g.bx, y0, 150, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.restore()
        const grd = ctx.createRadialGradient(g.bx, y0, 80, g.bx, y0, 155)
        grd.addColorStop(0, 'rgba(0,0,0,0)')
        grd.addColorStop(1, 'rgba(0,0,0,0.72)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(g.bx, y0, 155, 0, Math.PI * 2)
        ctx.fill()
      }
      if (g.flash > 0) {
        ctx.fillStyle = `rgba(255,40,40,${g.flash})`
        ctx.fillRect(0, 0, W, H)
      }
      ctx.restore()

      // HUD sync (throttled)
      hudTick += dt
      if (hudTick > 0.08 || g.over) {
        hudTick = 0
        const powers: string[] = []
        if (g.magnet > 0) powers.push(`🧲 ${Math.ceil(g.magnet)}`)
        if (g.double > 0) powers.push(`⭐ ${Math.ceil(g.double)}`)
        if (g.slow > 0) powers.push(`🐢 ${Math.ceil(g.slow)}`)
        if (g.shield) powers.push('🛡️')
        setHud({ score: g.score, hearts: g.hearts, combo: g.combo, powers })
      }

      if (g.over) {
        cancelAnimationFrame(raf)
        const out = useGame.getState().finishRun({
          mode: 'catcher',
          score: g.score,
          hits: g.hits,
          maxCombo: g.maxCombo,
          durationMs: performance.now() - g.startedAt,
          modifier: modifier.id === 'none' ? null : modifier.id,
        })
        if (out.meltdown) sfx.meltdown()
        else if (out.newBest) sfx.stageUp()
        setOutcome(out)
        setPhase('over')
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
    // the engine is (re)created per round; pause is read via phaseRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, phase === 'play' || phase === 'paused'])

  // keyboard controls
  useEffect(() => {
    const keys = new Set<string>()
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const w = wrapRef.current
      if (!w) return
      if (keys.size) {
        const cur = targetX.current ?? w.clientWidth / 2
        const d = (keys.has('ArrowLeft') || keys.has('a') ? -1 : 0) + (keys.has('ArrowRight') || keys.has('d') ? 1 : 0)
        targetX.current = Math.max(0, Math.min(w.clientWidth, cur + d * 9))
      }
    }
    const down = (e: KeyboardEvent) => {
      keys.add(e.key)
      if (e.key === 'Escape' || e.key === 'p') setPhase((p) => (p === 'play' ? 'paused' : p === 'paused' ? 'play' : p))
    }
    const up = (e: KeyboardEvent) => keys.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(raf)
    }
  }, [])

  const pointer = (e: React.PointerEvent) => {
    const r = wrapRef.current!.getBoundingClientRect()
    targetX.current = e.clientX - r.left
  }

  const restart = () => {
    setOutcome(null)
    setModifier(rollModifier())
    setHud({ score: 0, hearts: livesFor(useGame.getState().upgrades.lives), combo: 0, powers: [] })
    setCharId(useGame.getState().selected)
    setBubble(null)
    targetX.current = null
    setRound((r) => r + 1)
    setPhase('intro')
  }

  const maxHearts = livesFor(useGame.getState().upgrades.lives)

  return (
    <div className="relative flex h-full flex-col">
      {/* HUD */}
      <div className="relative z-10 flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),10px)] pb-1">
        <button onClick={() => setPhase((p) => (p === 'play' ? 'paused' : p))} className="btn-3d grid h-10 w-10 place-items-center bg-[#0e3a28]" aria-label="Pause">
          <span className="font-display text-lg">II</span>
        </button>
        <Hearts n={hud.hearts} max={maxHearts} />
        <div className="flex-1" />
        {hud.combo >= 5 && (
          <motion.div key={hud.combo} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="font-display text-outline-sm flex items-center gap-1 text-sm text-[#ffc93c]">
            <Icon name="fire" size={16} /> {hud.combo} x{comboMult(hud.combo)}
          </motion.div>
        )}
        <div className="font-display text-outline-sm chip px-3 py-1 text-2xl tabular-nums">{hud.score}</div>
      </div>
      <div className="relative z-10 flex h-6 justify-center gap-2 text-sm font-black">
        {hud.powers.map((p) => (
          <span key={p.slice(0, 2)} className="chip px-2">
            {p}
          </span>
        ))}
      </div>

      <div ref={wrapRef} className="relative min-h-0 flex-1 touch-none" onPointerDown={pointer} onPointerMove={pointer}>
        <canvas ref={canvasRef} className="absolute inset-0" />
        <AnimatePresence>
          {bubble && phase === 'play' && (
            <motion.div
              key={bubble.id}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              onAnimationComplete={() => window.setTimeout(() => setBubble((b) => (b?.id === bubble.id ? null : b)), 1800)}
              className="pointer-events-none absolute top-[118px] left-1/2 z-10 max-w-[80%] -translate-x-1/2 rounded-2xl border-[3px] border-[#042016] bg-white px-3 py-1.5 text-center text-sm font-black text-[#042016]"
            >
              {bubble.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'intro' && (
        <PreRun title="Promise Catcher" icon="bag" rules={RULES} modifier={modifier} best={best} onExit={onExit} onStart={() => setPhase('count')} />
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
