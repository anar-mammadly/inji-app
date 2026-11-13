import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GUEST_IMPORT_KEY, createLocalStore, createSyncEngine, stateKey } from './syncEngine'

// ---- fakes -----------------------------------------------------------------

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map),
  }
}

// One shared "server row" that several engines (devices) can talk to.
function fakeServer(initial = null) {
  let row = initial // { data, token }
  let clock = 1_000
  const server = {
    online: true,
    saves: 0,
    get row() {
      return row
    },
    set(data) {
      clock += 1_000
      row = { data, token: new Date(clock).toISOString() }
    },
    remote() {
      const check = () => {
        if (!server.online) throw new Error('offline')
      }
      return {
        async load() {
          check()
          return row ? { data: structuredClone(row.data), token: row.token } : null
        },
        async peek() {
          check()
          return row?.token ?? null
        },
        async save(state, expected) {
          check()
          if ((row?.token ?? null) !== (expected ?? null)) return { ok: false }
          server.saves += 1
          server.set(structuredClone(state))
          return { ok: true, token: row.token }
        },
      }
    },
  }
  return server
}

const build = (raw) => ({ items: [], ...(raw || {}) })
const hasUserContent = (data) => (data?.items || []).length > 0
const add = (item) => (s) => ({ ...s, items: [...s.items, item] })

function device(server, storage = memoryStorage(), userId = 'u1', extra = {}) {
  const engine = createSyncEngine({
    ...extra,
    userId,
    remote: server ? server.remote() : null,
    local: createLocalStore(storage),
    build,
    hasUserContent,
    summarize: (d) => ({ items: d.items.length }),
    merge: (s, guest) => ({ ...s, items: [...s.items, ...guest.items] }),
    debounceMs: 100,
  })
  return { engine, storage, items: () => engine.getSnapshot().state.items, status: () => engine.getSnapshot().status }
}

const settle = () => vi.runAllTimersAsync()

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

// ---- tests -----------------------------------------------------------------

describe('sync engine', () => {
  it('loads the server copy and reports synced', async () => {
    const server = fakeServer({ data: { items: ['a'] }, token: 't0' })
    const d = device(server)
    expect(d.status()).toBe('loading')
    d.engine.start()
    await settle()
    expect(d.items()).toEqual(['a'])
    expect(d.status()).toBe('synced')
  })

  it('debounces a burst of edits into one save', async () => {
    const server = fakeServer({ data: { items: [] }, token: 't0' })
    const d = device(server)
    d.engine.start()
    await settle()
    d.engine.update(add('a'))
    d.engine.update(add('b'))
    d.engine.update(add('c'))
    expect(d.status()).toBe('pending')
    await settle()
    expect(server.saves).toBe(1)
    expect(server.row.data.items).toEqual(['a', 'b', 'c'])
    expect(d.status()).toBe('synced')
  })

  it('a stale open tab does not erase what another device saved', async () => {
    const server = fakeServer({ data: { items: ['base'] }, token: 't0' })
    const laptop = device(server)
    const phone = device(server)
    laptop.engine.start()
    phone.engine.start()
    await settle()

    phone.engine.update(add('from-phone'))
    await settle()
    // the laptop tab never refreshed — it still shows only "base"
    expect(laptop.items()).toEqual(['base'])

    laptop.engine.update(add('from-laptop'))
    await settle()

    expect(server.row.data.items).toEqual(['base', 'from-phone', 'from-laptop'])
    expect(laptop.items()).toEqual(['base', 'from-phone', 'from-laptop'])
    expect(laptop.status()).toBe('synced')
  })

  it('refresh() picks up another device’s changes when nothing is unsaved', async () => {
    const server = fakeServer({ data: { items: [] }, token: 't0' })
    const a = device(server)
    const b = device(server)
    a.engine.start()
    b.engine.start()
    await settle()
    a.engine.update(add('x'))
    await settle()
    await b.engine.refresh()
    expect(b.items()).toEqual(['x'])
  })

  it('edits made before the first load are replayed on top of the server copy', async () => {
    const server = fakeServer({ data: { items: ['server'] }, token: 't0' })
    const d = device(server)
    d.engine.update(add('early'))
    d.engine.start()
    await settle()
    expect(server.row.data.items).toEqual(['server', 'early'])
  })

  it('reports offline, keeps the edit locally and retries until it lands', async () => {
    const server = fakeServer({ data: { items: [] }, token: 't0' })
    const d = device(server)
    d.engine.start()
    await settle()

    server.online = false
    d.engine.update(add('a'))
    await vi.advanceTimersByTimeAsync(150)
    expect(d.status()).toBe('offline')
    expect(server.row.data.items).toEqual([])
    expect(JSON.parse(d.storage.dump()[stateKey('u1')]).dirty).toBe(true)

    server.online = true
    await settle() // back-off timer fires
    expect(server.row.data.items).toEqual(['a'])
    expect(d.status()).toBe('synced')
  })

  it('a failed first load does not block the session: edits sync once the server is reachable', async () => {
    const server = fakeServer({ data: { items: ['server'] }, token: 't0' })
    server.online = false
    const d = device(server)
    d.engine.start()
    await vi.advanceTimersByTimeAsync(10)
    expect(d.status()).toBe('offline')
    d.engine.update(add('offline-edit'))
    server.online = true
    d.engine.wake()
    await settle()
    expect(server.row.data.items).toEqual(['server', 'offline-edit'])
  })

  it('unsaved edits survive a reload and are pushed when the server has not moved', async () => {
    const server = fakeServer({ data: { items: [] }, token: 't0' })
    const first = device(server)
    first.engine.start()
    await settle()
    server.online = false
    first.engine.update(add('unsaved'))
    await vi.advanceTimersByTimeAsync(150)
    first.engine.stop()

    // reload: a fresh engine over the same browser storage
    server.online = true
    const second = device(server, first.storage)
    expect(second.items()).toEqual(['unsaved'])
    second.engine.start()
    await settle()
    expect(server.row.data.items).toEqual(['unsaved'])
  })

  it('a second tab leaves another live tab’s unsaved edits for that tab to save', async () => {
    const server = fakeServer({ data: { items: [] }, token: 't0' })
    const storage = memoryStorage()
    const alive = new Set(['tab-a'])
    const isTabAlive = async (id) => alive.has(id)
    const tabA = device(server, storage, 'u1', { tabId: 'tab-a', isTabAlive })
    tabA.engine.start()
    await settle()

    server.online = false
    tabA.engine.update(add('once'))
    await vi.advanceTimersByTimeAsync(150)
    server.online = true

    // tab B opens while A is alive and still holding the unsaved edit
    const tabB = device(server, storage, 'u1', { tabId: 'tab-b', isTabAlive })
    tabB.engine.start()
    await settle()

    expect(server.row.data.items).toEqual(['once'])
    await tabB.engine.refresh()
    expect(tabB.items()).toEqual(['once'])
  })

  it('a cache of unknown age never overwrites a real server record', async () => {
    const storage = memoryStorage({
      [stateKey('u1')]: JSON.stringify({ __v: 1, data: { items: ['stale-device'] }, savedAt: null }),
    })
    const server = fakeServer({ data: { items: ['cloud'] }, token: new Date(5_000).toISOString() })
    const d = device(server, storage)
    d.engine.start()
    await settle()
    expect(d.items()).toEqual(['cloud'])
    expect(server.saves).toBe(0)
  })

  it('seeds a brand-new account with guest data', async () => {
    const storage = memoryStorage({
      [stateKey('guest')]: JSON.stringify({ __v: 2, data: { items: ['guest-task'] }, dirty: false }),
    })
    const server = fakeServer(null)
    const d = device(server, storage)
    d.engine.start()
    await settle()
    expect(server.row.data.items).toEqual(['guest-task'])
    expect(storage.dump()[stateKey('guest')]).toBeUndefined()
    expect(storage.dump()[GUEST_IMPORT_KEY]).toBeUndefined()
  })

  it('offers guest data instead of dropping it when the account already has data', async () => {
    const storage = memoryStorage({
      [stateKey('guest')]: JSON.stringify({ __v: 2, data: { items: ['guest-task'] }, dirty: false }),
    })
    const server = fakeServer({ data: { items: ['cloud'] }, token: 't0' })
    const d = device(server, storage)
    d.engine.start()
    await settle()
    expect(d.items()).toEqual(['cloud'])
    expect(d.engine.getSnapshot().guestImport).toEqual({ items: 1 })

    d.engine.acceptGuestImport()
    await settle()
    expect(server.row.data.items).toEqual(['cloud', 'guest-task'])
    expect(d.engine.getSnapshot().guestImport).toBeNull()
  })

  it('guest mode stays in the browser and writes nothing until the first edit', async () => {
    const d = device(null, memoryStorage(), 'guest')
    d.engine.start()
    expect(d.status()).toBe('local')
    expect(d.storage.dump()).toEqual({})
    d.engine.update(add('a'))
    expect(JSON.parse(d.storage.dump()[stateKey('guest')]).data.items).toEqual(['a'])
  })

  it('clearLocal removes the cached copy and stops writing it back', async () => {
    const server = fakeServer({ data: { items: ['a'] }, token: 't0' })
    const d = device(server)
    d.engine.start()
    await settle()
    d.engine.clearLocal()
    d.engine.stop()
    await settle()
    expect(d.storage.dump()[stateKey('u1')]).toBeUndefined()
  })
})
