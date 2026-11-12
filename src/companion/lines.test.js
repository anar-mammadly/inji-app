import { describe, expect, it } from 'vitest'
import { COMPANION_LINES, greetingEvent, pickLine } from './lines'

describe('companion lines', () => {
  it('has the same events in both languages, none of them empty', () => {
    expect(Object.keys(COMPANION_LINES.en).sort()).toEqual(Object.keys(COMPANION_LINES.az).sort())
    for (const lang of ['az', 'en']) {
      for (const [event, pool] of Object.entries(COMPANION_LINES[lang])) {
        expect(pool.length, `${lang}.${event}`).toBeGreaterThan(0)
        pool.forEach((line) => expect(line.trim().length).toBeGreaterThan(0))
      }
    }
  })

  it('fills in variables and never repeats a line back to back', () => {
    const memory = {}
    expect(pickLine('en', 'focusStart', memory, { min: 25 }, () => 0)).toBe('Off we go. 25 minutes, one task.')
    // same random pick again → moves on to the next line instead
    expect(pickLine('en', 'focusStart', memory, { min: 25 }, () => 0)).not.toContain('Off we go')
  })

  it('greets by time of day', () => {
    expect(greetingEvent(3)).toBe('helloNight')
    expect(greetingEvent(8)).toBe('helloMorning')
    expect(greetingEvent(14)).toBe('hello')
    expect(greetingEvent(21)).toBe('helloEvening')
  })
})
