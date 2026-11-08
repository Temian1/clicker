import { forwardRef, memo, useId } from 'react'
import type { Accessory, CharacterDef, Headwear } from '../game/types'

/**
 * Layered, data-driven cartoon politician.
 * Every part (robe, pattern, wrinkles, head, brows, eyes, mouth, glasses,
 * headwear, sweat, tears, props) is its own layer that reacts to `stage` (0-5)
 * and the momentary `hit` flash, so no static images are needed.
 */
interface Props {
  def: CharacterDef
  stage: number
  hit?: boolean
  silhouette?: boolean
  className?: string
}

const OUT = '#2a1608'
const CX = 150

export const Politician = memo(
  forwardRef<SVGSVGElement, Props>(function Politician({ def, stage, hit = false, silhouette = false, className }, ref) {
    const uid = useId().replace(/:/g, '')
    const L = def.look
    const W = L.build === 'stout' ? 135 : L.build === 'round' ? 124 : 108
    const headRx = L.build === 'round' ? 64 : L.build === 'stout' ? 66 : 58
    const hasGlasses = L.accessories.includes('sunglasses')
    const lean = [0, 0, -2, 3, -4, 0][stage]

    return (
      <svg
        ref={ref}
        viewBox="0 0 300 380"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        style={silhouette ? { filter: 'brightness(0) opacity(0.55)' } : undefined}
        role="img"
        aria-label={`${def.name}, stage ${stage}`}
      >
        <defs>
          <clipPath id={`robe-${uid}`}>
            <path d={robePath(W)} />
          </clipPath>
          <radialGradient id={`face-${uid}`} cx="45%" cy="38%" r="70%">
            <stop offset="0%" stopColor={lighten(L.skin, 18)} />
            <stop offset="70%" stopColor={L.skin} />
            <stop offset="100%" stopColor={L.skinShade} />
          </radialGradient>
          <linearGradient id={`robeg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lighten(L.robe, 12)} />
            <stop offset="100%" stopColor={darken(L.robe, 14)} />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx={CX} cy={366} rx={W * 0.8} ry={10} fill="#000" opacity={0.35} />

        <g transform={`rotate(${lean} ${CX} 360)`}>
          {/* shoes */}
          <ellipse cx={CX - 28} cy={358} rx={24} ry={10} fill="#3b2412" stroke={OUT} strokeWidth={3} />
          <ellipse cx={CX + 28} cy={358} rx={24} ry={10} fill="#3b2412" stroke={OUT} strokeWidth={3} />

          {/* ===== ROBE / AGBADA ===== */}
          <path d={robePath(W)} fill={`url(#robeg-${uid})`} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
          <g clipPath={`url(#robe-${uid})`}>
            <RobePattern kind={L.robePattern} color={L.robeTrim} W={W} />
            {/* inner buba */}
            <path d={`M${CX - 30} 205 L${CX - 38} 360 L${CX + 38} 360 L${CX + 30} 205 Z`} fill={darken(L.robe, 8)} opacity={0.55} />
            {/* sleeve folds */}
            <path d={`M${CX - W + 30} 300 Q${CX - 60} 270 ${CX - 50} 225`} stroke={darken(L.robe, 25)} strokeWidth={3} fill="none" opacity={0.5} />
            <path d={`M${CX + W - 30} 300 Q${CX + 60} 270 ${CX + 50} 225`} stroke={darken(L.robe, 25)} strokeWidth={3} fill="none" opacity={0.5} />
            {stage >= 3 && <Wrinkles stage={stage} W={W} color={darken(L.robe, 40)} />}
          </g>
          {/* neckline embroidery */}
          <path d={`M${CX - 34} 206 Q${CX} 262 ${CX + 34} 206`} fill="none" stroke={L.robeTrim} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${CX - 34} 206 Q${CX} 262 ${CX + 34} 206`} fill="none" stroke={OUT} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" />
          {stage >= 5 && (
            <g>
              {/* patch on the agbada */}
              <rect x={CX + 30} y={280} width={30} height={26} fill="#d7ccc8" stroke={OUT} strokeWidth={2.5} transform={`rotate(12 ${CX + 45} 293)`} />
              <path d={`M${CX + 33} 284 l24 18 M${CX + 56} 282 l-22 20`} stroke={OUT} strokeWidth={1.5} strokeDasharray="3 3" />
            </g>
          )}

          {/* beads */}
          {L.accessories.includes('beads') && <Beads />}

          {/* hands */}
          <Hand x={CX - W + 26} y={312} skin={L.skin} />
          <Hand x={CX + W - 26} y={312} skin={L.skin} />
          <Props accessories={L.accessories} W={W} stage={stage} />

          {/* ===== HEAD ===== */}
          <g className={stage === 5 ? 'shake' : undefined}>
            <rect x={CX - 20} y={180} width={40} height={32} rx={10} fill={L.skinShade} stroke={OUT} strokeWidth={3} />
            {/* ears */}
            <ellipse cx={CX - headRx + 2} cy={140} rx={11} ry={16} fill={L.skin} stroke={OUT} strokeWidth={3.5} />
            <ellipse cx={CX + headRx - 2} cy={140} rx={11} ry={16} fill={L.skin} stroke={OUT} strokeWidth={3.5} />
            <ellipse cx={CX} cy={134} rx={headRx} ry={68} fill={`url(#face-${uid})`} stroke={OUT} strokeWidth={4} />

            {/* blush / stress colour */}
            <ellipse cx={CX - 38} cy={162} rx={13} ry={7} fill="#ff6b6b" opacity={[0.15, 0.3, 0.35, 0.5, 0.55, 0.7][stage]} />
            <ellipse cx={CX + 38} cy={162} rx={13} ry={7} fill="#ff6b6b" opacity={[0.15, 0.3, 0.35, 0.5, 0.55, 0.7][stage]} />
            {stage >= 3 && <StressMarks />}

            <FacialHair kind={L.facialHair} color={darken(L.skinShade, 45)} stage={stage} />

            {/* nose */}
            <path d={`M${CX - 9} 140 Q${CX - 13} 156 ${CX} 158 Q${CX + 13} 156 ${CX + 9} 140`} fill={L.skinShade} stroke={OUT} strokeWidth={2.5} strokeLinejoin="round" />

            <Brows stage={stage} hit={hit} />
            <Eyes stage={stage} hit={hit} covered={hasGlasses && stage <= 1} />
            <Mouth stage={stage} hit={hit} lipstick={L.lipstick} />
            {hasGlasses && <Sunglasses stage={stage} />}

            {stage >= 2 && <Sweat stage={stage} headRx={headRx} />}
            {stage >= 4 && <Tears />}

            {/* ===== HEADWEAR ===== */}
            <g className={stage === 5 ? 'cap-fly' : stage === 1 ? 'shake' : undefined}>
              <g transform={`rotate(${[0, 0, -9, -16, -24, -10][stage]} ${CX} 80) translate(0 ${stage === 5 ? -28 : stage >= 3 ? 4 : 0})`}>
                <HeadwearShape kind={L.headwear} cap={L.cap} trim={L.capTrim} />
              </g>
            </g>
            {stage === 5 && <Steam />}
          </g>
        </g>
      </svg>
    )
  }),
)

// ---------------------------------------------------------------------------
function robePath(W: number) {
  return `M${CX - 46} 200 C ${CX - 82} 204 ${CX - W} 258 ${CX - W} 326 C ${CX - W * 0.65} 358 ${CX + W * 0.65} 358 ${CX + W} 326 C ${CX + W} 258 ${CX + 82} 204 ${CX + 46} 200 Z`
}

function RobePattern({ kind, color, W }: { kind: string; color: string; W: number }) {
  if (kind === 'stripes')
    return (
      <g opacity={0.55}>
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={CX - W + i * 17} y={190} width={6} height={180} fill={color} />
        ))}
      </g>
    )
  if (kind === 'dots')
    return (
      <g opacity={0.5}>
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={CX - W + (i % 14) * 20 + ((Math.floor(i / 14) % 2) * 10)} cy={210 + Math.floor(i / 14) * 30} r={4.5} fill={color} />
        ))}
      </g>
    )
  if (kind === 'zigzag')
    return (
      <g opacity={0.6} fill="none" stroke={color} strokeWidth={5}>
        {Array.from({ length: 6 }, (_, r) => (
          <polyline
            key={r}
            points={Array.from({ length: 18 }, (_, i) => `${CX - W + i * 16},${222 + r * 26 + (i % 2 ? 10 : 0)}`).join(' ')}
          />
        ))}
      </g>
    )
  // embroidery: big chest motif + hem border
  return (
    <g>
      <path d={`M${CX - 46} 210 Q${CX} 320 ${CX + 46} 210`} fill={color} opacity={0.35} />
      <path d={`M${CX - 30} 230 q30 60 60 0`} fill="none" stroke={color} strokeWidth={4} opacity={0.9} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={CX - 24 + i * 16} cy={262 + (i % 2) * 8} r={4} fill="none" stroke={color} strokeWidth={2.5} />
      ))}
      <path d={`M${CX - W} 330 Q${CX} 362 ${CX + W} 330`} fill="none" stroke={color} strokeWidth={8} opacity={0.8} />
    </g>
  )
}

function Wrinkles({ stage, W, color }: { stage: number; W: number; color: string }) {
  const lines = [
    `M${CX - W + 30} 270 q20 -10 35 5 q15 12 30 -2`,
    `M${CX + 20} 300 q15 -12 30 0 q15 10 32 -4`,
    `M${CX - 70} 320 q18 -8 30 4`,
    `M${CX + 50} 250 q10 15 28 8`,
    `M${CX - 40} 240 q-12 18 -30 14`,
    `M${CX - 10} 335 q14 -14 28 0 q12 10 26 -2`,
  ]
  const n = stage === 3 ? 3 : stage === 4 ? 5 : 6
  return (
    <g fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" opacity={0.55}>
      {lines.slice(0, n).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  )
}

function Hand({ x, y, skin }: { x: number; y: number; skin: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={15} fill={skin} stroke={OUT} strokeWidth={3.5} />
      <path d={`M${x - 6} ${y - 8} q-4 8 0 14`} stroke={OUT} strokeWidth={2} fill="none" opacity={0.5} />
    </g>
  )
}

function Beads() {
  return (
    <g>
      {Array.from({ length: 13 }, (_, i) => {
        const t = i / 12
        const x = CX - 44 + t * 88
        const y = 210 + Math.sin(t * Math.PI) * 50
        return <circle key={i} cx={x} cy={y} r={6.5} fill={i % 3 === 0 ? '#ffd54f' : '#e64a19'} stroke={OUT} strokeWidth={2} />
      })}
    </g>
  )
}

function Props({ accessories, W, stage }: { accessories: Accessory[]; W: number; stage: number }) {
  const held = accessories.filter((a) => a !== 'sunglasses' && a !== 'beads')
  const rx = CX + W - 26
  const lx = CX - W + 26
  const shaky = stage >= 3 ? 'shake' : undefined
  return (
    <g className={shaky}>
      {held.map((a, i) => {
        const left = a === 'fan' || (i === 1 && held[0] !== 'fan')
        const x = left ? lx : rx
        const flip = left ? -1 : 1
        return <g key={a}>{prop(a, x, 312, flip, stage)}</g>
      })}
    </g>
  )
}

function prop(a: Accessory, x: number, y: number, flip: number, stage: number) {
  switch (a) {
    case 'bag':
      return (
        <g transform={`translate(${x - 30 + flip * 10} ${y - 4}) rotate(${stage >= 4 ? 18 * flip : 0} 30 24)`}>
          <path d="M18 6 q12 -14 24 0" stroke={OUT} strokeWidth={4} fill="none" />
          <rect x={0} y={4} width={60} height={44} rx={5} fill="#2f6fd6" stroke={OUT} strokeWidth={3} />
          {[12, 24, 36].map((v) => (
            <path key={v} d={`M0 ${4 + v} h60`} stroke="#e53935" strokeWidth={3} />
          ))}
          {[15, 30, 45].map((v) => (
            <path key={v} d={`M${v} 4 v44`} stroke="#e53935" strokeWidth={3} />
          ))}
          {stage >= 5 && (
            <g>
              {/* the bag bursts open — paper slips fly */}
              <rect x={8} y={-18} width={18} height={10} fill="#a5d6a7" stroke={OUT} strokeWidth={1.5} transform="rotate(-20 17 -13)" />
              <rect x={34} y={-26} width={18} height={10} fill="#a5d6a7" stroke={OUT} strokeWidth={1.5} transform="rotate(15 43 -21)" />
            </g>
          )}
        </g>
      )
    case 'mic':
      return (
        <g transform={`translate(${x} ${y}) rotate(${-20 * flip})`}>
          <rect x={-5} y={-50} width={10} height={44} rx={4} fill="#424242" stroke={OUT} strokeWidth={3} />
          <circle cx={0} cy={-58} r={13} fill="#9e9e9e" stroke={OUT} strokeWidth={3} />
          <path d="M-8 -62 h16 M-9 -56 h18" stroke={OUT} strokeWidth={1.5} />
        </g>
      )
    case 'phone':
      return (
        <g transform={`translate(${x - 9} ${y - 44}) rotate(${10 * flip} 9 16)`}>
          <rect width={20} height={34} rx={4} fill="#263238" stroke={OUT} strokeWidth={3} />
          <rect x={3} y={4} width={14} height={22} rx={1.5} fill={stage >= 3 ? '#ff5252' : '#4fc3f7'} />
        </g>
      )
    case 'passport':
      return (
        <g transform={`translate(${x - 14} ${y - 46}) rotate(${-8 * flip} 14 18)`}>
          <rect width={28} height={36} rx={3} fill="#1b5e20" stroke={OUT} strokeWidth={3} />
          <circle cx={14} cy={15} r={6} fill="none" stroke="#ffd54f" strokeWidth={2} />
          <path d="M7 28 h14" stroke="#ffd54f" strokeWidth={2} />
        </g>
      )
    case 'calculator':
      return (
        <g transform={`translate(${x - 16} ${y - 52}) rotate(${-6 * flip} 16 20)`}>
          <rect width={32} height={42} rx={4} fill="#90a4ae" stroke={OUT} strokeWidth={3} />
          <rect x={4} y={4} width={24} height={9} rx={1.5} fill={stage >= 5 ? '#ff7043' : '#c5e1a5'} />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={5 + (i % 3) * 8} y={17 + Math.floor(i / 3) * 7.5} width={6} height={5} rx={1} fill="#37474f" />
          ))}
          {stage >= 5 && <path d="M8 -6 q4 -8 0 -14 M20 -4 q5 -9 0 -16" stroke="#9e9e9e" strokeWidth={3} fill="none" className="steam" />}
        </g>
      )
    case 'fan':
      return (
        <g transform={`translate(${x} ${y}) rotate(${(stage >= 3 ? -40 : -15) * -flip})`}>
          <rect x={-4} y={-46} width={8} height={40} rx={3} fill="#6d4c41" stroke={OUT} strokeWidth={2.5} />
          <path d="M0 -46 C -22 -60 -18 -96 0 -110 C 18 -96 22 -60 0 -46Z" fill="#f5f5f5" stroke={OUT} strokeWidth={3} />
          <path d="M0 -50 V -100 M-8 -60 Q-6 -84 0 -100 M8 -60 Q6 -84 0 -100" stroke="#bdbdbd" strokeWidth={2} fill="none" />
        </g>
      )
    default:
      return null
  }
}

function Brows({ stage, hit }: { stage: number; hit: boolean }) {
  // [leftAngle, rightAngle, yOffset]
  const presets: [number, number, number][] = [
    [-8, 8, 0], // confident
    [10, -10, -8], // surprised up
    [14, -4, -4], // worried
    [-22, 22, 4], // angry
    [24, -24, -2], // sad
    [30, -30, -10], // wild
  ]
  const [la, ra, dy] = hit && stage < 4 ? [-18, 18, 4] : presets[stage]
  return (
    <g stroke={OUT} strokeWidth={7} strokeLinecap="round">
      <path d={`M${CX - 46} ${108 + dy} h28`} transform={`rotate(${la} ${CX - 32} ${108 + dy})`} />
      <path d={`M${CX + 18} ${108 + dy} h28`} transform={`rotate(${ra} ${CX + 32} ${108 + dy})`} />
    </g>
  )
}

function Eyes({ stage, hit, covered }: { stage: number; hit: boolean; covered: boolean }) {
  if (covered && !hit) return null
  const ex = [CX - 28, CX + 28]
  const ey = 128
  if (hit || stage === 4) {
    // squeezed >< eyes
    return (
      <g stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${ex[0] - 11} ${ey - 7} l14 7 l-14 7`} />
        <path d={`M${ex[1] + 11} ${ey - 7} l-14 7 l14 7`} />
      </g>
    )
  }
  if (stage === 5) {
    // dizzy spirals
    return (
      <g stroke={OUT} strokeWidth={3.5} fill="#fff">
        {ex.map((x) => (
          <g key={x}>
            <circle cx={x} cy={ey} r={14} />
            <path d={`M${x} ${ey} m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 0 a8 8 0 1 1 15 0`} fill="none" strokeWidth={2.5} />
          </g>
        ))}
      </g>
    )
  }
  const pupil = [5.5, 3.5, 5, 5, 0][stage]
  const look = [0, 5, -3, 0, 0][stage]
  const ry = [12, 16, 13, 9, 12][stage]
  return (
    <g>
      {ex.map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={ey} rx={12} ry={ry} fill="#fff" stroke={OUT} strokeWidth={3.5} />
          <circle cx={x + look} cy={ey + 1} r={pupil} fill={OUT} />
          <circle cx={x + look + 2} cy={ey - 2} r={1.6} fill="#fff" />
          {stage === 3 && <path d={`M${x - 13} ${ey - 6} h26`} stroke={OUT} strokeWidth={4} />}
        </g>
      ))}
    </g>
  )
}

function Mouth({ stage, hit, lipstick }: { stage: number; hit: boolean; lipstick?: string }) {
  const lip = lipstick ?? OUT
  const y = 175
  if (hit && stage < 3) {
    return <ellipse cx={CX} cy={y} rx={9} ry={11} fill="#5d1a1a" stroke={lip} strokeWidth={3.5} />
  }
  switch (stage) {
    case 0:
      return (
        <g>
          <path d={`M${CX - 26} ${y - 6} Q${CX} ${y + 22} ${CX + 26} ${y - 6} Z`} fill="#fff" stroke={lip} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M${CX - 22} ${y - 2} h44`} stroke="#ddd" strokeWidth={1.5} />
          {[-12, 0, 12].map((d) => (
            <path key={d} d={`M${CX + d} ${y - 5} v8`} stroke="#ccc" strokeWidth={1.2} />
          ))}
        </g>
      )
    case 1:
      return <path d={`M${CX - 14} ${y} q7 -6 14 0 q7 6 14 0`} fill="none" stroke={lip} strokeWidth={4.5} strokeLinecap="round" />
    case 2:
      return (
        <g>
          <rect x={CX - 20} y={y - 7} width={40} height={14} rx={5} fill="#fff" stroke={lip} strokeWidth={3.5} />
          <path d={`M${CX - 20} ${y} h40 M${CX - 10} ${y - 7} v14 M${CX} ${y - 7} v14 M${CX + 10} ${y - 7} v14`} stroke={OUT} strokeWidth={1.6} />
        </g>
      )
    case 3:
      return (
        <g>
          <path d={`M${CX - 22} ${y - 4} L${CX + 22} ${y - 4} L${CX + 14} ${y + 16} L${CX - 14} ${y + 16} Z`} fill="#5d1a1a" stroke={lip} strokeWidth={4} strokeLinejoin="round" />
          <ellipse cx={CX} cy={y + 11} rx={9} ry={5} fill="#ef5350" />
          <path d={`M${CX - 20} ${y - 3} h40`} stroke="#fff" strokeWidth={4} />
        </g>
      )
    case 4:
      return (
        <g>
          <path d={`M${CX - 24} ${y + 14} Q${CX} ${y - 18} ${CX + 24} ${y + 14} Q${CX} ${y + 6} ${CX - 24} ${y + 14} Z`} fill="#5d1a1a" stroke={lip} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M${CX - 12} ${y + 3} q12 -6 24 0`} stroke="#ef5350" strokeWidth={4} fill="none" />
        </g>
      )
    default:
      return (
        <g>
          <ellipse cx={CX} cy={y + 8} rx={24} ry={22} fill="#5d1a1a" stroke={lip} strokeWidth={4} />
          <ellipse cx={CX} cy={y + 20} rx={13} ry={7} fill="#ef5350" />
          <path d={`M${CX} ${y - 10} v8`} stroke="#ef5350" strokeWidth={5} strokeLinecap="round" />
          <path d={`M${CX - 18} ${y - 6} h36`} stroke="#fff" strokeWidth={4} />
        </g>
      )
  }
}

function Sunglasses({ stage }: { stage: number }) {
  const t = [
    '',
    '',
    `rotate(9 ${CX} 128)`,
    `translate(0 14) rotate(-12 ${CX} 128)`,
    `translate(26 30) rotate(38 ${CX + 40} 128)`,
    `translate(40 70) rotate(70 ${CX} 128)`,
  ][stage]
  return (
    <g transform={t} className={stage === 1 ? 'shake' : undefined}>
      <path d={`M${CX - 62} 124 L${CX - 44} 122 M${CX + 44} 122 L${CX + 62} 124`} stroke={OUT} strokeWidth={4} />
      <rect x={CX - 46} y={114} width={38} height={28} rx={9} fill="#111" stroke={OUT} strokeWidth={3} />
      <rect x={CX + 8} y={114} width={38} height={28} rx={9} fill="#111" stroke={OUT} strokeWidth={3} />
      <path d={`M${CX - 8} 122 q8 -6 16 0`} stroke={OUT} strokeWidth={4} fill="none" />
      <path d={`M${CX - 38} 120 l10 10 M${CX + 16} 120 l10 10`} stroke="#fff" strokeWidth={3} opacity={0.55} strokeLinecap="round" />
      {stage >= 4 && <path d={`M${CX + 14} 116 l10 12 l-6 4 l12 8`} stroke="#fff" strokeWidth={1.8} fill="none" />}
    </g>
  )
}

function FacialHair({ kind, color, stage }: { kind: string; color: string; stage: number }) {
  const droop = stage >= 4 ? 6 : 0
  if (kind === 'moustache')
    return (
      <path
        d={`M${CX - 30} ${164 + droop} Q${CX - 18} ${152} ${CX} ${160} Q${CX + 18} ${152} ${CX + 30} ${164 + droop} Q${CX + 14} ${166} ${CX} ${163} Q${CX - 14} ${166} ${CX - 30} ${164 + droop} Z`}
        fill={color}
        stroke={OUT}
        strokeWidth={2}
      />
    )
  if (kind === 'beard')
    return (
      <path
        d={`M${CX - 58} 140 Q${CX - 56} 212 ${CX} 214 Q${CX + 56} 212 ${CX + 58} 140 Q${CX + 46} 190 ${CX} 194 Q${CX - 46} 190 ${CX - 58} 140 Z`}
        fill={color}
        stroke={OUT}
        strokeWidth={2.5}
      />
    )
  if (kind === 'goatee')
    return <path d={`M${CX - 12} 196 Q${CX} 222 ${CX + 12} 196 Q${CX} 201 ${CX - 12} 196 Z`} fill={color} stroke={OUT} strokeWidth={2} />
  return null
}

function Sweat({ stage, headRx }: { stage: number; headRx: number }) {
  const drops = stage >= 3 ? 3 : 2
  const pos = [
    [CX + headRx - 14, 96],
    [CX - headRx + 12, 104],
    [CX + headRx - 4, 120],
  ]
  return (
    <g>
      {pos.slice(0, drops).map(([x, y], i) => (
        <path
          key={i}
          className={`sweat ${i % 2 ? 'd2' : ''}`}
          d={`M${x} ${y} q-7 12 0 16 q7 -4 0 -16 Z`}
          fill="#81d4fa"
          stroke="#0277bd"
          strokeWidth={2}
        />
      ))}
    </g>
  )
}

function Tears() {
  return (
    <g fill="#4fc3f7" stroke="#0277bd" strokeWidth={2}>
      {[CX - 30, CX + 30].map((x) =>
        [1, 2, 3].map((d) => (
          <path key={`${x}-${d}`} className={`tear d${d}`} d={`M${x} 140 q-6 10 0 14 q6 -4 0 -14 Z`} />
        )),
      )}
      {/* streams */}
      <path d={`M${CX - 34} 138 q-6 30 -2 60`} stroke="#4fc3f7" strokeWidth={7} fill="none" opacity={0.7} strokeLinecap="round" />
      <path d={`M${CX + 34} 138 q6 30 2 60`} stroke="#4fc3f7" strokeWidth={7} fill="none" opacity={0.7} strokeLinecap="round" />
    </g>
  )
}

function StressMarks() {
  return (
    <g stroke="#ff1744" strokeWidth={4} strokeLinecap="round" fill="none">
      <path d={`M${CX + 30} 82 q6 6 12 0 M${CX + 36} 76 q-6 6 0 12`} />
    </g>
  )
}

function Steam() {
  return (
    <g fill="#eceff1" stroke="#90a4ae" strokeWidth={2}>
      <circle className="steam" cx={CX - 70} cy={70} r={12} />
      <circle className="steam d2" cx={CX + 72} cy={66} r={14} />
      <circle className="steam d3" cx={CX - 52} cy={52} r={9} />
    </g>
  )
}

function HeadwearShape({ kind, cap, trim }: { kind: Headwear; cap: string; trim: string }) {
  const s = { stroke: OUT, strokeWidth: 4, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'fila':
      return (
        <g>
          <path d={`M${CX - 62} 92 Q${CX - 60} 44 ${CX} 40 Q${CX + 58} 42 ${CX + 62} 92 Q${CX} 78 ${CX - 62} 92 Z`} fill={cap} {...s} />
          <path d={`M${CX - 10} 44 Q${CX + 60} 22 ${CX + 82} 70 Q${CX + 58} 72 ${CX + 40} 58 Z`} fill={darken(cap, 10)} {...s} />
          <path d={`M${CX - 62} 90 Q${CX} 76 ${CX + 62} 90`} fill="none" stroke={trim} strokeWidth={6} />
          <path d={`M${CX - 30} 62 l8 8 l8 -8 l8 8 l8 -8`} stroke={trim} strokeWidth={3} fill="none" />
        </g>
      )
    case 'gele':
      return (
        <g>
          <path d={`M${CX - 80} 100 Q${CX - 104} 30 ${CX - 40} 36 Q${CX} -6 ${CX + 42} 34 Q${CX + 104} 24 ${CX + 78} 100 Q${CX} 76 ${CX - 80} 100 Z`} fill={cap} {...s} />
          <path d={`M${CX - 60} 90 Q${CX - 70} 50 ${CX - 36} 44 M${CX - 14} 82 Q${CX - 10} 30 ${CX + 8} 18 M${CX + 30} 82 Q${CX + 40} 44 ${CX + 76} 44`} stroke={darken(cap, 25)} strokeWidth={3.5} fill="none" />
          <path d={`M${CX - 80} 98 Q${CX} 74 ${CX + 78} 98`} stroke={trim} strokeWidth={6} fill="none" />
          <circle cx={CX + 4} cy={30} r={7} fill={trim} stroke={OUT} strokeWidth={2.5} />
        </g>
      )
    case 'okpu':
      return (
        <g>
          <path d={`M${CX - 60} 94 L${CX - 54} 46 Q${CX} 34 ${CX + 54} 46 L${CX + 60} 94 Q${CX} 82 ${CX - 60} 94 Z`} fill={cap} {...s} />
          <path d={`M${CX - 58} 86 Q${CX} 74 ${CX + 58} 86`} stroke={trim} strokeWidth={5} fill="none" />
          {[-34, -12, 10, 32].map((d, i) => (
            <circle key={d} cx={CX + d} cy={62 - (i % 2) * 4} r={4.5} fill={trim} stroke={OUT} strokeWidth={1.5} />
          ))}
          <path d={`M${CX + 40} 44 q22 -6 26 14`} stroke={OUT} strokeWidth={3} fill="none" />
          <path d={`M${CX + 62} 56 l6 18 l6 -16`} fill="#212121" stroke={OUT} strokeWidth={2} />
        </g>
      )
    case 'zanna':
      return (
        <g>
          <path d={`M${CX - 62} 96 Q${CX - 64} 36 ${CX} 30 Q${CX + 64} 36 ${CX + 62} 96 Q${CX} 82 ${CX - 62} 96 Z`} fill={cap} {...s} />
          {[0, 1, 2].map((r) => (
            <polyline
              key={r}
              points={Array.from({ length: 10 }, (_, i) => `${CX - 54 + i * 12},${56 + r * 12 + (i % 2 ? 6 : 0)}`).join(' ')}
              fill="none"
              stroke={trim}
              strokeWidth={3}
            />
          ))}
        </g>
      )
    case 'bowler':
      return (
        <g>
          <path d={`M${CX - 50} 88 Q${CX - 52} 34 ${CX} 32 Q${CX + 52} 34 ${CX + 50} 88 Z`} fill={cap} {...s} />
          <path d={`M${CX - 50} 80 Q${CX} 70 ${CX + 50} 80 L${CX + 50} 88 L${CX - 50} 88 Z`} fill={trim} stroke={OUT} strokeWidth={2.5} />
          <ellipse cx={CX} cy={90} rx={80} ry={13} fill={cap} {...s} />
        </g>
      )
    case 'beret':
      return (
        <g>
          <path d={`M${CX - 58} 92 Q${CX - 90} 56 ${CX - 30} 46 Q${CX + 40} 30 ${CX + 82} 62 Q${CX + 70} 86 ${CX + 58} 92 Q${CX} 80 ${CX - 58} 92 Z`} fill={cap} {...s} />
          <path d={`M${CX - 58} 90 Q${CX} 78 ${CX + 58} 90`} stroke={trim} strokeWidth={6} fill="none" />
          <circle cx={CX + 4} cy={40} r={6} fill={trim} stroke={OUT} strokeWidth={2.5} />
          <path d={`M${CX - 20} 60 l5 -9 l5 9 l-10 -5 h10 z`} fill={trim} />
        </g>
      )
  }
}

// colour utils ---------------------------------------------------------------
function shift(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, v + amt))
  const r = c(n >> 16)
  const g = c((n >> 8) & 255)
  const b = c(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
const lighten = (h: string, p: number) => shift(normalize(h), Math.round(2.55 * p))
const darken = (h: string, p: number) => shift(normalize(h), -Math.round(2.55 * p))
function normalize(h: string) {
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h
}
