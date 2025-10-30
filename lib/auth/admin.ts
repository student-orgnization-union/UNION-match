import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

import { createServerClient } from '@/lib/supabase/server'

type AdminCheckResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; message: string }

// Allow local development without Supabase credentials while keeping prod locked down.
const DEV_BYPASS =
  process.env.NODE_ENV === 'development' &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const adminEmailEnv =
  process.env.SUPABASE_ADMIN_EMAILS ||
  process.env.ADMIN_EMAILS ||
  process.env.NEXT_PUBLIC_ADMIN_EMAILS

// Fallback email allowlist so operators can elevate accounts without editing app_metadata.
const ADMIN_EMAILS = adminEmailEnv
  ? adminEmailEnv.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
  : []

function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false

  const rolesMeta = user.app_metadata?.roles
  const singleRole = user.app_metadata?.role
  const metadataFlags = [
    user.app_metadata?.is_admin,
    user.user_metadata?.is_admin,
    user.user_metadata?.admin,
  ]

  const roles: string[] = Array.isArray(rolesMeta)
    ? rolesMeta
    : typeof rolesMeta === 'string'
      ? [rolesMeta]
      : []

  // Primary signal when auth hook adds explicit admin role.
  if (roles.includes('admin')) return true
  if (singleRole === 'admin') return true
  if (metadataFlags.some((value) => value === true || value === 'true')) return true

  const email = user.email?.toLowerCase()
  if (email && ADMIN_EMAILS.includes(email)) return true

  return false
}

export async function requireAdmin(request: NextRequest): Promise<AdminCheckResult> {
  if (DEV_BYPASS) {
    return {
      ok: true,
      user: {
        id: 'dev-bypass',
        email: 'dev@localhost',
        app_metadata: { provider: 'anon', roles: ['admin'] },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User,
    }
  }

  const authorization = request.headers.get('authorization') ?? ''
  const [, token] = authorization.match(/^Bearer\s+(.+)$/i) ?? []

  if (!token) {
    return { ok: false, status: 401, message: 'Missing bearer token' }
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return { ok: false, status: 401, message: 'Invalid or expired token' }
    }

    if (!isAdminUser(data.user)) {
      return { ok: false, status: 403, message: 'Forbidden' }
    }

    return { ok: true, user: data.user }
  } catch (error) {
    console.error('Admin auth check failed:', error)
    return { ok: false, status: 401, message: 'Authentication failed' }
  }
}
