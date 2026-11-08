import { forwardRef, memo, useState } from 'react'
import type { CharacterDef } from '../game/types'

/**
 * Renders a cast member from their generated sprite sheet:
 * a 3×2 atlas with one pose per stage
 *   0 confident · 1 surprised · 2 sweating · 3 complaining · 4 crying · 5 meltdown
 * Characters without a sheet (or whose image fails) show a "?" placeholder.
 */
interface Props {
  def: CharacterDef
  stage: number
  hit?: boolean
  silhouette?: boolean
  className?: string
}

export const Politician = memo(
  forwardRef<SVGSVGElement, Props>(function Politician({ def, stage, hit = false, silhouette = false, className }, ref) {
    const sheet = def.look.spriteSheet
    const [failed, setFailed] = useState<string | null>(null)
    const frame = Math.max(0, Math.min(5, Math.floor(stage)))
    const showSprite = !!sheet && failed !== sheet && !def.comingSoon

    return (
      <svg
        ref={ref}
        viewBox="0 0 300 380"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${def.name}, stage ${frame + 1}`}
        style={silhouette ? { filter: 'brightness(0) opacity(0.55)' } : undefined}
      >
        {showSprite ? (
          <g className={frame === 5 ? 'shake' : undefined}>
            <g style={hit ? { filter: 'brightness(1.35) saturate(1.2)' } : undefined}>
              {/* nested viewport crops the atlas down to one 1/3 × 1/2 cell */}
              <svg x={-25} y={20} width={350} height={350} viewBox={`${(frame % 3) * 400} ${Math.floor(frame / 3) * 400} 400 400`} preserveAspectRatio="xMidYMid meet">
                <image href={sheet} width={1200} height={800} preserveAspectRatio="none" onError={() => setFailed(sheet!)} />
              </svg>
            </g>
          </g>
        ) : (
          <g>
            <circle cx={150} cy={130} r={62} fill="#1d3b2e" stroke="#042016" strokeWidth={5} />
            <path d="M60 360 Q60 220 150 205 Q240 220 240 360 Z" fill="#1d3b2e" stroke="#042016" strokeWidth={5} />
            <text x={150} y={155} textAnchor="middle" fontFamily="Lilita One, sans-serif" fontSize={80} fill="#7dffb8">
              ?
            </text>
          </g>
        )}
      </svg>
    )
  }),
)
