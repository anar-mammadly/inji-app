import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const empty = { first_name: '', last_name: '', profession: '', avatar_url: '' }

export function useProfile(userId) {
  const [profile, setProfile] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || userId === 'guest') { setProfile(empty); return }
    setLoading(true)
    supabase
      .from('profiles')
      .select('first_name, last_name, profession, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ ...empty, ...data })
        setLoading(false)
      })
  }, [userId])

  async function saveProfile(fields) {
    const next = { ...profile, ...fields }
    setProfile(next)
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { user_id: userId, ...next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (error) setProfile(profile) // rollback
    return { error }
  }

  async function uploadAvatar(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${userId}/avatar.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) return { error: upErr }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // Cache-bust so the new image loads even if path is the same
    const url = `${data.publicUrl}?t=${Date.now()}`
    return saveProfile({ avatar_url: url })
  }

  async function changePassword(oldPassword, newPassword) {
    // Verify old password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser()
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    })
    if (authErr) return { error: { message: 'Köhnə şifrə yanlışdır' } }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  async function changeEmail(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    return { error }
  }

  return { profile, loading, saveProfile, uploadAvatar, changePassword, changeEmail }
}
