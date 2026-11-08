import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { api, type LeaderboardResponse } from '../api'
import { Icon } from '../components/Icon'
import { Coin, SectionTitle } from '../components/ui'
import { fmt } from '../game/format'
import { useGame } from '../game/store'
import { snapshot } from '../game/sync'
import type { Board, Period } from '../game/types'
import { useAlerts } from '../game/ui'

const BOARDS: { id: Board; label: string; icon: string }[] = [
  { id: 'coins', label: 'Coins', icon: 'coin' },
  { id: 'catcher', label: 'Catcher', icon: 'bag' },
  { id: 'whack', label: 'Whack', icon: 'podium' },
]

const TABS: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'all', label: 'All-time' },
]

export default function RanksScreen() {
  const [board, setBoard] = useState<Board>('coins')
  const [period, setPeriod] = useState<Period>('daily')
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const best = useGame((s) => s.best)
  const totalRuns = useGame((s) => s.totalRuns)
  const level = useGame((s) => s.level)
  const alerts = useAlerts((s) => s.alerts)
  const markAllRead = useAlerts((s) => s.markAllRead)

  useEffect(() => {
    markAllRead()
  }, [markAllRead])

  useEffect(() => {
    let alive = true
    const load = () =>
      api
        .leaderboard(board, period, snapshot())
        .then((d) => alive && setData(d))
        .catch(() => alive && setData(null))
    void load()
    const t = window.setInterval(load, 3000)
    return () => {
      alive = false
      window.clearInterval(t)
    }
  }, [board, period])

  return (
    <div className="flex h-full flex-col px-3">
      <SectionTitle icon="trophy" right={<span className="chip px-2 py-1 text-[11px] font-black">{api.mode === 'local' ? 'OFFLINE SIM' : 'LIVE'}</span>}>
        Leaderboard
      </SectionTitle>

      {/* personal highscores */}
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        <HS icon="bag" label="Catcher" v={fmt(best.catcher)} />
        <HS icon="podium" label="Whack" v={fmt(best.whack)} />
        <HS icon="fire" label="Combo" v={fmt(best.combo)} />
        <HS icon="trophy" label={`Lvl · ${totalRuns} runs`} v={`${level}`} />
      </div>

      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBoard(b.id)}
            className={`font-display flex items-center justify-center gap-1 rounded-xl border-2 py-1.5 text-base ${board === b.id ? 'border-[#ffc93c] bg-[#ffc93c]/20' : 'border-[#042016] bg-black/30 text-white/70'}`}
          >
            <Icon name={b.icon} size={18} /> {b.label}
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-2xl border-[3px] border-[#042016] bg-black/30 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setPeriod(t.id)}
            className={`font-display rounded-xl py-1.5 text-base transition ${period === t.id ? 'bg-[#ffc93c] text-[#3b2400] shadow-[inset_0_-3px_0_#c98a00]' : 'text-white/70'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data && <Podium entries={data.entries.slice(0, 3)} />}

      <div className="scroll-area -mx-1 min-h-0 flex-1 px-1 pb-2">
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {data?.entries.slice(3).map((e) => (
              <motion.div key={e.id} layout transition={{ type: 'spring', stiffness: 500, damping: 40 }}>
                <Row e={e} coins={board === 'coins'} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {alerts.length > 0 && (
          <div className="mt-4">
            <div className="font-display mb-1 flex items-center gap-1 text-lg">
              <Icon name="bell" size={20} /> Recent overtakes
            </div>
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="mb-1 flex items-center gap-2 rounded-xl bg-[#ff4d4d]/15 px-3 py-1.5 text-sm font-bold">
                <span className="text-lg">{a.byAvatar}</span>
                <span className="flex-1 truncate">
                  {a.byName} passed you · {a.period} #{a.newRank}
                </span>
                <span className="text-[11px] text-white/50">{timeAgo(a.at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* sticky "me" row — always visible */}
      {data && (
        <div className="mb-2">
          <Row e={data.me} coins={board === 'coins'} />
        </div>
      )}
    </div>
  )
}

function HS({ icon, label, v }: { icon: string; label: string; v: string }) {
  return (
    <div className="panel flex flex-col items-center px-1 py-1.5">
      <Icon name={icon} size={20} />
      <div className="font-display text-base leading-tight">{v}</div>
      <div className="text-[10px] font-bold text-white/55 uppercase">{label}</div>
    </div>
  )
}

function Row({ e, coins }: { e: LeaderboardResponse['me']; coins: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 ${e.isMe ? 'border-[#ffc93c] bg-[#ffc93c]/20' : 'border-[#042016] bg-black/30'}`}>
      <span className="font-display w-9 text-center text-lg text-white/80">#{e.rank}</span>
      <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#042016] bg-[#0b4a31] text-lg">{e.avatar}</span>
      <span className="flex-1 truncate font-extrabold">{e.isMe ? `${e.name} (You)` : e.name}</span>
      <span className="font-display flex items-center gap-1 tabular-nums">
        {coins ? <Coin size={16} /> : <span className="text-xs text-white/50">pts</span>}
        {fmt(e.score)}
      </span>
    </div>
  )
}

function Podium({ entries }: { entries: LeaderboardResponse['entries'] }) {
  const order = [entries[1], entries[0], entries[2]]
  const h = [70, 96, 54]
  const colors = ['#c0c8d0', '#ffc93c', '#d7884a']
  return (
    <div className="mb-3 grid grid-cols-3 items-end gap-2">
      {order.map((e, i) =>
        e ? (
          <motion.div key={e.id} layout className="flex flex-col items-center">
            {i === 1 && <Icon name="crown" size={28} />}
            <span className={`grid h-12 w-12 place-items-center rounded-full border-[3px] text-2xl ${e.isMe ? 'border-[#ffc93c]' : 'border-[#042016]'}`} style={{ background: colors[i] }}>
              {e.avatar}
            </span>
            <span className="mt-0.5 w-full truncate text-center text-xs font-black">{e.isMe ? 'You' : e.name}</span>
            <span className="font-display text-sm text-[#ffc93c]">{fmt(e.score)}</span>
            <div
              className="font-display text-outline-sm mt-1 grid w-full place-items-center rounded-t-xl border-[3px] border-b-0 border-[#042016] text-3xl"
              style={{ height: h[i], background: `linear-gradient(180deg, ${colors[i]}, ${colors[i]}88)` }}
            >
              {e.rank}
            </div>
          </motion.div>
        ) : (
          <div key={i} />
        ),
      )}
    </div>
  )
}

export function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
