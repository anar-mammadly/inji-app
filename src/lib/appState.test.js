import { describe, expect, it } from 'vitest'
import { COMPLETED_TASKS_LIMIT, buildState, defaultState, hasUserContent, mergeGuestData } from './appState'

describe('buildState', () => {
  it('fills in defaults for missing fields', () => {
    const state = buildState({ tasks: [{ id: 't1' }] })
    expect(state.tasks).toHaveLength(1)
    expect(state.planDays).toHaveLength(7)
    expect(state.dailyGoal).toBe(20)
  })

  it('caps the lists that would otherwise grow forever', () => {
    const completedTasks = Array.from({ length: COMPLETED_TASKS_LIMIT + 50 }, (_, i) => ({ id: `c${i}` }))
    const state = buildState({ completedTasks })
    expect(state.completedTasks).toHaveLength(COMPLETED_TASKS_LIMIT)
    expect(state.completedTasks.at(-1).id).toBe(`c${COMPLETED_TASKS_LIMIT + 49}`)
  })
})

describe('hasUserContent', () => {
  it('is false for the untouched defaults and true once something is added', () => {
    expect(hasUserContent(defaultState())).toBe(false)
    expect(hasUserContent({ ...defaultState(), notes: [{ id: 'n1', text: 'hi' }] })).toBe(true)
    const planned = defaultState()
    planned.planDays[0].title = 'Code day'
    expect(hasUserContent(planned)).toBe(true)
  })
})

describe('mergeGuestData', () => {
  const account = () => ({
    ...defaultState(),
    tasks: [{ id: 'a1', name: 'account task', boardId: 'work', category: 'work' }],
    notes: [{ id: 'n1', text: 'account note' }],
    categoryCounts: { study: 0, work: 2, personal: 0 },
    completedTasks: [{ id: 'done-1', category: 'work' }],
  })

  it('adds guest items without touching what the account already has', () => {
    const guest = {
      ...defaultState(),
      boards: [...defaultState().boards, { id: 'b-guest', name: 'Side project', builtIn: false }],
      tasks: [
        { id: 'g1', name: 'guest task', boardId: 'b-guest', category: 'study' },
        { id: 'g2', name: 'orphan', boardId: 'gone', category: 'study' },
      ],
      notes: [{ id: 'n2', text: 'guest note' }],
    }
    const merged = mergeGuestData(account(), guest)
    expect(merged.tasks.map((t) => t.id)).toEqual(['a1', 'g1', 'g2'])
    expect(merged.tasks.find((t) => t.id === 'g2').boardId).toBe('work') // falls back to an existing board
    expect(merged.boards.map((b) => b.id)).toContain('b-guest')
    expect(merged.notes.map((n) => n.id)).toEqual(['n1', 'n2'])
  })

  it('never duplicates an item that is already there', () => {
    const merged = mergeGuestData(account(), { ...account() })
    expect(merged.tasks).toHaveLength(1)
    expect(merged.notes).toHaveLength(1)
    expect(merged.categoryCounts.work).toBe(2)
  })

  it('counts guest completions once', () => {
    const guest = { ...defaultState(), completedTasks: [{ id: 'done-1', category: 'work' }, { id: 'done-2', category: 'study' }] }
    const merged = mergeGuestData(account(), guest)
    expect(merged.categoryCounts).toEqual({ study: 1, work: 2, personal: 0 })
    expect(merged.completedTasks.map((c) => c.id)).toEqual(['done-1', 'done-2'])
  })
})
