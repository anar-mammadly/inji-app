import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'
import { createRemoteStore } from '../lib/remoteStore'
import { GUEST_ID, createLocalStore, createSyncEngine } from '../lib/syncEngine'
import { generateId } from '../utils/id'
import { buildState, hasUserContent, mergeGuestData, summarizeContent, withRollover } from '../lib/appState'

const REFRESH_INTERVAL_MS = 60_000

// Each tab announces that it is alive by holding a Web Lock for as long as it
// is open, so another tab can tell "unsaved edits of a tab that is still
// working" from "unsaved edits left behind by a tab that was closed".
const TAB_ID = generateId()
const lockName = (tabId) => `inji-tab-${tabId}`

if (typeof navigator !== 'undefined' && navigator.locks?.request) {
  navigator.locks.request(lockName(TAB_ID), () => new Promise(() => {})).catch(() => {})
}

async function isTabAlive(tabId) {
  if (typeof navigator === 'undefined' || !navigator.locks?.query) return false
  const { held = [] } = await navigator.locks.query()
  return held.some((lock) => lock.name === lockName(tabId))
}

function makeEngine(userId) {
  return createSyncEngine({
    userId,
    tabId: TAB_ID,
    isTabAlive,
    remote: userId === GUEST_ID ? null : createRemoteStore(supabase, userId),
    local: createLocalStore(),
    build: buildState,
    normalize: withRollover,
    hasUserContent,
    summarize: summarizeContent,
    merge: mergeGuestData,
  })
}

// The app's state for one user: cached in this browser, and for signed-in
// users kept in step with the server by the sync engine (see lib/syncEngine).
// → [state, updateState, sync]
export function usePersistedState(userId) {
  const [held, setHeld] = useState(() => makeEngine(userId))
  let engine = held
  if (held.userId !== userId) {
    engine = makeEngine(userId)
    setHeld(engine)
  }

  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot)

  useEffect(() => {
    engine.start()
    return () => engine.stop()
  }, [engine])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        engine.flush() // the tab may never come back — save now
      } else {
        engine.renormalize()
        engine.wake()
      }
    }
    const onOnline = () => engine.wake()
    const onPageHide = () => engine.flush()
    const interval = setInterval(() => {
      engine.renormalize() // day rollover for a tab left open past midnight
      if (document.visibilityState === 'visible') engine.refresh()
    }, REFRESH_INTERVAL_MS)

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onOnline)
    window.addEventListener('online', onOnline)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onOnline)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [engine])

  const updateState = useCallback((update) => engine.update(update), [engine])

  const sync = useMemo(
    () => ({
      status: snapshot.status,
      guestImport: snapshot.guestImport,
      retry: () => engine.flush(),
      flush: () => engine.flush(),
      hasPending: () => engine.hasPending(),
      acceptGuestImport: () => engine.acceptGuestImport(),
      dismissGuestImport: () => engine.dismissGuestImport(),
      clearLocal: () => engine.clearLocal(),
    }),
    [engine, snapshot.status, snapshot.guestImport],
  )

  return [snapshot.state, updateState, sync]
}
