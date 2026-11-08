import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OvertakeAlert } from './types'

export type Screen = 'tap' | 'shop' | 'characters' | 'battle' | 'ranks'
export type Modal = null | 'menu' | 'settings' | 'support' | 'profile' | 'daily' | 'howto' | 'share' | 'inbox'

export interface Toast {
  id: number
  kind: 'alert' | 'success' | 'info' | 'error'
  title: string
  body?: string
  icon?: string
}

interface UiState {
  screen: Screen
  modal: Modal
  toasts: Toast[]
  setScreen(s: Screen): void
  open(m: Modal): void
  close(): void
  toast(t: Omit<Toast, 'id'>): void
  dismiss(id: number): void
}

let tid = 0
export const useUi = create<UiState>()((set) => ({
  screen: 'tap',
  modal: null,
  toasts: [],
  setScreen: (screen) => set({ screen }),
  open: (modal) => set({ modal }),
  close: () => set({ modal: null }),
  toast: (t) => {
    const id = ++tid
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), t.kind === 'alert' ? 5000 : 3200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

interface AlertState {
  alerts: OvertakeAlert[]
  push(a: OvertakeAlert[]): void
  markAllRead(): void
  clear(): void
}

export const useAlerts = create<AlertState>()(
  persist(
    (set) => ({
      alerts: [],
      push: (a) => set((s) => ({ alerts: [...a, ...s.alerts].slice(0, 40) })),
      markAllRead: () => set((s) => ({ alerts: s.alerts.map((x) => ({ ...x, read: true })) })),
      clear: () => set({ alerts: [] }),
    }),
    { name: 'ttp-alerts' },
  ),
)

export const useUnreadAlerts = () => useAlerts((s) => s.alerts.filter((a) => !a.read).length)
