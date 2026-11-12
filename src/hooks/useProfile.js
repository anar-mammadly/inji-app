import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { redirectTo } from '../contexts/AuthContext'

const empty = { first_name: '', last_name: '', profession: '', avatar_url: '' }

// Keep in step with the bucket limits in supabase/profiles.sql
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const AVATAR_EDGE_PX = 512

// Avatars are shown at 80px at most; scale big photos down before uploading.
// Falls back to the original file if the browser can't decode or encode it.
async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, AVATAR_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 300 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

// Called once (in App) and handed down, so the sidebar and the profile page
// always show the same name and photo.
export function useProfile(userId) {
  const [profile, setProfile] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || userId === 'guest') {
      setProfile(empty)
      return
    }
    let active = true
    setLoading(true)
    supabase
      .from('profiles')
      .select('first_name, last_name, profession, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setProfile(data ? { ...empty, ...data } : empty)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  async function saveProfile(fields) {
    const previous = profile
    const next = { ...profile, ...fields }
    setProfile(next)
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) setProfile(previous) // roll back the optimistic update
    return { error }
  }

  async function uploadAvatar(file) {
    if (!AVATAR_TYPES.includes(file.type)) return { error: { code: 'avatar_type' } }
    const image = await shrinkImage(file)
    if (image.size > AVATAR_MAX_BYTES) return { error: { code: 'avatar_too_large' } }

    const bucket = supabase.storage.from('avatars')
    // one fixed object per user, so a new photo replaces the old one
    const path = `${userId}/avatar`
    const { error: uploadError } = await bucket.upload(path, image, { upsert: true, contentType: image.type })
    if (uploadError) return { error: uploadError }

    // earlier versions stored "avatar.<ext>" — clear those leftovers
    const { data: files } = await bucket.list(userId)
    const stale = (files || []).filter((f) => f.name !== 'avatar').map((f) => `${userId}/${f.name}`)
    if (stale.length) await bucket.remove(stale)

    const { data } = bucket.getPublicUrl(path)
    // cache-bust so the new image shows even though the path is the same
    return saveProfile({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
  }

  async function changePassword(oldPassword, newPassword) {
    // verify the old password by re-authenticating
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) return { error: userErr ?? { message: 'Not signed in' } }
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword })
    if (authErr) {
      return { error: authErr.code === 'invalid_credentials' ? { code: 'wrong_current_password' } : authErr }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  async function changeEmail(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: redirectTo() })
    return { error }
  }

  // Removes the account and everything stored for it. The database side is the
  // `delete_own_account` function from supabase/schema.sql; rows in user_data
  // and profiles go with the user (on delete cascade).
  async function deleteAccount() {
    const bucket = supabase.storage.from('avatars')
    const { data: files } = await bucket.list(userId)
    if (files?.length) await bucket.remove(files.map((f) => `${userId}/${f.name}`))
    const { error } = await supabase.rpc('delete_own_account')
    if (error) return { error: error.code === 'PGRST202' ? { code: 'account_delete_unavailable' } : error }
    return { error: null }
  }

  return { profile, loading, saveProfile, uploadAvatar, changePassword, changeEmail, deleteAccount }
}
