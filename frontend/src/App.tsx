import { AnimatePresence, motion } from 'motion/react'
import { Suspense, lazy, useEffect, useState } from 'react'
import { api } from './api'
import { BottomNav, Hud, Toasts } from './components/ui'
import { preloadAssets } from './game/assets'
import { setAudioPrefs, sfx, unlockAudio } from './game/audio'
import { registerCharacters } from './game/characters'
import { useGame } from './game/store'
import { startSync } from './game/sync'
import { useUi } from './game/ui'
import CatcherGame from './games/CatcherGame'
import WhackGame from './games/WhackGame'
import CharactersScreen from './screens/CharactersScreen'
import Modals from './screens/Modals'
import PlayScreen from './screens/PlayScreen'
import RanksScreen from './screens/RanksScreen'
import ShopScreen from './screens/ShopScreen'
import TitleScreen from './screens/TitleScreen'

const Scene3D = lazy(() => import('./components/Scene3D'))

export default function App() {
  const [started, setStarted] = useState(false)
  const screen = useUi((s) => s.screen)
  const game = useUi((s) => s.game)
  const endGame = useUi((s) => s.endGame)
  const settings = useGame((s) => s.settings)

  useEffect(() => setAudioPrefs(settings), [settings])
  useEffect(() => preloadAssets(), [])

  // backend heartbeat (leaderboard sync, run uploads, overtake alerts)
  useEffect(() => {
    if (!started) return
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
  }, [started])

  function start() {
    unlockAudio()
    sfx.whistle()
    useGame.getState().ensureDay()
    setStarted(true)
  }

  return (
    <div className="relative h-full overflow-hidden">
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      {!started ? (
        <TitleScreen onPlay={start} />
      ) : game ? (
        <div className="relative z-10 mx-auto h-full max-w-[480px]">
          {game === 'catcher' ? <CatcherGame onExit={endGame} /> : <WhackGame onExit={endGame} />}
        </div>
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
                {screen === 'play' && <PlayScreen />}
                {screen === 'shop' && <ShopScreen />}
                {screen === 'characters' && <CharactersScreen />}
                {screen === 'ranks' && <RanksScreen />}
              </motion.div>
            </AnimatePresence>
          </main>
          <BottomNav />
          <Modals />
        </div>
      )}
      <Toasts />
    </div>
  )
}
