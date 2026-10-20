import { useEffect, useRef, useState } from 'react'
import { applyDateRollover, todayISO } from './useStreak'
import { supabase } from '../lib/supabase'

const DEFAULT_DAILY_GOAL = 20
const DEFAULT_WEEKLY_GOAL = 100
const DEFAULT_CATEGORY_COUNTS = { study: 0, work: 0, personal: 0 }

const DEFAULT_BOARDS = [
  { id: 'work', name: 'Work', builtIn: true, createdAt: new Date().toISOString() },
  { id: 'personal', name: 'Personal', builtIn: true, createdAt: new Date().toISOString() },
]

const DEFAULT_SPORT_OPTIONS = ['Qaçış', 'İdman zalı', 'Gəzinti', 'Yoqa', 'Digər']

const DEFAULT_PLAN_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((id) => ({
  id,
  title: '',
  todos: [],
}))

function defaultState() {
  return {
    tasks: [],
    boards: DEFAULT_BOARDS,
    beadCount: 0,
    lastActiveDate: todayISO(),
    streakDays: 0,
    history: [],
    dailyGoal: DEFAULT_DAILY_GOAL,
    weeklyGoal: DEFAULT_WEEKLY_GOAL,
    categoryCounts: DEFAULT_CATEGORY_COUNTS,
    todayBeadCategories: [],
    completedTasks: [],
    activeSession: null,
    pomodoroHistory: [],
    habits: [],
    habitLog: {},
    learningGoals: [],
    journalEntries: [],
    events: [],
    notes: [],
    planDays: DEFAULT_PLAN_DAYS,
    planGoals: [],
  }
}

function ensureSportHabit(habits) {
  const list = habits || []
  return list.map((h) => ({
    ...h,
    targetDays: h.targetDays || 30,
    startDate: h.startDate || todayISO(),
    subOptions: h.subOptions || (h.kind === 'sport' ? DEFAULT_SPORT_OPTIONS : []),
  }))
}

function buildState(rawData) {
  const merged = { ...defaultState(), ...(rawData || {}) }
  merged.habits = ensureSportHabit(merged.habits)
  const rolled = applyDateRollover(merged)
  return { ...merged, ...rolled }
}

// Local cache entries are wrapped with a `savedAt` timestamp (possibly null —
// "unknown") so a reload can tell whether the browser's copy or the server's
// copy is more recent — without it, a slow/aborted Supabase write (e.g. a
// hard refresh right after an edit) gets silently overwritten by the stale
// server copy on next load. `__v` distinguishes this wrapper from the legacy
// unwrapped format so a null savedAt isn't mistaken for "not wrapped".
function loadStoredEntry(storageKey) {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.__v === 1 && parsed.data && typeof parsed.data === 'object') {
      return { data: parsed.data, savedAt: parsed.savedAt ?? null }
    }
    // Legacy (pre-wrapper) cache: still usable as data, just treat it as
    // "unknown age" so a real server record always wins the comparison.
    if (parsed && typeof parsed === 'object') {
      return { data: parsed, savedAt: null }
    }
    return null
  } catch {
    return null
  }
}

function saveStoredEntry(storageKey, data, savedAt = new Date().toISOString()) {
  localStorage.setItem(storageKey, JSON.stringify({ __v: 1, data, savedAt: savedAt ?? null }))
}

function applyUpdate(update, base) {
  return typeof update === 'function' ? update(base) : update
}

function withRollover(s) {
  return s.lastActiveDate === todayISO() ? s : { ...s, ...applyDateRollover(s) }
}

export function usePersistedState(userId) {
  const storageKey = `inji_state_${userId}`
  const isGuest = userId === 'guest'
  const [state, setState] = useState(() => buildState(loadStoredEntry(storageKey)?.data))
  const stateRef = useRef(state)
  const savedAtRef = useRef(loadStoredEntry(storageKey)?.savedAt ?? null)
  // which userId the server copy has been reconciled for. Keyed by user (not
  // a boolean) because on login child effects can call updateState before
  // this hook's own user-switch effect has run.
  const loadedForRef = useRef(null)
  // edits made before the server copy has been fetched; replayed on top of
  // whichever copy wins so they're neither lost nor allowed to make a stale
  // local cache look "newer" than the server
  const pendingUpdatesRef = useRef([])
  const prevUserIdRef = useRef(userId)
  const skipSaveRef = useRef(false)
  const persistQueueRef = useRef(Promise.resolve())
  const persistenceReadyRef = useRef(isGuest)

  function persistState(nextState, targetUserId = userId) {
    if (!targetUserId || targetUserId === 'guest') return
    const savedAt = new Date().toISOString()
    persistQueueRef.current = persistQueueRef.current
      .catch(() => {})
      .then(() => supabase
        .from('user_data')
        .upsert({ user_id: targetUserId, data: nextState, updated_at: savedAt }, { onConflict: 'user_id' }))
      .then(({ error }) => {
        if (error) console.error('Supabase sync failed:', error.message)
        else savedAtRef.current = savedAt
      })
  }

  useEffect(() => {
    if (prevUserIdRef.current === userId) return
    const prevUserId = prevUserIdRef.current
    prevUserIdRef.current = userId
    loadedForRef.current = null
    persistenceReadyRef.current = false
    skipSaveRef.current = true
    if (prevUserId === 'guest' && userId !== 'guest') {
      const userRaw = localStorage.getItem(storageKey)
      if (!userRaw) {
        const guestEntry = loadStoredEntry('inji_state_guest')
        if (guestEntry) {
          // Carry the guest data over, but drop its savedAt: it was just
          // stamped fresh by this same page load (the app always boots as
          // 'guest' until auth resolves), not by a real edit under this
          // account. Treating it as "newer than the server" would make a
          // brand-new device wipe an existing account's real cloud data the
          // moment someone logs in on it. The reconciliation below already
          // treats an unknown savedAt as "defer to the server if it has
          // anything", and still pushes this data up if the account is
          // genuinely new (no server row yet).
          saveStoredEntry(storageKey, guestEntry.data, null)
        }
      }
      localStorage.removeItem('inji_state_guest')
    }
    const entry = loadStoredEntry(storageKey)
    savedAtRef.current = entry?.savedAt ?? null
    // drop edits queued for someone else; re-apply ones already made for
    // this user (by child effects that ran before this one)
    pendingUpdatesRef.current = pendingUpdatesRef.current.filter((p) => p.userId === userId)
    const nextState = pendingUpdatesRef.current.reduce((s, p) => applyUpdate(p.update, s), buildState(entry?.data))
    stateRef.current = nextState
    setState(nextState)
  }, [userId, storageKey])

  useEffect(() => {
    if (!userId || userId === 'guest') {
      loadedForRef.current = userId
      return
    }
    let active = true

    supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        persistenceReadyRef.current = !error
        const pending = pendingUpdatesRef.current.filter((p) => p.userId === userId).map((p) => p.update)
        pendingUpdatesRef.current = []
        if (!error) {
          const hasServerRow = data?.data && typeof data.data === 'object'
          const serverUpdatedAt = hasServerRow && data.updated_at ? new Date(data.updated_at).getTime() : null
          const localSavedAt = savedAtRef.current ? new Date(savedAtRef.current).getTime() : null

          if (hasServerRow) {
            // An unknown local timestamp (e.g. a brand-new device, or guest
            // data just migrated under this account) never outranks a real
            // server record — only a *known-newer* local edit does.
            const localIsNewer = localSavedAt !== null && (serverUpdatedAt === null || localSavedAt > serverUpdatedAt)
            if (!localIsNewer) {
              let nextState = buildState(data.data)
              savedAtRef.current = data.updated_at ?? null
              if (pending.length) {
                // edits made while loading go on top of the server copy
                nextState = pending.reduce((s, update) => applyUpdate(update, s), nextState)
                savedAtRef.current = new Date().toISOString()
                persistState(nextState)
              }
              stateRef.current = nextState
              saveStoredEntry(storageKey, nextState, savedAtRef.current)
              setState(nextState)
            } else {
              // Our local copy is demonstrably newer — a previous write likely
              // never completed (e.g. refreshed mid-save). Re-send it.
              persistState(stateRef.current)
            }
          } else {
            // No server row yet at all — first sync for this account. Push
            // whatever we have locally (e.g. migrated guest progress) to seed it.
            persistState(stateRef.current)
          }
        } else if (pending.length) {
          // couldn't reach the server: keep the edits and mark them as a real
          // local change so the next successful load pushes them up
          savedAtRef.current = new Date().toISOString()
          saveStoredEntry(storageKey, stateRef.current, savedAtRef.current)
        }
        loadedForRef.current = userId
      })
      .catch(() => {
        if (!active) return
        persistenceReadyRef.current = false
        if (pendingUpdatesRef.current.length) {
          pendingUpdatesRef.current = []
          savedAtRef.current = new Date().toISOString()
          saveStoredEntry(storageKey, stateRef.current, savedAtRef.current)
        }
        loadedForRef.current = userId
      })

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    stateRef.current = state
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    saveStoredEntry(storageKey, state, savedAtRef.current ?? undefined)
  }, [state, storageKey])

  // Roll the day over if the tab stayed open past midnight. Local view only —
  // no savedAt stamp or cloud write, so an idle tab can't overwrite newer data
  // from another device. The next real edit persists it.
  useEffect(() => {
    function rollIfNewDay() {
      const rolled = withRollover(stateRef.current)
      if (rolled === stateRef.current) return
      stateRef.current = rolled
      setState(rolled)
    }
    const id = setInterval(rollIfNewDay, 60_000)
    document.addEventListener('visibilitychange', rollIfNewDay)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', rollIfNewDay)
    }
  }, [])

  function updateState(update) {
    const nextState = applyUpdate(update, withRollover(stateRef.current))
    stateRef.current = nextState
    if (!isGuest && loadedForRef.current !== userId) {
      // server copy not reconciled yet: show the edit, replay it later on top
      // of whichever copy wins, and don't stamp savedAt (that would make a
      // stale cache look newer than the server and overwrite it)
      pendingUpdatesRef.current.push({ userId, update })
      setState(nextState)
      return
    }
    const savedAt = new Date().toISOString()
    savedAtRef.current = savedAt
    saveStoredEntry(storageKey, nextState, savedAt)
    setState(nextState)
    if (!isGuest && persistenceReadyRef.current) persistState(nextState)
  }

  return [state, updateState]
}
