import { describe, expect, it } from 'vitest'
import { applyDateRollover, historyInWeek, weeklyBeadCount } from './useStreak'
import { addDaysISO, isoDay } from '../utils/day'

const TODAY = '2026-11-12'

describe('day helpers', () => {
  it('reads the calendar day in Baku, not in UTC', () => {
    // 21:30 UTC on the 11th is already 01:30 on the 12th in Baku (UTC+4)
    expect(isoDay(new Date('2026-11-11T21:30:00Z'))).toBe('2026-11-12')
    expect(isoDay(new Date('2026-11-11T19:59:00Z'))).toBe('2026-11-11')
  })

  it('adds days across month and year ends', () => {
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('date rollover', () => {
  it('does nothing on the same day', () => {
    const state = { beadCount: 3, lastActiveDate: TODAY, streakDays: 2, history: [], todayBeadCategories: ['work'] }
    expect(applyDateRollover(state, TODAY)).toEqual(state)
  })

  it('extends the streak after an active yesterday and empties the jar', () => {
    const next = applyDateRollover({ beadCount: 4, lastActiveDate: '2026-11-11', streakDays: 2, history: [] }, TODAY)
    expect(next).toMatchObject({ beadCount: 0, streakDays: 3, lastActiveDate: TODAY, todayBeadCategories: [] })
    expect(next.history).toEqual([{ date: '2026-11-11', count: 4 }])
  })

  it('resets the streak after an empty yesterday or a gap', () => {
    expect(applyDateRollover({ beadCount: 0, lastActiveDate: '2026-11-11', streakDays: 5, history: [] }, TODAY).streakDays).toBe(0)
    expect(applyDateRollover({ beadCount: 9, lastActiveDate: '2026-11-01', streakDays: 5, history: [] }, TODAY).streakDays).toBe(0)
  })
})

describe('weekly count', () => {
  it('counts only the last seven days, however old the stored entries are', () => {
    const history = [
      { date: '2026-10-01', count: 50 }, // weeks ago — must not count
      { date: '2026-11-05', count: 7 }, // 7 days ago — just outside
      { date: '2026-11-06', count: 2 },
      { date: '2026-11-11', count: 3 },
    ]
    expect(historyInWeek(history, TODAY).map((h) => h.date)).toEqual(['2026-11-06', '2026-11-11'])
    expect(weeklyBeadCount({ beadCount: 4, history }, TODAY)).toBe(9)
  })

  it('drops out-of-week entries when the day rolls over after a long break', () => {
    const next = applyDateRollover(
      { beadCount: 5, lastActiveDate: '2026-10-20', streakDays: 0, history: [{ date: '2026-10-19', count: 8 }] },
      TODAY,
    )
    expect(next.history).toEqual([])
  })
})
