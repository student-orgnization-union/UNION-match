import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type UserType = 'organization' | 'company' | null

export interface AuthenticatedUser {
  user: User
  type: UserType
  organizationId?: string
  companyId?: string
}

/**
 * 現在のユーザー情報とユーザータイプを取得
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createServerClient()
    const authHeader = request.headers.get('authorization')

    // Authorizationヘッダーからトークンを取得
    let user: User | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    } else {
      // Cookieからセッションを取得（Next.jsのクッキー処理が必要）
      // ここでは簡略化のため、直接Supabaseクライアントを使用
      // 実際の実装では、cookies().get()などからトークンを取得する必要があります
    }

    if (!user) return null

    // 団体アカウントか確認
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (orgData) {
      return {
        user,
        type: 'organization',
        organizationId: orgData.id,
      }
    }

    // 企業アカウントか確認
    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyData) {
      return {
        user,
        type: 'company',
        companyId: companyData.id,
      }
    }

    return {
      user,
      type: null,
    }
  } catch {
    return null
  }
}

/**
 * 企業アカウントか確認
 */
export async function requireCompany(request: Request): Promise<AuthenticatedUser | null> {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser || authUser.type !== 'company') {
    return null
  }
  return authUser
}

/**
 * 団体アカウントか確認
 */
export async function requireOrganization(request: Request): Promise<AuthenticatedUser | null> {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser || authUser.type !== 'organization') {
    return null
  }
  return authUser
}
