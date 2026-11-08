import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Politician } from '../components/Politician'
import { CoinAmount, GameButton, ProgressBar } from '../components/ui'
import { sfx, speak } from '../game/audio'
import { getCharacter } from '../game/characters'
import { fmt, vibrate } from '../game/format'
import { BOOSTS, STAGES, comboCapFor, comboMultiplier, dayKey, stageProgress } from '../game/progression'
import { useGame, useMaxEnergy } from '../game/store'
import { useUi } from '../game/ui'

interface Floater {
  id: number
  x: number
  y: number
  text: string
  crit: boolean
}

let fid = 0

export default function TapScreen() {
  const selected = useGame((s) => s.selected)
  const level = useGame((s) => s.level)
  const cp = useGame((s) => s.chars[s.selected])
  const energy = useGame((s) => s.energy)
  const combo = useGame((s) => s.combo)
  const comboCapLvl = useGame((s) => s.upgrades.comboCap)
  const bubble = useGame((s) => s.bubble)
  const turboUntil = useGame((s) => s.turboUntil)
  const nerfUntil = useGame((s) => s.nerfUntil)
  const nerfMult = useGame((s) => s.nerfMult)
  const event = useGame((s) => s.event)
  const daily = useGame((s) => s.daily)
  const settings = useGame((s) => s.settings)
  const streakLast = useGame((s) => s.streak.last)
  const tap = useGame((s) => s.tap)
  const activateBoost = useGame((s) => s.useBoost)
  const maxEnergy = useMaxEnergy()
  const toast = useUi((s) => s.toast)
  const open = useUi((s) => s.open)

  const def = getCharacter(selected)
  const { stage, pct, next } = stageProgress(cp.wahala, cp.term)
  const st = STAGES[stage]
  const mult = comboMultiplier(combo, comboCapFor(comboCapLvl))

  const [floaters, setFloaters] = useState<Floater[]>([])
  const [hit, setHit] = useState(false)
  const [meltdown, setMeltdown] = useState<NonNullable<ReturnType<typeof tap>>['meltdown']>(null)
  const [scope, animate] = useAnimate()
  const arenaRef = useRef<HTMLDivElement>(null)
  const hitTimer = useRef<number>(0)
  const lastNoEnergy = useRef(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(t)
  }, [])
  const turboLeft = Math.max(0, turboUntil - now)
  const nerfLeft = Math.max(0, nerfUntil - now)

  useEffect(() => {
    if (bubble) speak(bubble.text)
  }, [bubble])

  function onPointerDown(e: React.PointerEvent) {
    const rect = arenaRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const r = tap()
    if (!r) {
      sfx.error()
      if (Date.now() - lastNoEnergy.current > 2500) {
        lastNoEnergy.current = Date.now()
        toast({ kind: 'error', title: 'Generator don finish! ⛽', body: 'Wait for energy, or use Full Tank.', icon: 'bolt' })
      }
      void animate(scope.current, { x: [0, -10, 10, -6, 0] }, { duration: 0.3 })
      return
    }
    // juice
    const dx = (x / rect.width - 0.5) * 2
    const dy = (y / rect.height - 0.5) * 2
    void animate(
      scope.current,
      { scale: [0.9, 1.05, 1], rotateY: [dx * 14, 0], rotateX: [-dy * 14, 0] },
      { duration: 0.32, ease: 'easeOut' },
    )
    setHit(true)
    window.clearTimeout(hitTimer.current)
    hitTimer.current = window.setTimeout(() => setHit(false), 110)

    const id = ++fid
    setFloaters((f) => [...f.slice(-24), { id, x, y, text: `+${fmt(r.coins)}`, crit: r.crit }])
    window.setTimeout(() => setFloaters((f) => f.filter((v) => v.id !== id)), 900)

    if (r.crit) sfx.crit()
    else sfx.tap(r.combo)
    if (settings.haptics) vibrate(r.crit ? [20, 30, 40] : 12)

    if (r.protest) {
      sfx.buy()
      useGame.getState().burst('win')
      toast(
        r.protest.def.kind === 'bonus'
          ? { kind: 'success', icon: r.protest.def.icon, title: 'Palliative collected!', body: `+${fmt(r.protest.reward)} coins` }
          : { kind: 'success', icon: '✊', title: 'Protest successful!', body: `${r.protest.def.title.replace('!', '')} blocked. +${fmt(r.protest.reward)} coins` },
      )
    }

    if (r.meltdown) {
      sfx.meltdown()
      if (settings.haptics) vibrate([80, 50, 80, 50, 200])
      setMeltdown(r.meltdown)
      window.setTimeout(() => setMeltdown(null), 3200)
    } else if (r.stageUp !== null) {
      sfx.stageUp()
      toast({ kind: 'success', title: `Stage ${r.stageUp + 1}: ${STAGES[r.stageUp].name}`, body: STAGES[r.stageUp].tagline, icon: 'star' })
    }
  }

  const streakReady = streakLast !== dayKey()

  return (
    <div className="flex h-full flex-col px-3">
      {/* character header */}
      <div className="panel mb-2 flex items-center gap-3 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-lg leading-tight">{def.name}</div>
          <div className="flex items-center gap-2 text-xs font-bold text-white/70">
            <span className="rounded-md bg-[#7dffb8] px-1.5 py-0.5 text-[#042016]">LVL {level}</span>
            <span className="rounded-md bg-[#ffc93c] px-1.5 py-0.5 text-[#3b2400]">TERM {cp.term}</span>
            <span className="truncate">{def.title}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display rounded-lg border-2 border-[#042016] px-2 py-0.5 text-sm" style={{ background: st.color, color: '#042016' }}>
            {st.name}
          </div>
          <div className="mt-1 text-[11px] font-bold text-white/60">{stage < 5 ? `Next at ${fmt(next)}` : 'Meltdown at ' + fmt(next)}</div>
        </div>
      </div>
      <ProgressBar pct={pct} color={stage < 5 ? STAGES[stage + 1].color : '#ff4d4d'} height={12} />
      <div className="mt-1 flex justify-between text-[11px] font-extrabold tracking-wide text-white/60">
        <span>WAHALA {fmt(cp.wahala)}</span>
        <span>{STAGES.map((s) => (s.index <= stage ? '●' : '○')).join(' ')}</span>
      </div>

      {/* arena */}
      <div
        ref={arenaRef}
        className="relative my-1 flex min-h-0 flex-1 touch-none items-center justify-center"
        style={{ perspective: 800 }}
        onPointerDown={onPointerDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* stage glow */}
        <div className="absolute aspect-square w-[78%] max-w-[360px] rounded-full opacity-60 blur-2xl" style={{ background: `radial-gradient(circle, ${st.color}aa, transparent 65%)` }} />

        <div ref={scope} className="relative h-full max-h-[420px] w-full max-w-[340px] cursor-pointer" style={{ transformStyle: 'preserve-3d' }}>
          <Politician def={def} stage={stage} hit={hit} className="h-full w-full" />
        </div>

        {/* speech bubble */}
        <AnimatePresence>
          {bubble && now - bubble.id < 2600 && (
            <motion.div
              key={bubble.id}
              initial={{ scale: 0.4, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="pointer-events-none absolute top-1 left-1/2 z-10 max-w-[78%] -translate-x-1/2 rounded-2xl border-[3px] border-[#042016] bg-white px-3 py-2 text-center text-sm font-black text-[#042016] shadow-lg"
            >
              {bubble.text}
              <span className="absolute -bottom-[11px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r-[3px] border-b-[3px] border-[#042016] bg-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* combo */}
        <AnimatePresence>
          {combo >= 5 && (
            <motion.div
              key="combo"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              className="pointer-events-none absolute top-14 right-0 flex flex-col items-center"
            >
              <motion.div key={combo} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="font-display text-outline text-3xl text-[#ffc93c]">
                {combo}
              </motion.div>
              <div className="font-display text-outline-sm flex items-center gap-1 text-sm">
                <Icon name="fire" size={16} /> COMBO x{mult.toFixed(2).replace(/\.?0+$/, '')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* economy wahala event: protest by tapping */}
        <AnimatePresence>
          {event && now < event.endsAt && (
            <motion.div
              key={event.def.id + event.endsAt}
              initial={{ y: -30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`pointer-events-none absolute inset-x-2 top-0 z-20 rounded-2xl border-[3px] border-[#042016] p-2.5 shadow-xl ${event.def.kind === 'bonus' ? 'bg-[#00a859]' : 'bg-[#ff4d4d]'}`}
            >
              <div className="flex items-center gap-2">
                <span className="wobble text-3xl">{event.def.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-outline-sm text-lg leading-tight">{event.def.title}</div>
                  <div className="text-xs font-black text-white/90">
                    {event.def.kind === 'bonus' ? 'TAP FAST to collect!' : `PROTEST! Tap ${event.target}× to block · ${event.def.body}`}
                  </div>
                </div>
                <div className="font-display text-outline-sm text-2xl tabular-nums">{Math.ceil((event.endsAt - now) / 1000)}</div>
              </div>
              <ProgressBar pct={event.taps / event.target} color="#ffc93c" height={12} className="mt-1.5" />
            </motion.div>
          )}
        </AnimatePresence>

        {nerfLeft > 0 && (
          <div className="font-display pointer-events-none absolute bottom-2 left-0 flex items-center gap-1 rounded-xl border-2 border-[#042016] bg-[#ff4d4d] px-2 py-1 text-sm shadow-lg">
            📉 Earnings -{Math.round((1 - nerfMult) * 100)}% · {Math.ceil(nerfLeft / 1000)}s
          </div>
        )}

        {turboLeft > 0 && (
          <div className="font-display pointer-events-none absolute top-14 left-0 flex items-center gap-1 rounded-xl border-2 border-[#042016] bg-[#9b5cff] px-2 py-1 text-sm shadow-lg">
            <Icon name="rocket" size={18} /> x5 · {Math.ceil(turboLeft / 1000)}s
          </div>
        )}

        {/* floating numbers */}
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            className={`font-display text-outline pointer-events-none absolute z-20 ${f.crit ? 'text-4xl text-[#ff4d4d]' : 'text-2xl text-[#ffc93c]'}`}
            style={{ left: f.x, top: f.y }}
            initial={{ x: '-50%', y: '-50%', opacity: 1, scale: f.crit ? 1.6 : 0.8 }}
            animate={{ y: '-260%', opacity: 0, scale: f.crit ? 1.2 : 1, x: `${-50 + (f.id % 2 ? 20 : -20)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            {f.crit && '💰 '}
            {f.text}
          </motion.div>
        ))}

        {/* meltdown overlay */}
        <AnimatePresence>
          {meltdown && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="pointer-events-none absolute inset-x-0 top-1/3 z-30 text-center"
            >
              <div className="font-display text-outline text-5xl text-[#ff4d4d]">WAHALA DON LAND!</div>
              <div className="font-display text-outline-sm mt-2 text-2xl text-[#ffc93c]">+{fmt(meltdown.reward)} coins</div>
              <div className="font-display text-outline mt-3 text-3xl text-[#7dffb8]">LEVEL {meltdown.level}!</div>
              <div className="font-display text-outline-sm mt-1 text-lg">
                {meltdown.newUnlock ? '🔓 New politician: ' : 'Next up: '}
                {meltdown.nextName}
                {meltdown.term > 1 && ` · Term ${meltdown.term}`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* energy + boosts */}
      <div className="mb-2 flex items-end gap-2">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-1 font-extrabold">
            <Icon name="bolt" size={20} />
            <span className="font-display text-lg tabular-nums">
              {Math.floor(energy)} <span className="text-sm text-white/60">/ {maxEnergy}</span>
            </span>
          </div>
          <ProgressBar pct={energy / maxEnergy} color="#ffd93c" height={16} />
        </div>
        <BoostButton
          icon="fuel"
          label={`${BOOSTS.refill.perDay - daily.refillUsed}/${BOOSTS.refill.perDay}`}
          disabled={daily.refillUsed >= BOOSTS.refill.perDay}
          onClick={() => {
            if (activateBoost('refill')) {
              sfx.buy()
              toast({ kind: 'success', title: 'Full Tank!', body: 'Energy refilled. Tap away!', icon: 'fuel' })
            }
          }}
          tone="green"
        />
        <BoostButton
          icon="rocket"
          label={turboLeft > 0 ? `${Math.ceil(turboLeft / 1000)}s` : `${BOOSTS.turbo.perDay - daily.turboUsed}/${BOOSTS.turbo.perDay}`}
          disabled={daily.turboUsed >= BOOSTS.turbo.perDay || turboLeft > 0}
          onClick={() => {
            if (activateBoost('turbo')) {
              sfx.buy()
              toast({ kind: 'success', title: 'Turbo Rally!', body: 'x5 coins for 20 seconds', icon: 'rocket' })
            }
          }}
          tone="purple"
        />
        <div className="relative">
          <BoostButton icon="gift" label="Daily" onClick={() => open('daily')} tone="gold" />
          {streakReady && <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full bg-[#ff4d4d]" />}
        </div>
      </div>
      <div className="mb-1 flex justify-center">
        <span className="chip px-3 py-0.5 text-xs font-bold text-white/70">
          Bonus x{def.coinBonus} · Today <CoinAmount n={daily.coins} size={12} className="font-black text-[#ffc93c]" />
        </span>
      </div>
    </div>
  )
}

function BoostButton({ icon, label, onClick, disabled, tone }: { icon: string; label: string; onClick: () => void; disabled?: boolean; tone: 'green' | 'purple' | 'gold' }) {
  return (
    <GameButton tone={tone} onClick={onClick} disabled={disabled} className="flex h-[58px] w-[58px] flex-col items-center justify-center !p-0">
      <Icon name={icon} size={26} />
      <span className="text-[11px] leading-none">{label}</span>
    </GameButton>
  )
}
