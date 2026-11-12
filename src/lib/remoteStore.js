// The server side of the sync engine: one row per user in `user_data`.
// `token` is the row's updated_at exactly as the server returns it — it is
// only ever compared for equality, never parsed back and forth.
export function createRemoteStore(supabase, userId) {
  const table = () => supabase.from('user_data')

  return {
    // → { data, token } or null when the account has no row yet
    async load() {
      const { data, error } = await table().select('data, updated_at').eq('user_id', userId).maybeSingle()
      if (error) throw error
      if (!data) return null
      return { data: data.data && typeof data.data === 'object' ? data.data : {}, token: data.updated_at }
    },

    // just the version, to check cheaply whether another device has saved
    async peek() {
      const { data, error } = await table().select('updated_at').eq('user_id', userId).maybeSingle()
      if (error) throw error
      return data?.updated_at ?? null
    },

    // Write only if the server is still at `expectedToken` (null = no row yet).
    // → { ok: true, token } or { ok: false } when someone else saved first.
    async save(state, expectedToken) {
      const stamp = new Date().toISOString()

      if (expectedToken == null) {
        const { data, error } = await table()
          .insert({ user_id: userId, data: state, updated_at: stamp })
          .select('updated_at')
          .single()
        if (error) {
          if (error.code === '23505') return { ok: false } // row appeared meanwhile
          throw error
        }
        return { ok: true, token: data.updated_at }
      }

      const { data, error } = await table()
        .update({ data: state, updated_at: stamp })
        .eq('user_id', userId)
        .eq('updated_at', expectedToken)
        .select('updated_at')
      if (error) throw error
      if (!data || data.length === 0) return { ok: false }
      return { ok: true, token: data[0].updated_at }
    },
  }
}
