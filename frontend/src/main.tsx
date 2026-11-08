import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// dev-only handle for debugging / automated QA (stripped from production builds)
if (import.meta.env.DEV) {
  void import('./game/store').then(({ useGame }) => {
    ;(window as unknown as { __game: typeof useGame }).__game = useGame
  })
}
