import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Snapshot the URL fragment before the client parses and clears it, so the
// app can tell it was opened from a password-reset link (or an expired one)
// even if the PASSWORD_RECOVERY event fires before anything subscribes.
export const initialAuthParams = new URLSearchParams(window.location.hash.slice(1))

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
