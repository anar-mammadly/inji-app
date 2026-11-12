// Keeps one user's app state in step between this browser and the server.
//
// The state is one JSON object, so two devices writing "the whole thing" would
// silently erase each other. The engine avoids that with three rules:
//
//   1. Every save is conditional. It names the server version it was based on
//      (`token`, the row's updated_at) and the server only accepts it if that
//      is still the current version.
//   2. Edits are kept as functions (`unsynced`) until the server has them. If a
//      save is refused because another device got there first, the engine
//      fetches the fresh copy and replays those edits on top of it — both
//      devices' changes survive.
//   3. Nothing is assumed to have been saved. Failed saves are retried with a
//      back-off, and the status is published so the UI can say so.
//
// No React and no DOM in here: the hook wires it to the page, tests drive it
// with a fake server.

export const GUEST_ID = 'guest'
export const GUEST_IMPORT_KEY = 'inji_guest_import'
export const stateKey = (userId) => `inji_state_${userId}`

const RETRY_STEPS_MS = [2_000, 5_000, 15_000, 30_000, 60_000]
const MAX_SAVE_ATTEMPTS = 3

// localStorage wrapper that never throws (private mode, full quota, ...) and
// understands the cache formats older versions of the app wrote.
export function createLocalStore(storage = globalThis.localStorage) {
  function parse(key) {
    try {
      const raw = storage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  return {
    // → { data, savedAt, baseToken, dirty, writer } — `dirty` is true/false, or
    // null when an old cache can't say whether it had unsaved changes
    read(key) {
      const parsed = parse(key)
      if (!parsed || typeof parsed !== 'object') return null
      if (parsed.__v === 2 && parsed.data && typeof parsed.data === 'object') {
        return {
          data: parsed.data,
          savedAt: parsed.savedAt ?? null,
          baseToken: parsed.baseToken ?? null,
          dirty: !!parsed.dirty,
          writer: parsed.writer ?? null,
        }
      }
      if (parsed.__v === 1 && parsed.data && typeof parsed.data === 'object') {
        return { data: parsed.data, savedAt: parsed.savedAt ?? null, baseToken: null, dirty: parsed.savedAt ? null : false }
      }
      if (parsed.__v === undefined) return { data: parsed, savedAt: null, baseToken: null, dirty: false }
      return null
    },
    write(key, entry) {
      try {
        storage.setItem(key, JSON.stringify({ __v: 2, ...entry }))
        return true
      } catch {
        return false
      }
    },
    readRaw: parse,
    writeRaw(key, value) {
      try {
        storage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
    remove(key) {
      try {
        storage.removeItem(key)
      } catch {
        // nothing to clean up if storage is unavailable
      }
    },
  }
}

function applyUpdate(update, base) {
  return typeof update === 'function' ? update(base) : update
}

// status: 'local'   guest — kept in this browser only
//         'loading' first fetch of the account's data
//         'pending' edits waiting for the next save
//         'syncing' save in flight
//         'synced'  server has everything
//         'offline' a load/save failed; will retry
export function createSyncEngine({
  userId,
  remote = null,
  local,
  build,
  normalize = (s) => s,
  hasUserContent = () => false,
  summarize = () => ({}),
  merge = (s) => s,
  debounceMs = 800,
  now = () => Date.now(),
  // identity of this tab, and a way to ask whether another tab is still open:
  // the cache is shared by every tab of the browser, so unsaved changes found
  // in it may belong to a tab that is alive and about to save them itself
  tabId = null,
  isTabAlive = async () => false,
}) {
  const key = stateKey(userId)
  const entry = local.read(key)

  // unsaved state left behind by an earlier page load (no edit functions to replay)
  let carry =
    remote && entry && entry.dirty !== false
      ? { state: build(entry.data), savedAt: entry.savedAt, baseToken: entry.baseToken, writer: entry.writer ?? null }
      : null
  let base = null // last state known to be on the server
  let token = entry?.baseToken ?? null // server version our state is based on
  let unsynced = [] // edits the server doesn't have yet
  let state = carry ? carry.state : build(entry?.data)
  let editedAt = carry?.savedAt ?? null
  let loaded = !remote
  let status = remote ? 'loading' : 'local'
  let guestImport = null

  let started = false
  let destroyed = false
  let timer = null
  let retryStep = 0
  let inFlight = null
  let loadPromise = null
  let again = false
  let refreshing = false

  const listeners = new Set()
  let snapshot = { state, status, guestImport }

  function emit() {
    snapshot = { state, status, guestImport }
    listeners.forEach((fn) => fn())
  }

  function setStatus(next) {
    if (status === next) return
    status = next
    emit()
  }

  const pending = () => carry !== null || unsynced.length > 0

  function persistLocal() {
    if (destroyed) return
    local.write(key, {
      data: state,
      savedAt: editedAt,
      baseToken: token,
      dirty: remote ? pending() : false,
      writer: tabId,
    })
  }

  function recompute() {
    const start = carry ? carry.state : (base ?? build(entry?.data))
    state = normalize(unsynced.reduce((s, update) => update(s), start))
  }

  // Line our state up with what the server has (row = { data, token } | null).
  function reconcile(row) {
    if (!row) {
      token = null
      base = null
      // first sync for this account: seed it with whatever is cached here
      if (!carry && entry && hasUserContent(entry.data)) {
        carry = { state: build(entry.data), savedAt: entry.savedAt, baseToken: null }
      }
    } else {
      if (carry) {
        // Leftover unsaved state survives only if it demonstrably belongs on
        // top of this server version, or is known to be the newer edit. An
        // unknown age never outranks a real server record.
        const continues = carry.baseToken != null && carry.baseToken === row.token
        const newer = carry.savedAt != null && Date.parse(carry.savedAt) > Date.parse(row.token)
        if (!continues && !newer) carry = null
      }
      token = row.token
      base = build(row.data)
    }
    recompute()
  }

  function schedule(ms) {
    if (!started || !remote || destroyed) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      flush()
    }, ms)
  }

  function scheduleRetry() {
    const wait = RETRY_STEPS_MS[Math.min(retryStep, RETRY_STEPS_MS.length - 1)]
    retryStep += 1
    schedule(wait)
  }

  // Guest data waiting from before sign-in: seed a brand-new account with it,
  // otherwise offer it to the user instead of silently dropping it.
  function resolveGuestImport(row) {
    const waiting = local.readRaw(GUEST_IMPORT_KEY)
    if (!waiting) return
    if (!hasUserContent(waiting)) {
      local.remove(GUEST_IMPORT_KEY)
      return
    }
    if (!row && !carry) {
      carry = { state: build(waiting), savedAt: new Date(now()).toISOString(), baseToken: null }
      editedAt = carry.savedAt
      local.remove(GUEST_IMPORT_KEY)
      recompute()
    } else {
      guestImport = summarize(waiting)
    }
  }

  function load() {
    if (loadPromise) return loadPromise
    loadPromise = (async () => {
      let row
      try {
        row = await remote.load()
      } catch {
        setStatus('offline')
        scheduleRetry()
        return
      }
      // Unsaved changes written by a tab that is still open are that tab's to
      // save. Adopting them here too would send the same edits twice.
      if (carry && carry.writer && carry.writer !== tabId) {
        const alive = await isTabAlive(carry.writer).catch(() => false)
        if (alive) carry = null
      }
      reconcile(row)
      resolveGuestImport(row)
      loaded = true
      retryStep = 0
      persistLocal()
      if (pending()) {
        status = 'pending'
        emit()
        schedule(0)
      } else {
        status = 'synced'
        emit()
      }
    })().finally(() => {
      loadPromise = null
    })
    return loadPromise
  }

  async function saveLoop() {
    let attempts = 0
    while (pending() && attempts < MAX_SAVE_ATTEMPTS) {
      attempts += 1
      const sending = state
      const sentEdits = unsynced.length
      setStatus('syncing')

      let result
      try {
        result = await remote.save(sending, token)
      } catch {
        setStatus('offline')
        scheduleRetry()
        return
      }

      if (result.ok) {
        token = result.token
        base = sending
        carry = null
        unsynced = unsynced.slice(sentEdits)
        retryStep = 0
        persistLocal()
        continue
      }

      // Someone else saved first. Take their version and put our edits on top.
      let row
      try {
        row = await remote.load()
      } catch {
        setStatus('offline')
        scheduleRetry()
        return
      }
      reconcile(row)
      persistLocal()
      emit()
    }

    if (pending()) {
      setStatus('offline')
      scheduleRetry()
    } else {
      setStatus('synced')
    }
  }

  // Save now (skipping the debounce). Resolves when the attempt has finished.
  function flush() {
    if (!remote || destroyed) return Promise.resolve()
    if (inFlight) {
      again = true
      return inFlight
    }
    clearTimeout(timer)
    timer = null
    inFlight = (loaded ? saveLoop() : load()).finally(() => {
      inFlight = null
      if (again) {
        again = false
        if (pending()) schedule(0)
      }
    })
    return inFlight
  }

  // Pick up changes made on another device. Only when we have nothing unsaved
  // ourselves — otherwise the next save handles it through the conflict path.
  async function refresh() {
    if (!remote || !loaded || inFlight || refreshing || pending()) return
    refreshing = true
    try {
      const latest = await remote.peek()
      if (latest !== token && !pending() && !inFlight) {
        const row = await remote.load()
        if (!pending() && !inFlight) {
          reconcile(row)
          persistLocal()
          status = 'synced'
          emit()
        }
      }
    } catch {
      // a failed check is not an error state — the next save will find out
    } finally {
      refreshing = false
    }
  }

  return {
    userId,

    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    getSnapshot: () => snapshot,
    hasPending: pending,

    start() {
      if (started) return
      started = true
      if (!remote) return
      // Whatever was made as a guest moves out of the guest slot the moment
      // someone signs in; it is either seeded or offered once the account loads.
      const guest = local.read(stateKey(GUEST_ID))
      if (guest && hasUserContent(guest.data)) local.writeRaw(GUEST_IMPORT_KEY, guest.data)
      local.remove(stateKey(GUEST_ID))
      if (!loaded) load()
      else if (pending()) schedule(0)
    },

    stop() {
      if (!started) return
      clearTimeout(timer)
      timer = null
      // last chance to get edits out before this user's engine goes away
      if (remote && loaded && pending() && !destroyed) flush()
      started = false
    },

    update(update) {
      const edit = (s) => applyUpdate(update, normalize(s))
      state = edit(state)
      editedAt = new Date(now()).toISOString()
      if (remote) {
        unsynced.push(edit)
        if (loaded && status !== 'syncing') status = 'pending'
      }
      persistLocal()
      emit()
      if (remote && loaded) schedule(debounceMs)
    },

    // re-apply `normalize` (the midnight rollover) as a local view change:
    // no save, so an idle tab can't overwrite another device's data
    renormalize() {
      const next = normalize(state)
      if (next === state) return
      state = next
      emit()
    },

    flush,
    refresh,

    // called when the network or the tab comes back
    wake() {
      if (!remote) return
      if (!loaded || status === 'offline' || pending()) flush()
      else refresh()
    },

    acceptGuestImport() {
      const waiting = local.readRaw(GUEST_IMPORT_KEY)
      local.remove(GUEST_IMPORT_KEY)
      guestImport = null
      if (waiting) this.update((s) => merge(s, waiting))
      else emit()
    },

    dismissGuestImport() {
      local.remove(GUEST_IMPORT_KEY)
      guestImport = null
      emit()
    },

    // forget this user's cached copy on this device (sign-out)
    clearLocal() {
      destroyed = true
      clearTimeout(timer)
      timer = null
      local.remove(key)
      local.remove(GUEST_IMPORT_KEY)
    },
  }
}
