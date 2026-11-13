let audioCtx = null

function getContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Schedules a short glass-bead "clink" sound `delaySeconds` from now.
// Scheduling on the AudioContext's own clock (rather than a JS timer)
// keeps the sound tied to the user gesture that triggered it, so
// browsers don't block playback even though it fires later.
export function scheduleDropSound(delaySeconds = 0) {
  const ctx = getContext()
  const startTime = ctx.currentTime + delaySeconds

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1100, startTime)
  osc.frequency.exponentialRampToValueAtTime(260, startTime + 0.1)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16)

  osc.connect(gain).connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + 0.18)

  // a faint secondary "tick" of glass contact
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(2400, startTime + 0.02)
  gain2.gain.setValueAtTime(0.0001, startTime + 0.02)
  gain2.gain.exponentialRampToValueAtTime(0.08, startTime + 0.025)
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(startTime + 0.02)
  osc2.stop(startTime + 0.1)
}

// A short descending "crack" for an abandoned Pomodoro session's pending bead.
export function playBeadBreakSound() {
  const ctx = getContext()
  const startTime = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(320, startTime)
  osc.frequency.exponentialRampToValueAtTime(60, startTime + 0.22)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.24)

  osc.connect(gain).connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + 0.26)

  const noise = ctx.createOscillator()
  const noiseGain = ctx.createGain()
  noise.type = 'square'
  noise.frequency.setValueAtTime(900, startTime)
  noiseGain.gain.setValueAtTime(0.0001, startTime)
  noiseGain.gain.exponentialRampToValueAtTime(0.06, startTime + 0.005)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05)
  noise.connect(noiseGain).connect(ctx.destination)
  noise.start(startTime)
  noise.stop(startTime + 0.06)
}

// Three short chimes marking the end of a Pomodoro phase.
export function playTimerEndSound() {
  const ctx = getContext()
  const startTime = ctx.currentTime

  for (let i = 0; i < 3; i++) {
    const t = startTime + i * 0.28
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.24)
  }
}

// ── Sədəf's voice ─────────────────────────────────────────────────────────
// Four small sounds, all synthesized here (no audio files):
//   drop    a water drop — she is about to say something
//   tap     a soft knock on shell — a button or a touch
//   chime   two glassy notes — a block or a break has ended
//   splash  water rushing back — you stood up and the shell opens
//   string  a rising run of pearls — the whole session is done
function tone(ctx, { type = 'sine', from, to = from, start = 0, length, peak = 0.2, attack = 0.008 }) {
  const t0 = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + length)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + length + 0.02)
}

function noise(ctx, { start = 0, length, peak = 0.12, from = 900, to = 2600 }) {
  const t0 = ctx.currentTime + start
  const frames = Math.floor(ctx.sampleRate * length)
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 0.9
  filter.frequency.setValueAtTime(from, t0)
  filter.frequency.exponentialRampToValueAtTime(to, t0 + length)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + length * 0.25)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(t0)
}

const VOICE = {
  drop: (ctx) => tone(ctx, { from: 520, to: 1250, length: 0.11, peak: 0.1 }),
  tap: (ctx) => {
    tone(ctx, { type: 'triangle', from: 330, to: 210, length: 0.07, peak: 0.16, attack: 0.002 })
    tone(ctx, { from: 990, to: 760, length: 0.04, peak: 0.05, attack: 0.002 })
  },
  chime: (ctx) => {
    tone(ctx, { from: 783.99, length: 0.9, peak: 0.16 })
    tone(ctx, { from: 1567.98, length: 0.5, peak: 0.04 })
    tone(ctx, { from: 1046.5, start: 0.2, length: 1.1, peak: 0.16 })
    tone(ctx, { from: 2093, start: 0.2, length: 0.6, peak: 0.035 })
  },
  splash: (ctx) => {
    noise(ctx, { length: 0.38, peak: 0.1 })
    tone(ctx, { from: 420, to: 980, length: 0.16, peak: 0.09 })
    tone(ctx, { from: 620, to: 1500, start: 0.12, length: 0.14, peak: 0.07 })
  },
  string: (ctx) => {
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      tone(ctx, { from: f, start: i * 0.11, length: 0.7, peak: 0.13 })
    })
  },
}

export function playCompanionSound(name) {
  try {
    VOICE[name]?.(getContext())
  } catch {
    // no audio (blocked until the first click, or unsupported): stay silent
  }
}
