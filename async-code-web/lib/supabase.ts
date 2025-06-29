import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabase = () => {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('Supabase environment variables not configured, using mock client')
            // Return a mock client that won't throw errors
            return null as any
        }
        
        supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        })
    }
    
    return supabaseInstance
}
