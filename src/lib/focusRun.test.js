import { describe, expect, it } from 'vitest'
import {
  backToFocus,
  changeSetting,
  emptyRun,
  finishIfComplete,
  movedMinutes,
  overtimeMinutes,
  remainingSeconds,
  runLengthMinutes,
  runProgress,
  snooze,
  standUp,
  startFocus,
  togglePause,
  toggleMute,
  isMuted,
  wearLevel,
  wearStage,
} from './focusRun'

const T0 = Date.parse('2026-11-12T08:00:00Z')
const min = (n) => T0 + n * 60_000
const TODAY = '2026-11-12'
let n = 0
const id = () => `s${++n}`

const fresh = (settings = {}) => ({ focusSettings: settings, pomodoroHistory: [] })
const begin = (settings) => startFocus(fresh(settings), { now: T0, id: id() })

describe('focus block', () => {
  it('counts down, then runs into overtime instead of ending by itself', () => {
    const s = begin()
    expect(remainingSeconds(s.activeSession, min(10))).toBe(15 * 60)
    expect(overtimeMinutes(s.activeSession, min(25))).toBe(0)
    expect(remainingSeconds(s.activeSession, min(32))).toBe(-7 * 60)
    expect(overtimeMinutes(s.activeSession, min(32))).toBe(7)
    expect(s.activeSession.mode).toBe('focus') // still focus — nothing advanced
  })

  it('wears the companion down in stages the longer the overtime', () => {
    expect(wearStage(0)).toBeNull()
    expect(wearStage(1)).toBe('waiting')
    expect(wearStage(5)).toBe('dull')
    expect(wearStage(30)).toBe('closing')
    expect(wearStage(75)).toBe('shut')
    expect(wearLevel(0)).toEqual({ dull: 0, lid: 0 })
    expect(wearLevel(13).dull).toBeCloseTo(0.5)
    expect(wearLevel(13).lid).toBe(0)
    expect(wearLevel(40).lid).toBeGreaterThan(0.4)
    expect(wearLevel(90)).toEqual({ dull: 1, lid: 1 })
  })

  it('snooze adds five minutes, once, and only after time is up', () => {
    const s = begin()
    expect(snooze(s, { now: min(20) })).toBe(s) // too early
    const once = snooze(s, { now: min(27) })
    expect(remainingSeconds(once.activeSession, min(27))).toBe(3 * 60)
    expect(snooze(once, { now: min(31) })).toBe(once) // already used
  })

  it('pausing freezes the clock', () => {
    const paused = togglePause(begin(), { now: min(10) })
    expect(remainingSeconds(paused.activeSession, min(50))).toBe(15 * 60)
    const resumed = togglePause(paused, { now: min(50) })
    expect(remainingSeconds(resumed.activeSession, min(55))).toBe(10 * 60)
  })
})

describe('standing up', () => {
  it('counts the block when at least half of it was worked, and starts a break', () => {
    const s = standUp(begin(), { now: min(25), today: TODAY, id: id() })
    expect(s.activeSession).toMatchObject({ mode: 'break', plannedSeconds: 300, earned: true, long: false })
    expect(s.focusRun.blocks).toBe(1)
    expect(s.focusTotals).toMatchObject({ blocks: 1, streak: { last: TODAY, days: 1 } })
    expect(s.pomodoroHistory.at(-1)).toMatchObject({ completed: true, minutes: 25 })
  })

  it('does not count a block left after a few minutes', () => {
    const s = standUp(begin(), { now: min(5), today: TODAY, id: id() })
    expect(s.activeSession).toMatchObject({ mode: 'break', earned: false })
    expect(s.focusRun.blocks).toBe(0)
    expect(s.focusTotals.blocks).toBe(0)
    expect(s.pomodoroHistory.at(-1).completed).toBe(false)
  })

  it('continues a streak from yesterday and restarts it after a gap', () => {
    const base = begin()
    const from = (streak) => standUp({ ...base, focusTotals: { blocks: 3, runs: 0, streak } }, { now: min(25), today: TODAY, id: id() })
    expect(from({ last: '2026-11-11', days: 4 }).focusTotals.streak.days).toBe(5)
    expect(from({ last: '2026-11-08', days: 4 }).focusTotals.streak.days).toBe(1)
    expect(from({ last: TODAY, days: 2 }).focusTotals.streak.days).toBe(2)
  })
})

describe('breaks and the run', () => {
  const afterBlock = (settings) => standUp(begin(settings), { now: min(25), today: TODAY, id: id() })

  it('fills a segment in proportion to the break actually taken', () => {
    const s = afterBlock()
    expect(movedMinutes(s.activeSession, min(26))).toBe(1)
    expect(runProgress(s, min(26))).toBeCloseTo(0.2)
    const back = backToFocus(s, { now: min(26), id: id() })
    expect(back.focusRun.progress).toBeCloseTo(0.2)
    expect(back.activeSession.mode).toBe('focus')
  })

  it('a break taken in full fills exactly one segment, however long you stay away', () => {
    const back = backToFocus(afterBlock(), { now: min(60), id: id() })
    expect(back.focusRun.progress).toBe(1)
    expect(back.focusRun.moveMin).toBe(5)
  })

  it('gives a long break after every fourth counted block', () => {
    let s = begin({ blocks: 8 })
    for (let block = 1; block <= 4; block++) {
      const t = (block - 1) * 40
      s = standUp(s, { now: min(t + 25), today: TODAY, id: id() })
      if (block < 4) s = backToFocus(s, { now: min(t + 30), id: id() })
    }
    expect(s.activeSession).toMatchObject({ mode: 'break', long: true, plannedSeconds: 15 * 60 })
  })

  it('finishes the run when the last segment is full and summarises it', () => {
    let s = begin({ blocks: 2 })
    s = standUp(s, { now: min(25), today: TODAY, id: id() })
    s = backToFocus(s, { now: min(30), id: id() })
    s = standUp(s, { now: min(55), today: TODAY, id: id() })
    expect(finishIfComplete(s, { now: min(57) })).toBe(s) // segment not full yet
    const done = finishIfComplete(s, { now: min(60) })
    expect(done.activeSession).toBeNull()
    expect(done.focusRun).toEqual(emptyRun())
    expect(done.lastFocusRun).toMatchObject({ blocks: 2, focusMin: 50, moveMin: 10, first: true })
    expect(done.focusTotals.runs).toBe(1)
  })

  it('the last break of a run is never the long one', () => {
    let s = begin({ blocks: 4 })
    for (let block = 1; block <= 4; block++) {
      const t = (block - 1) * 40
      s = standUp(s, { now: min(t + 25), today: TODAY, id: id() })
      if (block < 4) s = backToFocus(s, { now: min(t + 30), id: id() })
    }
    expect(s.activeSession).toMatchObject({ mode: 'break', long: false, plannedSeconds: 5 * 60 })
  })
})

describe('settings', () => {
  it('steps within limits and keeps progress inside a shortened run', () => {
    let s = { focusSettings: {}, focusRun: { ...emptyRun(), progress: 3.5 } }
    s = changeSetting(s, 'blocks', -1)
    expect(s.focusSettings.blocks).toBe(3)
    expect(s.focusRun.progress).toBe(3)
    for (let i = 0; i < 30; i++) s = changeSetting(s, 'focusMin', 1)
    expect(s.focusSettings.focusMin).toBe(90)
    expect(changeSetting(s, 'autoContinue').focusSettings.autoContinue).toBe(true)
  })

  it('estimates the length of a run', () => {
    expect(runLengthMinutes({ blocks: 4, focusMin: 25, breakMin: 5, longBreakMin: 15, longEvery: 4 })).toBe(120)
    expect(runLengthMinutes({ blocks: 5, focusMin: 25, breakMin: 5, longBreakMin: 15, longEvery: 4 })).toBe(125 + 4 * 5 + 15) // the 4th break is long, the 5th is not
  })

  it('mutes for an hour and unmutes on a second press', () => {
    const muted = toggleMute({}, { now: T0 })
    expect(isMuted(muted, min(59))).toBe(true)
    expect(isMuted(muted, min(61))).toBe(false)
    expect(isMuted(toggleMute(muted, { now: min(10) }), min(11))).toBe(false)
  })
})
