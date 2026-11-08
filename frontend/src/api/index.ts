import { LaravelApi } from './laravelApi'
import { LocalApi } from './localApi'
import type { GameApi } from './types'

const url = import.meta.env.VITE_API_URL as string | undefined

/** Set VITE_API_URL=http://localhost:8000 to use the Laravel backend. */
export const api: GameApi = url ? new LaravelApi(url) : new LocalApi()

export type * from './types'
