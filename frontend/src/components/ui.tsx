import { AnimatePresence, motion } from 'motion/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { sfx } from '../game/audio'
import { fmt } from '../game/format'
import { useGame } from '../game/store'
import { useUi, useUnreadAlerts, type Screen } from '../game/ui'
import { Icon } from './Icon'

type Tone = 'green' | 'gold' | 'red' | 'blue' | 'purple' | 'dark'
const TONES: Record<Tone, { bg: string; shadow: string; text: string }> = {
  green: { bg: 'linear-gradient(180deg,#2fe08a,#00a859)', shadow: '#006b3a', text: '#fff' },
  gold: { bg: 'linear-gradient(180deg,#ffe082,#ffc93c)', shadow: '#c98a00', text: '#3b2400' },
  red: { bg: 'linear-gradient(180deg,#ff8080,#ff4d4d)', shadow: '#b81e1e', text: '#fff' },
  blue: { bg: 'linear-gradient(180deg,#7fdcff,#3ec7ff)', shadow: '#1679b8', text: '#04203a' },
  purple: { bg: 'linear-gradient(180deg,#c39bff,#9b5cff)', shadow: '#5b2cb8', text: '#fff' },
  dark: { bg: 'linear-gradient(180deg,#1d5a40,#0e3a28)', shadow: '#03170f', text: '#fff7e6' },
}

export function GameButton({
  tone = 'green',
  className = '',
  children,
  style,
  onClick,
  ...rest
}: { tone?: Tone } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const t = TONES[tone]
  return (
    <button
      {...rest}
      onClick={(e) => {
        sfx.ui()
        onClick?.(e)
      }}
      className={`btn-3d px-4 py-2.5 ${className}`}
      style={{ background: t.bg, color: t.text, ['--btn-shadow' as string]: t.shadow, ...style }}
    >
      {children}
    </button>
  )
}

export function Coin({ size = 18 }: { size?: number }) {
  return <Icon name="coin" size={size} className="inline-block shrink-0" />
}

export function CoinAmount({ n, size = 18, className = '' }: { n: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Coin size={size} />
      <span>{fmt(n)}</span>
    </span>
  )
}

export function ProgressBar({ pct, color = '#ffc93c', height = 14, className = '' }: { pct: number; color?: string; height?: number; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-full border-2 border-[#042016] bg-black/40 ${className}`} style={{ height }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: `linear-gradient(180deg, ${color}, ${color}cc)`, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.4)' }}
        animate={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      />
    </div>
  )
}

export function SectionTitle({ icon, children, right }: { icon?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-outline flex items-center gap-2 text-2xl text-white">
        {icon && <Icon name={icon} size={28} />}
        {children}
      </h2>
      {right}
    </div>
  )
}

/** Bottom-sheet style modal used for every menu. */
export function Sheet({ open, onClose, title, icon, children }: { open: boolean; onClose: () => void; title: string; icon?: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="panel relative z-10 mx-auto flex max-h-[88vh] w-full max-w-[480px] flex-col rounded-b-none p-4 pb-6 sm:rounded-b-[22px]"
            initial={{ y: 80, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-outline flex items-center gap-2 text-2xl">
                {icon && <Icon name={icon} size={28} />}
                {title}
              </h3>
              <button onClick={onClose} className="btn-3d grid h-10 w-10 place-items-center bg-[#ff4d4d] [--btn-shadow:#b81e1e]" aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="scroll-area -mx-1 px-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toasts() {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismiss)
  const setScreen = useUi((s) => s.setScreen)
  const colors = { alert: '#ff4d4d', success: '#00a859', info: '#3ec7ff', error: '#ff9f1c' }
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] mx-auto flex max-w-[480px] flex-col gap-2 px-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ x: 300, opacity: 0 }}
            onClick={() => {
              dismiss(t.id)
              if (t.kind === 'alert') setScreen('ranks')
            }}
            className="panel pointer-events-auto flex items-center gap-3 p-3 text-left"
            style={{ borderColor: colors[t.kind], boxShadow: `0 0 0 2px #042016, 0 8px 24px ${colors[t.kind]}55` }}
          >
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl ${t.kind === 'alert' ? 'pulse-ring' : ''}`} style={{ background: colors[t.kind] }}>
              {t.icon && t.icon.length <= 3 ? t.icon : <Icon name={t.icon ?? 'bell'} size={26} />}
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg leading-tight">{t.title}</div>
              {t.body && <div className="text-sm font-semibold text-white/80">{t.body}</div>}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Hud() {
  const coins = useGame((s) => s.coins)
  const profile = useGame((s) => s.profile)
  const totalEarned = useGame((s) => s.totalEarned)
  const open = useUi((s) => s.open)
  const unread = useUnreadAlerts()
  const level = Math.max(1, Math.floor(Math.log10(totalEarned + 10) * 3 - 2))

  return (
    <header className="relative z-20 flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),10px)] pb-2">
      <button onClick={() => open('profile')} className="chip flex items-center gap-2 py-1 pr-3 pl-1" aria-label="Profile">
        <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#042016] bg-[#ffc93c] text-xl">{profile?.avatar ?? '😎'}</span>
        <span className="flex flex-col items-start leading-none">
          <span className="max-w-[90px] truncate text-sm font-extrabold">{profile?.name ?? 'Player'}</span>
          <span className="text-[11px] font-bold text-[#ffc93c]">LVL {level}</span>
        </span>
      </button>

      <motion.div key={Math.floor(coins / 1000)} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="chip font-display flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xl">
        <Coin size={24} />
        <span className="text-outline-sm tabular-nums">{fmt(coins)}</span>
      </motion.div>

      <button onClick={() => open('inbox')} className="chip relative grid h-11 w-11 place-items-center" aria-label="Alerts">
        <Icon name="bell" size={24} className={unread ? 'wobble' : ''} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#042016] bg-[#ff4d4d] px-1 text-[11px] font-black">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      <button onClick={() => open('menu')} className="chip grid h-11 w-11 place-items-center" aria-label="Menu">
        <Icon name="menu" size={22} />
      </button>
    </header>
  )
}

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: 'shop', label: 'Boost', icon: 'shop' },
  { id: 'characters', label: 'Cast', icon: 'people' },
  { id: 'tap', label: 'Tap', icon: 'tap' },
  { id: 'battle', label: 'Battle', icon: 'battle' },
  { id: 'ranks', label: 'Ranks', icon: 'trophy' },
]

export function BottomNav() {
  const screen = useUi((s) => s.screen)
  const setScreen = useUi((s) => s.setScreen)
  const unread = useUnreadAlerts()
  return (
    <nav className="relative z-20 mx-3 mb-[max(env(safe-area-inset-bottom),10px)] grid grid-cols-5 gap-1 rounded-[24px] border-[3px] border-[#042016] bg-[#06301f]/95 p-1.5 shadow-[0_-4px_24px_rgba(0,0,0,.4)]">
      {NAV.map((n) => {
        const active = n.id === screen
        const center = n.id === 'tap'
        return (
          <button
            key={n.id}
            onClick={() => {
              sfx.ui()
              setScreen(n.id)
            }}
            className={`relative flex flex-col items-center justify-center rounded-[18px] py-1.5 transition-colors ${active ? 'bg-[#00a859]' : 'hover:bg-white/5'}`}
            style={active ? { boxShadow: 'inset 0 -4px 0 #006b3a, inset 0 2px 0 rgba(255,255,255,.3)' } : undefined}
          >
            <motion.div animate={{ y: active ? -2 : 0, scale: active ? 1.15 : 1 }}>
              <Icon name={n.icon} size={center ? 30 : 26} />
            </motion.div>
            <span className={`font-display text-[12px] tracking-wide ${active ? 'text-white' : 'text-white/60'}`}>{n.label}</span>
            {n.id === 'ranks' && unread > 0 && <span className="absolute top-1 right-3 h-3 w-3 rounded-full border-2 border-[#042016] bg-[#ff4d4d]" />}
          </button>
        )
      })}
    </nav>
  )
}
