import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

/**
 * メール確認後に企業情報の登録を完了するAPI
 * メール確認が必要な場合、ユーザーメタデータに保存された企業情報をcompaniesテーブルに登録します
 */
export async function POST(request: NextRequest) {
  try {
    // 認証トークンからユーザー情報を取得（companiesテーブルにレコードがなくてもOK）
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 },
      )
    }

    // ユーザーのメタデータに企業情報があるか確認
    if (authUser.user?.user_metadata?.type !== 'company' && !authUser.user?.user_metadata?.pending_company_registration) {
      return NextResponse.json(
        { error: 'このアカウントは企業アカウントではありません' },
        { status: 403 },
      )
    }

    const supabase = createServerClient()

    // ユーザーメタデータから企業情報を取得
    const user = authUser.user

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 401 },
      )
    }

    const metadata = user.user_metadata || {}
    
    // 既にcompaniesテーブルに登録されているか確認
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingCompany) {
      return NextResponse.json({
        success: true,
        message: '既に登録済みです',
        company: existingCompany,
      })
    }

    // メタデータから企業情報を取得
    const companyName = metadata.company_name
    const contactEmail = metadata.company_contact_email || user.email
    const website = metadata.company_website || null
    const logoUrl = metadata.company_logo_url || null
    const description = metadata.company_description || null

    if (!companyName) {
      return NextResponse.json(
        { error: '企業情報が見つかりません。再度登録を行ってください。' },
        { status: 400 },
      )
    }

    // companiesテーブルに登録
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        name: companyName,
        contact_email: contactEmail,
        website: website,
        logo_url: logoUrl,
        description: description,
      })
      .select('id, name, contact_email')
      .single()

    if (companyError) {
      console.error('Company insert error:', companyError)
      return NextResponse.json(
        { error: '企業情報の登録に失敗しました' },
        { status: 500 },
      )
    }

    // メタデータから登録待ちフラグを削除（オプション）
    // サーバーサイドでは直接更新できないため、クライアントサイドで処理
    // ログイン時に自動的に処理される

    return NextResponse.json({
      success: true,
      company: companyData,
    })
  } catch (error: any) {
    console.error('API error (/api/complete-registration/company):', error)
    return NextResponse.json(
      { error: error?.message || 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

