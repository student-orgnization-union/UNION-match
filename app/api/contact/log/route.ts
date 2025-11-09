import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

// 連絡履歴の記録
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const {
      application_id,
      recipient_type,
      recipient_id,
      contact_method,
      contact_info,
      message_preview,
      project_url,
      tracking_id,
    } = body

    // バリデーション
    if (!application_id || !contact_method || !project_url) {
      return NextResponse.json(
        { error: '必須項目が不足しています（application_id, contact_method, project_url）' },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // 応募情報を取得して権限チェック
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, project_id, organization_id, student_id, projects!inner(company_id)')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: '応募情報が見つかりません' },
        { status: 404 },
      )
    }

    const project = application.projects as any

    // 権限チェック: 当該applicationに関係するユーザーのみ記録可能
    let hasPermission = false
    let senderId: string | null = null

    if (authUser.type === 'company' && project.company_id === authUser.companyId) {
      hasPermission = true
      senderId = authUser.companyId
    } else if (authUser.type === 'organization' && application.organization_id === authUser.organizationId) {
      hasPermission = true
      senderId = authUser.organizationId
    } else if (authUser.type === 'student' && application.student_id === authUser.studentId) {
      hasPermission = true
      senderId = authUser.studentId
    }

    if (!hasPermission || !senderId) {
      return NextResponse.json(
        { error: 'この応募の連絡履歴を記録する権限がありません' },
        { status: 403 },
      )
    }

    // 連絡履歴を記録
    const { data: log, error: logError } = await supabase
      .from('contact_logs')
      .insert({
        application_id,
        sender_type: authUser.type,
        sender_id: senderId,
        recipient_type: recipient_type || null,
        recipient_id: recipient_id || null,
        contact_method,
        contact_info: contact_info || null,
        message_preview: message_preview || null,
        project_url,
        tracking_id: tracking_id || null,
      })
      .select()
      .single()

    if (logError) {
      console.error('Supabase error:', logError)
      return NextResponse.json(
        { error: '連絡履歴の記録に失敗しました' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: log })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

// 連絡履歴の取得
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('application_id')

    if (!applicationId) {
      return NextResponse.json(
        { error: 'application_idが必要です' },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // 応募情報を取得して権限チェック
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, project_id, organization_id, student_id, projects!inner(company_id)')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: '応募情報が見つかりません' },
        { status: 404 },
      )
    }

    const project = application.projects as any

    // 権限チェック
    let hasPermission = false
    if (authUser.type === 'company' && project.company_id === authUser.companyId) {
      hasPermission = true
    } else if (authUser.type === 'organization' && application.organization_id === authUser.organizationId) {
      hasPermission = true
    } else if (authUser.type === 'student' && application.student_id === authUser.studentId) {
      hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'この応募の連絡履歴を閲覧する権限がありません' },
        { status: 403 },
      )
    }

    // 連絡履歴を取得
    const { data: logs, error } = await supabase
      .from('contact_logs')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: '連絡履歴の取得に失敗しました' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: logs || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

