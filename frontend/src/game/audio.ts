/**
 * All sounds are synthesized with WebAudio — zero asset downloads.
 * Swap any of these for recorded Nigerian SFX later by loading AudioBuffers.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicGain: GainNode | null = null
let sfxOn = true
let musicOn = true
let voiceOn = false

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)
    musicGain = ctx.createGain()
    musicGain.gain.value = 0.22
    musicGain.connect(master)
  }
  return ctx
}

export function unlockAudio() {
  const c = ac()
  if (c.state === 'suspended') void c.resume()
  if (musicOn) startMusic()
}

export function setAudioPrefs(p: { sfx: boolean; music: boolean; voice: boolean }) {
  sfxOn = p.sfx
  voiceOn = p.voice
  if (p.music !== musicOn) {
    musicOn = p.music
    if (musicOn && ctx) startMusic()
    else stopMusic()
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slideTo?: number, when = 0, dest?: AudioNode) {
  const c = ac()
  const t = c.currentTime + when
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest ?? master!)
  o.start(t)
  o.stop(t + dur + 0.02)
}

let noiseBuf: AudioBuffer | null = null
function noise(dur: number, vol = 0.2, hp = 4000, when = 0, dest?: AudioNode) {
  const c = ac()
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const t = c.currentTime + when
  const s = c.createBufferSource()
  s.buffer = noiseBuf
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = hp
  const g = c.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(dest ?? master!)
  s.start(t)
  s.stop(t + dur + 0.02)
}

export const sfx = {
  tap(combo = 0) {
    if (!sfxOn || !ctx) return
    const pitch = 420 + Math.min(combo, 120) * 4 + Math.random() * 40
    tone(pitch, 0.09, 'triangle', 0.25, pitch * 0.55)
    noise(0.04, 0.08, 2500)
  },
  crit() {
    if (!sfxOn || !ctx) return
    ;[880, 1320, 1760].forEach((f, i) => tone(f, 0.18, 'square', 0.12, undefined, i * 0.05))
  },
  coin() {
    if (!sfxOn || !ctx) return
    tone(1568, 0.08, 'square', 0.1)
    tone(2093, 0.18, 'square', 0.1, undefined, 0.07)
  },
  buy() {
    if (!sfxOn || !ctx) return
    ;[523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'triangle', 0.22, undefined, i * 0.06))
  },
  error() {
    if (!sfxOn || !ctx) return
    tone(160, 0.25, 'sawtooth', 0.18, 90)
  },
  stageUp() {
    if (!sfxOn || !ctx) return
    ;[392, 494, 587, 784].forEach((f, i) => tone(f, 0.22, 'square', 0.14, undefined, i * 0.09))
    noise(0.4, 0.06, 6000, 0.3)
  },
  meltdown() {
    if (!sfxOn || !ctx) return
    tone(900, 1.2, 'sawtooth', 0.15, 80)
    ;[523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 'square', 0.12, undefined, 0.6 + i * 0.1))
    for (let i = 0; i < 6; i++) noise(0.15, 0.1, 3000, 0.8 + i * 0.12)
  },
  alert() {
    if (!sfxOn || !ctx) return
    for (let i = 0; i < 3; i++) {
      tone(740, 0.12, 'square', 0.15, undefined, i * 0.25)
      tone(988, 0.12, 'square', 0.15, undefined, i * 0.25 + 0.12)
    }
  },
  ui() {
    if (!sfxOn || !ctx) return
    tone(660, 0.05, 'triangle', 0.12)
  },
  whistle() {
    if (!sfxOn || !ctx) return
    tone(2200, 0.35, 'sine', 0.18, 2600)
  },
}

// ---------------------------------------------------------------------------
// Tiny afrobeat-flavoured step sequencer (kick, shaker, log-drum, bell)
// ---------------------------------------------------------------------------
let musicTimer: number | null = null
let step = 0
let nextTime = 0
const BPM = 104
const KICK = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0]
const SHAKER = [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1]
const LOG = [0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 49, 0, 41, 0, 0]
const BELL = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0]

function scheduleStep(i: number, at: number) {
  const c = ac()
  const when = at - c.currentTime
  if (KICK[i]) tone(120, 0.25, 'sine', 0.6, 45, when, musicGain!)
  if (SHAKER[i]) noise(0.05, SHAKER[i] && i % 4 === 0 ? 0.18 : 0.09, 7000, when, musicGain!)
  if (LOG[i]) tone(LOG[i] * 2, 0.35, 'sine', 0.5, LOG[i] * 1.6, when, musicGain!)
  if (BELL[i]) tone(i % 8 === 0 ? 1318 : 1174, 0.07, 'triangle', 0.08, undefined, when, musicGain!)
}

function startMusic() {
  if (musicTimer !== null || !ctx) return
  nextTime = ctx.currentTime + 0.1
  musicTimer = window.setInterval(() => {
    if (!ctx) return
    const stepDur = 60 / BPM / 4
    while (nextTime < ctx.currentTime + 0.2) {
      scheduleStep(step, nextTime)
      nextTime += stepDur
      step = (step + 1) % 16
    }
  }, 50)
}

function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer)
  musicTimer = null
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return
  if (document.hidden) void ctx.suspend()
  else void ctx.resume()
})

// ---------------------------------------------------------------------------
// Voice lines via browser TTS (prefers a Nigerian English voice if installed)
// ---------------------------------------------------------------------------
let lastSpoke = 0
export function speak(text: string, force = false) {
  if (!voiceOn || !('speechSynthesis' in window)) return
  const now = Date.now()
  if (!force && now - lastSpoke < 3500) return
  lastSpoke = now
  const u = new SpeechSynthesisUtterance(text.replace(/[!?]{2,}/g, '!'))
  const voices = speechSynthesis.getVoices()
  u.voice = voices.find((v) => v.lang === 'en-NG') ?? voices.find((v) => v.lang.startsWith('en')) ?? null
  u.rate = 1.05
  u.pitch = 0.8 + Math.random() * 0.5
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}
