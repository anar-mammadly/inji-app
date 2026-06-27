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
