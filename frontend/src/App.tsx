import { AnimatePresence, motion } from 'motion/react'
import { Suspense, lazy, useEffect, useState } from 'react'
import { api } from './api'
import { CoinAmount, GameButton, BottomNav, Hud, Toasts } from './components/ui'
import { setAudioPrefs, sfx, unlockAudio } from './game/audio'
import { fmt, fmtTime } from './game/format'
import { registerCharacters } from './game/characters'
import { useGame } from './game/store'
import { startSync } from './game/sync'
import { useUi } from './game/ui'
import BattleScreen from './screens/BattleScreen'
import CharactersScreen from './screens/CharactersScreen'
import Modals from './screens/Modals'
import RanksScreen from './screens/RanksScreen'
import ShopScreen from './screens/ShopScreen'
import TapScreen from './screens/TapScreen'
import TitleScreen from './screens/TitleScreen'

const Scene3D = lazy(() => import('./components/Scene3D'))

export default function App() {
  const [playing, setPlaying] = useState(false)
  const [offline, setOffline] = useState<{ coins: number; ms: number } | null>(null)
  const screen = useUi((s) => s.screen)
  const settings = useGame((s) => s.settings)

  useEffect(() => setAudioPrefs(settings), [settings])

  // game loop: energy regen + Hype Man income
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const t = window.setInterval(() => {
      const now = performance.now()
      const s = useGame.getState()
      if (Date.now() - s.lastSeen > 60_000) {
        // tab was frozen / backgrounded for a while → offline earnings (capped at 3h)
        const r = s.applyOffline()
        if (r) setOffline(r)
      } else {
        s.tick(Math.min(now - last, 1000))
      }
      // economy wahala events (only start while you're on the tap screen, so you can protest)
      if (useUi.getState().screen === 'tap' && !useUi.getState().modal && s.maybeStartEvent()) sfx.alert()
      const hit = s.expireEvent()
      if (hit) {
        if (hit.def.kind === 'bonus') {
          useUi.getState().toast({ kind: 'info', icon: hit.def.icon, title: 'Palliative don finish 😩', body: 'You no tap fast enough. Next time!' })
        } else {
          sfx.error()
          const body = hit.def.kind === 'drain' ? `You lost ${fmt(hit.lost)} coins` : hit.def.body
          useUi.getState().toast({ kind: 'error', icon: hit.def.icon, title: hit.def.title, body })
        }
      }
      last = now
    }, 200)
    return () => window.clearInterval(t)
  }, [playing])

  // backend heartbeat (leaderboard sync + overtake alerts)
  useEffect(() => {
    if (!playing) return
    const p = useGame.getState().profile
    let stop: (() => void) | null = null
    let cancelled = false
    void (async () => {
      try {
        if (p) await api.login(p)
        const roster = await api.characters()
        if (roster) {
          registerCharacters(roster)
          useGame.getState().ensureDay() // adds progress slots for new characters
          useGame.setState({}) // re-render with the new roster
        }
      } catch (e) {
        console.warn('[api] login failed — will keep retrying via heartbeat', e)
      }
      // start syncing only once authenticated, so the first heartbeat isn't a 401
      if (!cancelled) stop = startSync()
    })()
    return () => {
      cancelled = true
      stop?.()
    }
  }, [playing])

  function play() {
    unlockAudio()
    sfx.whistle()
    useGame.getState().ensureDay()
    const r = useGame.getState().applyOffline()
    if (r) setOffline(r)
    setPlaying(true)
  }

  return (
    <div className="relative h-full overflow-hidden">
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      {!playing ? (
        <TitleScreen onPlay={play} />
      ) : (
        <div className="relative z-10 mx-auto flex h-full max-w-[480px] flex-col">
          <Hud />
          <main className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16 }}
              >
                {screen === 'tap' && <TapScreen />}
                {screen === 'shop' && <ShopScreen />}
                {screen === 'characters' && <CharactersScreen />}
                {screen === 'battle' && <BattleScreen />}
                {screen === 'ranks' && <RanksScreen />}
              </motion.div>
            </AnimatePresence>
          </main>
          <BottomNav />
          <Modals />
        </div>
      )}
      <Toasts />

      <AnimatePresence>
        {offline && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="panel w-full max-w-sm p-5 text-center">
              <div className="font-display text-outline text-3xl text-[#ffc93c]">Welcome back!</div>
              <p className="mt-2 font-bold text-white/80">Your Hype Man was campaigning for {fmtTime(offline.ms)} while you were away.</p>
              <div className="font-display my-3 text-3xl">
                +<CoinAmount n={offline.coins} size={30} />
              </div>
              <GameButton
                tone="gold"
                className="w-full text-xl"
                onClick={() => {
                  sfx.coin()
                  setOffline(null)
                }}
              >
                Collect
              </GameButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
