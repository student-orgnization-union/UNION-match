import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

/**
 * 認証済みユーザーを削除するAPI
 * 登録が失敗した場合に、作成されたユーザーを削除するために使用
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser || !authUser.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 },
      )
    }

    const supabase = createServerClient()

    // ユーザーを削除
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.user.id)

    if (deleteError) {
      console.error('User delete error:', deleteError)
      return NextResponse.json(
        { error: 'ユーザーの削除に失敗しました' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ユーザーを削除しました',
    })
  } catch (error: any) {
    console.error('API error (/api/auth/delete-user):', error)
    return NextResponse.json(
      { error: error?.message || 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

