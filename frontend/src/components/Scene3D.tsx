import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../game/store'

/**
 * Three.js background layer rendered behind the 2D game UI:
 *  - floating, spinning gold coins (instanced)
 *  - rotating sunburst rays for that "rally stage" feel
 *  - instanced confetti bursts on stage-up / meltdown / boss win
 */
export default function Scene3D() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        frameloop="always"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 6]} intensity={1.6} color="#fff3d1" />
        <pointLight position={[-4, -2, 4]} intensity={18} color="#00ff99" distance={20} />
        <Sunburst />
        <Coins />
        <Confetti />
      </Canvas>
    </div>
  )
}

function Sunburst() {
  const ref = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    const rays = 14
    for (let i = 0; i < rays; i++) {
      const a0 = (i / rays) * Math.PI * 2
      const a1 = a0 + (Math.PI / rays) * 0.9
      shape.moveTo(0, 0)
      shape.lineTo(Math.cos(a0) * 20, Math.sin(a0) * 20)
      shape.lineTo(Math.cos(a1) * 20, Math.sin(a1) * 20)
      shape.lineTo(0, 0)
    }
    return new THREE.ShapeGeometry(shape)
  }, [])
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.05
  })
  return (
    <mesh ref={ref} geometry={geo} position={[0, 0.6, -6]}>
      <meshBasicMaterial color="#1fd17a" transparent opacity={0.07} depthWrite={false} />
    </mesh>
  )
}

const COIN_COUNT = 28

function Coins() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data = useMemo(
    () =>
      Array.from({ length: COIN_COUNT }, () => ({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 16,
        z: -2 - Math.random() * 5,
        speed: 0.25 + Math.random() * 0.5,
        spin: 0.5 + Math.random() * 2,
        rx: Math.random() * Math.PI,
        s: 0.6 + Math.random() * 0.7,
      })),
    [],
  )
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 28)
    g.rotateX(Math.PI / 2)
    return g
  }, [])

  useFrame((state, dt) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    data.forEach((c, i) => {
      c.y += c.speed * dt
      if (c.y > 9) {
        c.y = -9
        c.x = (Math.random() - 0.5) * 12
      }
      dummy.position.set(c.x + Math.sin(t * 0.6 + i) * 0.3, c.y, c.z)
      dummy.rotation.set(c.rx + t * 0.3, t * c.spin, 0)
      dummy.scale.setScalar(c.s)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, COIN_COUNT]}>
      <meshStandardMaterial color="#ffc93c" metalness={0.85} roughness={0.25} emissive="#5a3a00" emissiveIntensity={0.4} />
    </instancedMesh>
  )
}

const CONFETTI = 260
const PALETTES = {
  stage: ['#00a859', '#ffffff', '#ffc93c'],
  meltdown: ['#00a859', '#ffffff', '#ff4d4d', '#ffc93c', '#9b5cff', '#3ec7ff'],
  win: ['#ffc93c', '#fff7e6', '#00a859'],
}

function Confetti() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const parts = useMemo(
    () =>
      Array.from({ length: CONFETTI }, () => ({
        p: new THREE.Vector3(0, -50, 0),
        v: new THREE.Vector3(),
        r: new THREE.Euler(),
        rv: new THREE.Vector3(),
        life: 0,
      })),
    [],
  )
  const geo = useMemo(() => new THREE.PlaneGeometry(0.16, 0.26), [])
  const burst = useGame((s) => s.fxBurst)
  const kind = useGame((s) => s.fxBurstKind)

  // allocate instance colours up-front so the shader compiles with instancing colour support
  useEffect(() => {
    const m = ref.current
    if (!m) return
    const white = new THREE.Color('#ffffff')
    for (let i = 0; i < CONFETTI; i++) m.setColorAt(i, white)
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    ;(m.material as THREE.Material).needsUpdate = true
  }, [])

  useEffect(() => {
    const m = ref.current
    if (!m || burst === 0) return
    const colors = PALETTES[kind]
    const count = kind === 'meltdown' ? CONFETTI : kind === 'win' ? 180 : 90
    const col = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const c = parts[i]
      c.p.set((Math.random() - 0.5) * 1.5, 0.5, 1 + Math.random())
      const a = Math.random() * Math.PI * 2
      const sp = 4 + Math.random() * (kind === 'meltdown' ? 9 : 6)
      c.v.set(Math.cos(a) * sp * 0.7, Math.abs(Math.sin(a)) * sp + 3, (Math.random() - 0.3) * 3)
      c.rv.set(Math.random() * 10, Math.random() * 10, Math.random() * 10)
      c.life = 2.5 + Math.random() * 1.5
      m.setColorAt(i, col.set(colors[i % colors.length]))
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [burst, kind, parts])

  useFrame((_, dtRaw) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(dtRaw, 0.05)
    parts.forEach((c, i) => {
      if (c.life > 0) {
        c.life -= dt
        c.v.y -= 9 * dt
        c.v.multiplyScalar(1 - 1.2 * dt)
        c.p.addScaledVector(c.v, dt)
        c.r.x += c.rv.x * dt
        c.r.y += c.rv.y * dt
        c.r.z += c.rv.z * dt
        dummy.position.copy(c.p)
        dummy.rotation.copy(c.r)
        dummy.scale.setScalar(Math.min(1, c.life))
      } else {
        dummy.position.set(0, -50, 0)
        dummy.scale.setScalar(0)
      }
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, CONFETTI]} frustumCulled={false}>
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}
