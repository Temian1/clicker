import { api } from '../api'
import type { PlayerSnapshot } from '../api'
import { sfx } from './audio'
import { vibrate } from './format'
import { useGame } from './store'
import { useAlerts, useUi } from './ui'

const PERIOD_LABEL = { daily: 'Daily', weekly: 'Weekly', all: 'All-time' } as const

// rolling samples of total coins earned → recent coins/sec
const samples: { t: number; v: number }[] = []

function recentRate() {
  const now = Date.now()
  samples.push({ t: now, v: useGame.getState().totalEarned })
  while (samples.length > 2 && now - samples[0].t > 60_000) samples.shift()
  const a = samples[0]
  const b = samples[samples.length - 1]
  const dt = (b.t - a.t) / 1000
  return dt > 1 ? (b.v - a.v) / dt : 0
}

let lastRate = 0

export function snapshot(): PlayerSnapshot {
  const s = useGame.getState()
  return {
    id: s.profile?.id ?? 'me',
    name: s.profile?.name ?? 'You',
    avatar: s.profile?.avatar ?? '😎',
    scores: { daily: Math.floor(s.period.daily), weekly: Math.floor(s.period.weekly), all: Math.floor(s.totalEarned) },
    rate: lastRate,
    pending: s.pendingSync,
    characterId: s.selected,
    bestCombo: s.best.combo,
  }
}

let running = false
let lastToastAt = 0

/** Heartbeat: push progress, receive "X overtook you" alerts, toast them. */
export function startSync(intervalMs = 4000) {
  if (running) return () => {}
  running = true
  let busy = false

  const beat = async () => {
    if (busy || document.hidden) return
    busy = true
    let pending = { coins: 0, taps: 0 }
    try {
      lastRate = recentRate()
      useGame.getState().ensureDay()
      pending = useGame.getState().takePendingSync()
      const res = await api.heartbeat({ ...snapshot(), pending })
      pending = { coins: 0, taps: 0 }

      if (res.overtakenBy.length) {
        useAlerts.getState().push(res.overtakenBy)
        const now = Date.now()
        if (now - lastToastAt > 6000) {
          lastToastAt = now
          const first = res.overtakenBy[0]
          const more = res.overtakenBy.length - 1
          useUi.getState().toast({
            kind: 'alert',
            icon: first.byAvatar,
            title: `${first.byName} just passed you!`,
            body: `You're now #${first.newRank} on ${PERIOD_LABEL[first.period]}${more > 0 ? ` (+${more} more)` : ''}. Tap back!`,
          })
          sfx.alert()
          if (useGame.getState().settings.haptics) vibrate([60, 40, 60])
        }
      } else if (res.youPassed.length && Date.now() - lastToastAt > 8000) {
        lastToastAt = Date.now()
        const p = res.youPassed[0]
        useUi.getState().toast({
          kind: 'success',
          icon: '🚀',
          title: `You passed ${p.name}!`,
          body: `Now #${p.newRank} on ${PERIOD_LABEL[p.period]}`,
        })
        sfx.coin()
      }
    } catch (e) {
      // put the unsent delta back so it goes with the next heartbeat
      useGame.setState((st) => ({ pendingSync: { coins: st.pendingSync.coins + pending.coins, taps: st.pendingSync.taps + pending.taps } }))
      console.warn('[sync] heartbeat failed', e)
    } finally {
      busy = false
    }
  }

  const id = window.setInterval(beat, intervalMs)
  void beat()
  return () => {
    window.clearInterval(id)
    running = false
  }
}
