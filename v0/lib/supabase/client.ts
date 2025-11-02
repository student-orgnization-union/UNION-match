import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// 本番では環境変数を使用してください。下記はプレビュー用フォールバック。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqnluaxuhbgtndmdmciv.supabase.co"

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxbmx1YXh1aGJndG5kbWRtY2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzMwNjcsImV4cCI6MjA3MDIwOTA2N30.NFFFI4yhDZSU-nWDTIc2M8ODjuXqy8oEqgM5sQ2G-P0"

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase client is not configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    )
  }

  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw new Error("Failed to initialize Supabase client. Please check your configuration.")
  }
}
