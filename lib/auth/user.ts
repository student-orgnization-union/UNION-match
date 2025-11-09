import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type UserType = 'organization' | 'company' | 'student' | null

export interface AuthenticatedUser {
  user: User
  type: UserType
  organizationId?: string
  companyId?: string
  studentId?: string
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
      console.log('[Auth] Token received, length:', token?.length)
      const { data, error } = await supabase.auth.getUser(token)
      
      if (error) {
        console.error('[Auth] getUser error:', error.message, error.status)
        return null
      }
      
      user = data.user
      console.log('[Auth] User found:', user?.id, user?.email)
    } else {
      console.log('[Auth] No Bearer token in header')
      // Cookieからセッションを取得（Next.jsのクッキー処理が必要）
      // ここでは簡略化のため、直接Supabaseクライアントを使用
      // 実際の実装では、cookies().get()などからトークンを取得する必要があります
    }

    if (!user) {
      console.log('[Auth] No user found')
      return null
    }

    // 学生個人アカウントか確認
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (studentData) {
      return {
        user,
        type: 'student',
        studentId: studentData.id,
      }
    }

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
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError && companyError.code !== 'PGRST116') {
      // PGRST116は「行が見つからない」エラーなので無視
      console.error('[Auth] Company lookup error:', companyError.message)
    }

    if (companyData) {
      console.log('[Auth] Company found:', companyData.id)
      return {
        user,
        type: 'company',
        companyId: companyData.id,
      }
    }

    // companiesテーブルにレコードがなくても、メタデータに企業情報がある場合は企業アカウントとして扱う
    const metadata = user.user_metadata || {}
    if (metadata.type === 'company' || metadata.pending_company_registration || metadata.company_name) {
      return {
        user,
        type: 'company',
        companyId: undefined, // まだcompaniesテーブルに登録されていない
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

/**
 * 学生個人アカウントか確認
 */
export async function requireStudent(request: Request): Promise<AuthenticatedUser | null> {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser || authUser.type !== 'student') {
    return null
  }
  return authUser
}
