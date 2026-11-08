import { motion } from 'motion/react'
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Politician } from '../components/Politician'
import { CoinAmount, GameButton, SectionTitle } from '../components/ui'
import { sfx } from '../game/audio'
import { CHARACTERS } from '../game/characters'
import { fmt } from '../game/format'
import { STAGES, stageFor } from '../game/progression'
import { useGame } from '../game/store'
import { useUi } from '../game/ui'

export default function CharactersScreen() {
  const chars = useGame((s) => s.chars)
  const selected = useGame((s) => s.selected)
  const coins = useGame((s) => s.coins)
  const unlock = useGame((s) => s.unlockCharacter)
  const select = useGame((s) => s.selectCharacter)
  const toast = useUi((s) => s.toast)
  const setScreen = useUi((s) => s.setScreen)
  const [preview, setPreview] = useState(0)

  return (
    <div className="scroll-area h-full px-3 pb-4">
      <SectionTitle icon="people" right={<span className="chip px-3 py-1 text-xs font-black">{CHARACTERS.filter((c) => !c.comingSoon).length} politicians</span>}>
        The Cast
      </SectionTitle>
      <p className="-mt-2 mb-3 text-xs font-semibold text-white/60">All characters are fictional caricatures. New aspirants join the race regularly.</p>

      {/* stage preview strip */}
      <div className="panel mb-3 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-lg">Transformation preview</span>
          <span className="text-xs font-bold text-white/60">tap a stage</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {STAGES.map((s) => (
            <button
              key={s.index}
              onClick={() => setPreview(s.index)}
              className={`rounded-xl border-2 p-0.5 transition ${preview === s.index ? 'border-[#ffc93c] bg-white/10' : 'border-transparent'}`}
            >
              <Politician def={CHARACTERS.find((c) => c.id === selected)!} stage={s.index} className="h-14 w-full" />
              <div className="font-display text-[10px] leading-tight" style={{ color: s.color }}>
                {s.index + 1}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-1 text-center text-sm font-black" style={{ color: STAGES[preview].color }}>
          {STAGES[preview].name} — <span className="font-semibold text-white/70">{STAGES[preview].tagline}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {CHARACTERS.map((c, i) => {
          const p = chars[c.id]
          const unlocked = !!p?.unlocked
          const isSel = c.id === selected
          const stage = p ? stageFor(p.wahala, p.term) : 0
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`panel relative flex flex-col items-center p-2 ${isSel ? 'ring-4 ring-[#ffc93c]' : ''}`}
            >
              {isSel && (
                <span className="font-display absolute top-2 left-2 z-10 rounded-md border-2 border-[#042016] bg-[#ffc93c] px-1.5 text-xs text-[#3b2400]">PLAYING</span>
              )}
              {unlocked && (
                <span className="absolute top-2 right-2 z-10 rounded-md bg-black/50 px-1.5 text-[11px] font-black text-[#7dffb8]">T{p.term}</span>
              )}
              <div className="relative h-36 w-full">
                <Politician def={c} stage={unlocked ? stage : 0} silhouette={!unlocked} className="h-full w-full" />
                {!unlocked && !c.comingSoon && <Icon name="lock" size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                {c.comingSoon && <div className="font-display text-outline absolute inset-0 grid place-items-center text-5xl">?</div>}
              </div>
              <div className="font-display mt-1 w-full truncate text-center text-base leading-tight">{c.name}</div>
              <div className="w-full truncate text-center text-[11px] font-bold text-white/60">{c.title}</div>
              {!c.comingSoon && <div className="mb-1.5 text-[11px] font-black text-[#ffc93c]">Coin bonus x{c.coinBonus}</div>}
              <p className="mb-2 line-clamp-2 min-h-[2.4em] text-center text-[11px] leading-tight text-white/55">{c.bio}</p>

              {c.comingSoon ? (
                <GameButton tone="dark" disabled className="w-full text-sm">
                  Coming soon
                </GameButton>
              ) : unlocked ? (
                <GameButton
                  tone={isSel ? 'dark' : 'green'}
                  disabled={isSel}
                  className="w-full text-sm"
                  onClick={() => {
                    select(c.id)
                    setScreen('tap')
                  }}
                >
                  {isSel ? 'Selected' : 'Play'}
                </GameButton>
              ) : (
                <GameButton
                  tone={coins >= c.unlockCost ? 'gold' : 'dark'}
                  disabled={coins < c.unlockCost}
                  className="w-full text-sm"
                  onClick={() => {
                    if (unlock(c.id)) {
                      sfx.stageUp()
                      useGame.getState().burst('win')
                      toast({ kind: 'success', title: `${c.name} has joined!`, body: c.bio, icon: 'people' })
                    }
                  }}
                >
                  <CoinAmount n={c.unlockCost} size={16} />
                </GameButton>
              )}
              {unlocked && p.meltdowns > 0 && <div className="mt-1 text-[10px] font-bold text-white/50">{fmt(p.meltdowns)} meltdowns</div>}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
