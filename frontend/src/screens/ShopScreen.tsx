import { motion } from 'motion/react'
import { Icon } from '../components/Icon'
import { CoinAmount, GameButton, SectionTitle } from '../components/ui'
import { sfx } from '../game/audio'
import { UPGRADES, coinMultFor, livesFor, upgradeCost } from '../game/progression'
import { useGame } from '../game/store'
import { useUi } from '../game/ui'

export default function ShopScreen() {
  const coins = useGame((s) => s.coins)
  const upgrades = useGame((s) => s.upgrades)
  const buy = useGame((s) => s.buyUpgrade)
  const toast = useUi((s) => s.toast)

  return (
    <div className="scroll-area h-full px-3 pb-4">
      <SectionTitle icon="shop">Campaign Shop</SectionTitle>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat icon="mic" label="Coin bonus" value={`x${coinMultFor(upgrades.coinValue).toFixed(2)}`} />
        <Stat icon="star" label="Hearts" value={`${livesFor(upgrades.lives)}`} />
      </div>

      <div className="flex flex-col gap-2.5">
        {UPGRADES.map((u, i) => {
          const lvl = upgrades[u.id]
          const cost = upgradeCost(u, lvl)
          const maxed = lvl >= u.maxLevel
          const can = !maxed && coins >= cost
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="panel flex items-center gap-3 p-3"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-[3px] border-[#042016] bg-[#0b4a31]">
                <Icon name={u.icon} size={34} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display truncate text-lg">{u.name}</span>
                  <span className="rounded-md bg-black/40 px-1.5 text-xs font-black text-[#ffc93c]">Lv {lvl}</span>
                </div>
                <div className="text-xs font-semibold text-white/65">{u.description}</div>
                <div className="mt-0.5 text-xs font-black text-[#7dffb8]">
                  {u.effectLabel(lvl)} → {maxed ? 'MAX' : u.effectLabel(lvl + 1)}
                </div>
              </div>
              <GameButton
                tone={can ? 'gold' : 'dark'}
                disabled={!can}
                className="min-w-[92px] !px-2 text-base"
                onClick={() => {
                  if (buy(u.id)) {
                    sfx.buy()
                    toast({ kind: 'success', title: `${u.name} Lv ${lvl + 1}!`, icon: u.icon })
                  } else sfx.error()
                }}
              >
                {maxed ? 'MAX' : <CoinAmount n={cost} size={16} />}
              </GameButton>
            </motion.div>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs font-semibold text-white/50">Upgrades are expensive on purpose: play runs, finish daily challenges and level up politicians to afford them.</p>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="panel flex items-center gap-2 px-3 py-2">
      <Icon name={icon} size={28} />
      <div>
        <div className="text-[11px] font-bold tracking-wide text-white/60 uppercase">{label}</div>
        <div className="font-display text-xl leading-none">{value}</div>
      </div>
    </div>
  )
}
