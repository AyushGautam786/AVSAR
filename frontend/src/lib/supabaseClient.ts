import { createClient } from '@supabase/supabase-js'

// Keep the UI renderable in local previews where auth env values may be absent.
// Production deployments still use the configured Supabase values.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'local-preview-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
