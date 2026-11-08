import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Icon } from '../components/Icon'
import { Politician } from '../components/Politician'
import { CoinAmount, GameButton, ProgressBar, Sheet } from '../components/ui'
import { setAudioPrefs, sfx } from '../game/audio'
import { getCharacter } from '../game/characters'
import { fmt } from '../game/format'
import { STAGES, STREAK_REWARDS, dailyChallenges, dayKey, stageFor } from '../game/progression'
import { metricValue, useGame } from '../game/store'
import { useAlerts, useUi, type Modal } from '../game/ui'
import { timeAgo } from './RanksScreen'

export const AVATARS = ['😎', '🤠', '🧢', '👑', '🦁', '🔥', '⚡', '🐐', '💰', '🎤', '🥁', '🌶️', '🦅', '🍛', '🛵', '🎭']

export default function Modals() {
  const modal = useUi((s) => s.modal)
  const close = useUi((s) => s.close)
  const is = (m: Modal) => modal === m
  return (
    <>
      <Sheet open={is('menu')} onClose={close} title="Menu" icon="menu">
        <MenuSheet />
      </Sheet>
      <Sheet open={is('settings')} onClose={close} title="Settings" icon="settings">
        <SettingsSheet />
      </Sheet>
      <Sheet open={is('profile')} onClose={close} title="Profile" icon="user">
        <ProfileSheet />
      </Sheet>
      <Sheet open={is('daily')} onClose={close} title="Daily Rewards" icon="calendar">
        <DailySheet />
      </Sheet>
      <Sheet open={is('share')} onClose={close} title="Share Wahala" icon="share">
        <ShareSheet />
      </Sheet>
      <Sheet open={is('support')} onClose={close} title="Support" icon="support">
        <SupportSheet />
      </Sheet>
      <Sheet open={is('howto')} onClose={close} title="How to Play" icon="info">
        <HowToSheet />
      </Sheet>
      <Sheet open={is('inbox')} onClose={close} title="Alerts" icon="bell">
        <InboxSheet />
      </Sheet>
    </>
  )
}

function MenuSheet() {
  const open = useUi((s) => s.open)
  const items: { m: Modal; icon: string; label: string; sub: string }[] = [
    { m: 'profile', icon: 'user', label: 'Profile & Stats', sub: 'Name, avatar, highscores' },
    { m: 'daily', icon: 'calendar', label: 'Daily Rewards', sub: 'Login streak & challenges' },
    { m: 'share', icon: 'whatsapp', label: 'Share to WhatsApp', sub: 'Show your friends the wahala' },
    { m: 'inbox', icon: 'bell', label: 'Alerts', sub: 'Who passed you on the board' },
    { m: 'howto', icon: 'info', label: 'How to Play', sub: 'Stages, combos, boosts' },
    { m: 'settings', icon: 'settings', label: 'Settings', sub: 'Sound, music, vibration' },
    { m: 'support', icon: 'support', label: 'Support', sub: 'FAQ, report a bug, ideas' },
  ]
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <motion.button
          key={it.m}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => {
            sfx.ui()
            open(it.m)
          }}
          className="flex items-center gap-3 rounded-2xl border-[3px] border-[#042016] bg-black/25 p-3 text-left hover:bg-black/40 active:translate-y-0.5"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0b4a31]">
            <Icon name={it.icon} size={28} />
          </span>
          <span className="flex-1">
            <span className="font-display block text-lg leading-tight">{it.label}</span>
            <span className="text-xs font-semibold text-white/60">{it.sub}</span>
          </span>
          <Icon name="chevron" size={18} />
        </motion.button>
      ))}
      <p className="mt-2 text-center text-[11px] font-semibold text-white/40">Tap The Politician v1.0 · Cartoon satire. Dialogue is invented, not real quotes.</p>
    </div>
  )
}

function Toggle({ icon, label, value, onChange }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => {
        onChange(!value)
        sfx.ui()
      }}
      className="flex items-center gap-3 rounded-2xl border-[3px] border-[#042016] bg-black/25 p-3"
    >
      <Icon name={icon} size={28} />
      <span className="font-display flex-1 text-left text-lg">{label}</span>
      <span className={`relative h-8 w-14 rounded-full border-[3px] border-[#042016] transition ${value ? 'bg-[#00a859]' : 'bg-[#3a3a3a]'}`}>
        <motion.span layout className="absolute top-0.5 h-5 w-5 rounded-full border-2 border-[#042016] bg-white" style={{ left: value ? 26 : 3 }} />
      </span>
    </button>
  )
}

function SettingsSheet() {
  const settings = useGame((s) => s.settings)
  const setSettings = useGame((s) => s.setSettings)
  const resetAll = useGame((s) => s.resetAll)
  const toast = useUi((s) => s.toast)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => setAudioPrefs(settings), [settings])
  return (
    <div className="flex flex-col gap-2">
      <Toggle icon="sound" label="Sound effects" value={settings.sfx} onChange={(v) => setSettings({ sfx: v })} />
      <Toggle icon="music" label="Music" value={settings.music} onChange={(v) => setSettings({ music: v })} />
      <Toggle icon="vibrate" label="Vibration" value={settings.haptics} onChange={(v) => setSettings({ haptics: v })} />
      <Toggle icon="voice" label="Voice lines (TTS)" value={settings.voice} onChange={(v) => setSettings({ voice: v })} />
      <div className="mt-3 rounded-2xl border-[3px] border-[#ff4d4d]/60 bg-[#ff4d4d]/10 p-3">
        <div className="font-display text-lg">Danger zone</div>
        <p className="mb-2 text-xs font-semibold text-white/60">Wipe all coins, upgrades and characters on this device.</p>
        {confirm ? (
          <div className="grid grid-cols-2 gap-2">
            <GameButton tone="dark" onClick={() => setConfirm(false)}>
              Cancel
            </GameButton>
            <GameButton
              tone="red"
              onClick={() => {
                resetAll()
                useAlerts.getState().clear()
                setConfirm(false)
                toast({ kind: 'info', title: 'Fresh start!', body: 'New election, new you.' })
              }}
            >
              Yes, reset
            </GameButton>
          </div>
        ) : (
          <GameButton tone="red" className="w-full" onClick={() => setConfirm(true)}>
            <span className="flex items-center justify-center gap-2">
              <Icon name="trash" size={20} /> Reset progress
            </span>
          </GameButton>
        )}
      </div>
    </div>
  )
}

function ProfileSheet() {
  const profile = useGame((s) => s.profile)
  const setProfile = useGame((s) => s.setProfile)
  const s = useGame()
  const [name, setName] = useState(profile?.name ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATARS[0])
  const toast = useUi((st) => st.toast)
  const unlocked = Object.values(s.chars).filter((c) => c.unlocked).length
  const stats: [string, string, string][] = [
    ['coin', 'Total earned', fmt(s.totalEarned)],
    ['tap', 'Total taps', fmt(s.totalTaps)],
    ['fire', 'Best combo', fmt(s.best.combo)],
    ['bag', 'Biggest jackpot', fmt(s.best.jackpot)],
    ['podium', 'Best boss', `${s.best.boss} taps`],
    ['battle', 'Best duel', `${s.best.duel} taps`],
    ['star', 'Meltdowns', fmt(s.best.meltdowns)],
    ['people', 'Characters', `${unlocked}`],
  ]
  return (
    <div>
      <div className="mb-3 flex flex-wrap justify-center gap-1.5">
        {AVATARS.map((a) => (
          <button key={a} onClick={() => setAvatar(a)} className={`grid h-11 w-11 place-items-center rounded-full border-[3px] text-2xl ${a === avatar ? 'border-[#ffc93c] bg-[#ffc93c]/30' : 'border-[#042016] bg-black/30'}`}>
            {a}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          maxLength={18}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your nickname"
          className="flex-1 rounded-2xl border-[3px] border-[#042016] bg-black/40 px-3 py-2 font-bold outline-none focus:border-[#ffc93c]"
        />
        <GameButton
          tone="green"
          onClick={() => {
            setProfile(name, avatar)
            toast({ kind: 'success', title: 'Profile saved!' })
          }}
        >
          Save
        </GameButton>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map(([icon, label, v]) => (
          <div key={label} className="flex items-center gap-2 rounded-2xl bg-black/25 p-2">
            <Icon name={icon} size={26} />
            <div>
              <div className="text-[10px] font-bold text-white/55 uppercase">{label}</div>
              <div className="font-display text-lg leading-none">{v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DailySheet() {
  const streak = useGame((s) => s.streak)
  const daily = useGame((s) => s.daily)
  const claimStreak = useGame((s) => s.claimStreak)
  const claimChallenge = useGame((s) => s.claimChallenge)
  const toast = useUi((s) => s.toast)
  const today = dayKey()
  const claimedToday = streak.last === today
  const challenges = dailyChallenges(today)
  const nextDay = claimedToday ? streak.count : streak.count + 1
  const cycleDay = ((nextDay - 1) % 7) + 1

  return (
    <div>
      <div className="font-display mb-2 text-lg">Login streak · Day {Math.max(streak.count, claimedToday ? streak.count : 0)}</div>
      <div className="mb-3 grid grid-cols-7 gap-1">
        {STREAK_REWARDS.map((r, i) => {
          const d = i + 1
          const done = claimedToday ? d <= cycleDay : d < cycleDay
          const isNext = !claimedToday && d === cycleDay
          return (
            <div key={d} className={`flex flex-col items-center rounded-xl border-2 py-1.5 ${isNext ? 'pulse-ring border-[#ffc93c] bg-[#ffc93c]/25' : done ? 'border-[#00a859] bg-[#00a859]/25' : 'border-[#042016] bg-black/30'}`}>
              <span className="text-[10px] font-black text-white/60">D{d}</span>
              {done ? <Icon name="check" size={20} /> : <Icon name={d === 7 ? 'gift' : 'coin'} size={20} />}
              <span className="text-[10px] font-black">{fmt(r)}</span>
            </div>
          )
        })}
      </div>
      <GameButton
        tone={claimedToday ? 'dark' : 'gold'}
        disabled={claimedToday}
        className="mb-4 w-full text-lg"
        onClick={() => {
          const r = claimStreak()
          if (r) {
            sfx.buy()
            useGame.getState().burst('win')
            toast({ kind: 'success', title: `+${fmt(r)} coins!`, body: 'Come back tomorrow to keep the streak.', icon: 'gift' })
          }
        }}
      >
        {claimedToday ? 'Come back tomorrow' : 'Claim reward'}
      </GameButton>

      <div className="font-display mb-2 flex items-center gap-2 text-lg">
        <Icon name="star" size={22} /> Today's challenges
      </div>
      <div className="flex flex-col gap-2">
        {challenges.map((c) => {
          const v = metricValue(daily, c.metric)
          const done = v >= c.target
          const claimed = daily.claimed.includes(c.id)
          return (
            <div key={c.id} className="rounded-2xl border-[3px] border-[#042016] bg-black/25 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold">{c.label}</span>
                <CoinAmount n={c.reward} size={16} className="font-display text-[#ffc93c]" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar pct={v / c.target} color={done ? '#00a859' : '#3ec7ff'} className="flex-1" />
                <span className="w-20 text-right text-xs font-black tabular-nums">
                  {fmt(Math.min(v, c.target))}/{fmt(c.target)}
                </span>
                <GameButton
                  tone={claimed ? 'dark' : done ? 'green' : 'dark'}
                  disabled={!done || claimed}
                  className="!px-3 !py-1 text-sm"
                  onClick={() => {
                    if (claimChallenge(c)) {
                      sfx.buy()
                      toast({ kind: 'success', title: 'Challenge complete!', body: `+${fmt(c.reward)} coins`, icon: 'star' })
                    }
                  }}
                >
                  {claimed ? <Icon name="check" size={18} /> : 'Claim'}
                </GameButton>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-[11px] font-semibold text-white/50">New challenges every day at midnight.</p>
    </div>
  )
}

function ShareSheet() {
  const s = useGame()
  const def = getCharacter(s.selected)
  const cp = s.chars[s.selected]
  const stage = stageFor(cp.wahala, cp.term)
  const svgRef = useRef<SVGSVGElement>(null)
  const [busy, setBusy] = useState(false)
  const toast = useUi((st) => st.toast)
  const text = `I don tap ${def.name} reach "${STAGES[stage].name}" 😂🇳🇬 Term ${cp.term}, ${fmt(s.totalEarned)} coins! Can you beat me? Play Tap The Politician: ${location.origin}`

  async function makeCard(): Promise<Blob> {
    const W = 1080
    const H = 1350
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    const grad = g.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0d5a39')
    grad.addColorStop(1, '#02130c')
    g.fillStyle = grad
    g.fillRect(0, 0, W, H)
    // flag stripes
    g.fillStyle = '#00a859'
    g.fillRect(0, 0, 60, H)
    g.fillRect(W - 60, 0, 60, H)
    // sunburst
    g.save()
    g.translate(W / 2, 620)
    g.fillStyle = 'rgba(255,201,60,.08)'
    for (let i = 0; i < 16; i++) {
      g.rotate((Math.PI * 2) / 16)
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(-90, -900)
      g.lineTo(90, -900)
      g.fill()
    }
    g.restore()

    await document.fonts.load('80px "Lilita One"').catch(() => undefined)
    const title = (t: string, y: number, size: number, color: string) => {
      g.font = `${size}px "Lilita One", sans-serif`
      g.textAlign = 'center'
      g.lineJoin = 'round'
      g.lineWidth = size / 6
      g.strokeStyle = '#042016'
      g.strokeText(t, W / 2, y)
      g.fillStyle = color
      g.fillText(t, W / 2, y)
    }
    title('TAP THE POLITICIAN', 130, 96, '#ffc93c')
    title(STAGES[stage].name.toUpperCase(), 220, 64, STAGES[stage].color)

    // draw the current pose straight from the sprite sheet (3×2 atlas)
    if (def.look.spriteSheet) {
      const img = new Image()
      img.src = def.look.spriteSheet
      await img.decode()
      const cw = img.naturalWidth / 3
      const ch = img.naturalHeight / 2
      const size = 780
      g.save()
      g.beginPath()
      g.arc(W / 2, 250 + size / 2, size / 2, 0, Math.PI * 2)
      g.clip()
      g.drawImage(img, (stage % 3) * cw, Math.floor(stage / 3) * ch, cw, ch, W / 2 - size / 2, 250, size, size)
      g.restore()
    }

    title(def.name, 1110, 64, '#ffffff')
    title(`TERM ${cp.term}  •  ${fmt(s.totalEarned)} COINS  •  COMBO ${s.best.combo}`, 1190, 46, '#ffc93c')
    title('Can you beat my wahala?', 1280, 44, '#7dffb8')
    return await new Promise((res) => c.toBlob((b) => res(b!), 'image/png'))
  }

  async function shareImage() {
    setBusy(true)
    try {
      const blob = await makeCard()
      const file = new File([blob], 'tap-the-politician.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'Tap The Politician' })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'tap-the-politician.png'
        a.click()
        URL.revokeObjectURL(a.href)
        toast({ kind: 'info', title: 'Screenshot saved!', body: 'Attach it on WhatsApp status.' })
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast({ kind: 'error', title: 'Could not share', body: String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="panel mx-auto mb-3 w-full max-w-[280px] overflow-hidden p-3 text-center">
        <div className="font-display text-outline-sm text-[#ffc93c]">TAP THE POLITICIAN</div>
        <div className="font-display text-sm" style={{ color: STAGES[stage].color }}>
          {STAGES[stage].name}
        </div>
        <Politician ref={svgRef} def={def} stage={stage} className="mx-auto h-56 w-full" />
        <div className="font-display">{def.name}</div>
        <div className="text-xs font-black text-[#ffc93c]">
          Term {cp.term} · {fmt(s.totalEarned)} coins
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <GameButton tone="gold" disabled={busy} onClick={shareImage}>
          <span className="flex items-center justify-center gap-2">
            <Icon name="download" size={20} /> {busy ? 'Making…' : 'Screenshot'}
          </span>
        </GameButton>
        <GameButton tone="green" style={{ background: 'linear-gradient(180deg,#5ef08f,#25d366)' }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')}>
          <span className="flex items-center justify-center gap-2">
            <Icon name="whatsapp" size={22} /> WhatsApp
          </span>
        </GameButton>
      </div>
    </div>
  )
}

const FAQ = [
  ['Are these real politicians?', 'The names and cartoon likenesses depict Nigerian public figures. Dialogue, promises and reactions are invented for comedy, not real quotes or claims. No endorsement, real-world rankings or approval scores.'],
  ['Does the game end?', 'Never. Each meltdown re-elects the politician into a new, harder term, and new characters join regularly.'],
  ['Why can I not tap?', 'Your energy (generator) is empty. Wait for it to refill, upgrade Solar Panel, or use a Full Tank boost.'],
  ['Is my progress saved?', 'Yes, on this device. Online accounts and cross-device sync are coming with the Laravel backend.'],
  ['Who passed me?', 'Check Alerts (bell icon) or the Ranks tab. You get a pop-up whenever someone overtakes you.'],
]

function SupportSheet() {
  const [cat, setCat] = useState<'bug' | 'idea' | 'account' | 'other'>('bug')
  const [msg, setMsg] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [openQ, setOpenQ] = useState<number | null>(0)
  return (
    <div>
      <div className="font-display mb-2 text-lg">FAQ</div>
      <div className="mb-4 flex flex-col gap-1.5">
        {FAQ.map(([q, a], i) => (
          <button key={q} onClick={() => setOpenQ(openQ === i ? null : i)} className="rounded-2xl border-[3px] border-[#042016] bg-black/25 p-3 text-left">
            <div className="flex items-center justify-between font-extrabold">
              {q}
              <Icon name="chevron" size={16} style={{ transform: `rotate(${openQ === i ? 90 : 0}deg)`, transition: 'transform .2s' }} />
            </div>
            {openQ === i && <div className="mt-1 text-sm font-semibold text-white/70">{a}</div>}
          </button>
        ))}
      </div>

      <div className="font-display mb-2 text-lg">Contact us</div>
      {sent ? (
        <div className="rounded-2xl bg-[#00a859]/25 p-4 text-center font-bold">
          <Icon name="check" size={40} className="mx-auto" />
          Thanks! We don receive am. {api.mode === 'local' && '(Saved offline — it will be sent when the server is live.)'}
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (msg.trim().length < 5) return
            await api.sendSupport({ category: cat, message: msg.trim(), email: email.trim() || undefined }).catch(() => undefined)
            setSent(true)
          }}
          className="flex flex-col gap-2"
        >
          <div className="grid grid-cols-4 gap-1">
            {(['bug', 'idea', 'account', 'other'] as const).map((c) => (
              <button type="button" key={c} onClick={() => setCat(c)} className={`font-display rounded-xl border-2 py-1 text-sm capitalize ${cat === c ? 'border-[#ffc93c] bg-[#ffc93c] text-[#3b2400]' : 'border-[#042016] bg-black/30'}`}>
                {c}
              </button>
            ))}
          </div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Tell us wetin happen…" className="rounded-2xl border-[3px] border-[#042016] bg-black/40 p-3 font-semibold outline-none focus:border-[#ffc93c]" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optional)" className="rounded-2xl border-[3px] border-[#042016] bg-black/40 px-3 py-2 font-semibold outline-none focus:border-[#ffc93c]" />
          <GameButton tone="green" type="submit" disabled={msg.trim().length < 5}>
            Send message
          </GameButton>
        </form>
      )}
    </div>
  )
}

function HowToSheet() {
  const rows: [string, string, string][] = [
    ['tap', 'Tap the politician', 'Every tap earns coins and builds Wahala. Use many fingers at once!'],
    ['star', '6 transformation stages', 'Fresh Agbada → Who Touch Me → Sweating → Abeg Na Wetin I Do → Tears → Wahala Don Land.'],
    ['fire', 'Combos', 'Tap fast to stack a combo multiplier. Stop for a moment and it resets.'],
    ['bag', 'Jackpots', 'The Ghana-Must-Go upgrade gives a chance for x10 taps.'],
    ['bolt', 'Energy', 'Each tap uses 1 energy. It refills over time. Boosts refill it instantly.'],
    ['robot', 'Hype Man', 'Earns coins automatically, even when you close the game (up to 3 hours).'],
    ['podium', 'Rally Boss', 'Fill the comedy meter before the timer runs out. Bosses get harder forever.'],
    ['trophy', 'Leaderboard', 'Daily, weekly and all-time. You get alerted the moment someone passes you.'],
  ]
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([icon, t, d]) => (
        <div key={t} className="flex gap-3 rounded-2xl bg-black/25 p-3">
          <Icon name={icon} size={32} className="shrink-0" />
          <div>
            <div className="font-display text-lg leading-tight">{t}</div>
            <div className="text-sm font-semibold text-white/70">{d}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function InboxSheet() {
  const alerts = useAlerts((s) => s.alerts)
  const markAllRead = useAlerts((s) => s.markAllRead)
  const clear = useAlerts((s) => s.clear)
  const setScreen = useUi((s) => s.setScreen)
  const close = useUi((s) => s.close)
  useEffect(() => {
    const t = window.setTimeout(markAllRead, 1200)
    return () => window.clearTimeout(t)
  }, [markAllRead])
  if (!alerts.length)
    return (
      <div className="py-8 text-center">
        <Icon name="inbox" size={56} className="mx-auto mb-2" />
        <div className="font-display text-xl">No wahala yet</div>
        <div className="text-sm font-semibold text-white/60">You'll be alerted when someone passes you.</div>
      </div>
    )
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {alerts.map((a) => (
          <div key={a.id} className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 ${a.read ? 'border-[#042016] bg-black/20' : 'border-[#ff4d4d] bg-[#ff4d4d]/15'}`}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0b4a31] text-xl">{a.byAvatar}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-extrabold">{a.byName} passed you</div>
              <div className="text-xs font-bold text-white/60">
                {a.period === 'all' ? 'All-time' : a.period === 'daily' ? 'Daily' : 'Weekly'} board · you're now #{a.newRank}
              </div>
            </div>
            <span className="text-[11px] font-bold text-white/50">{timeAgo(a.at)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <GameButton tone="dark" onClick={clear}>
          Clear
        </GameButton>
        <GameButton
          tone="gold"
          onClick={() => {
            close()
            setScreen('ranks')
          }}
        >
          View ranks
        </GameButton>
      </div>
    </div>
  )
}
