import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// サーバー専用（Service Role）。必ずサーバーでのみ使用。
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yqnluaxuhbgtndmdmciv.supabase.co'

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  // プレビュー用フォールバック（本番は必ず環境変数に）
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxbmx1YXh1aGJndG5kbWRtY2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzMzA2NywiZXhwIjoyMDcwMjA5MDY3fQ.BU0-NJTe1h10J50ipTzGD9VC_MY-yMjxPSn64uWWfMo'

export function createServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server client is not configured.')
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey)
}
