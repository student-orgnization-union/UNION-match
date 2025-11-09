import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// シングルトンインスタンスを保持（クライアントサイドのみ）
let supabaseClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // サーバーサイドでは毎回新しいインスタンスを作成
  if (typeof window === 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }

  // クライアントサイドではシングルトンを使用
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return supabaseClient
}
