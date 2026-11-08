import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { Politician } from '../components/Politician'
import { GameButton } from '../components/ui'
import { CHARACTERS } from '../game/characters'
import { GAME_TAGLINE } from '../game/assets'
import { useGame } from '../game/store'
import { AVATARS } from './Modals'

export default function TitleScreen({ onPlay }: { onPlay: () => void }) {
  const profile = useGame((s) => s.profile)
  const setProfile = useGame((s) => s.setProfile)
  const [stage, setStage] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [ci, setCi] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => {
      setStage((s) => {
        if (s >= 5) {
          setCi((c) => (c + 1) % CHARACTERS.filter((candidate) => !candidate.comingSoon).length)
          return 0
        }
        return s + 1
      })
    }, 900)
    return () => window.clearInterval(t)
  }, [])

  const isNew = !profile

  return (
    <div className="relative z-10 mx-auto flex h-full max-w-[480px] flex-col items-center justify-between px-5 py-[max(env(safe-area-inset-top),20px)]">
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 text-center">
        <div className="mb-1 inline-flex overflow-hidden rounded-md border-2 border-[#042016]">
          <span className="h-4 w-5 bg-[#00a859]" />
          <span className="h-4 w-5 bg-white" />
          <span className="h-4 w-5 bg-[#00a859]" />
        </div>
        <h1 className="font-display text-outline text-[56px] leading-[0.9] text-[#ffc93c]">
          RALLY
          <br />
          <span className="text-white">WAHALA</span>
        </h1>
        <p className="font-display text-outline-sm mt-2 text-lg text-[#7dffb8]">{GAME_TAGLINE}</p>
      </motion.div>

      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }} className="relative h-[38vh] w-full max-w-[300px]">
        <Politician def={CHARACTERS[ci]} stage={stage} className="h-full w-full" />
      </motion.div>

      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full">
        {isNew ? (
          <div className="panel mb-3 p-3">
            <div className="font-display mb-2 text-lg">Choose your campaign name</div>
            <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
              {AVATARS.slice(0, 10).map((a) => (
                <button key={a} onClick={() => setAvatar(a)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] text-xl ${a === avatar ? 'border-[#ffc93c] bg-[#ffc93c]/30' : 'border-[#042016] bg-black/30'}`}>
                  {a}
                </button>
              ))}
            </div>
            <input
              value={name}
              maxLength={18}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oga Voter"
              className="w-full rounded-2xl border-[3px] border-[#042016] bg-black/40 px-3 py-2.5 font-bold outline-none focus:border-[#ffc93c]"
            />
          </div>
        ) : (
          <div className="mb-3 text-center font-bold text-white/80">
            Welcome back, {profile.avatar} <span className="text-[#ffc93c]">{profile.name}</span>!
          </div>
        )}
        <GameButton
          tone="gold"
          className="shine w-full py-4 text-3xl"
          onClick={() => {
            if (isNew) setProfile(name || 'Oga Voter', avatar)
            onPlay()
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Icon name="tap" size={34} /> PLAY
          </span>
        </GameButton>
        <p className="mt-3 text-center text-[11px] font-semibold text-white/45">Cartoon political satire. Invented dialogue. No endorsement or real-world rankings.</p>
      </motion.div>
    </div>
  )
}
