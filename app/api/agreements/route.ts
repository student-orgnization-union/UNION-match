import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

// 合意シートの作成
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
      scope_text,
      deliverables_json,
      due_at,
      amount,
      ip_terms,
      communication_channel,
    } = body

    // バリデーション
    if (!application_id || !scope_text || !due_at) {
      return NextResponse.json(
        { error: '必須項目が不足しています（application_id, scope_text, due_at）' },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // 応募情報を取得して権限チェック
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, project_id, organization_id, student_id, status, projects!inner(company_id)')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: '応募情報が見つかりません' },
        { status: 404 },
      )
    }

    const project = application.projects as any

    // 権限チェック: 企業側 or 学生側のみ作成可能
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
        { error: 'この応募の合意シートを作成する権限がありません' },
        { status: 403 },
      )
    }

    // ステータスチェック: accepted または agreed の場合のみ作成可能
    if (application.status !== 'accepted' && application.status !== 'agreed') {
      return NextResponse.json(
        { error: '承認済みの応募のみ合意シートを作成できます' },
        { status: 400 },
      )
    }

    // 既存の合意シートを取得（最新バージョン）
    const { data: existingAgreement } = await supabase
      .from('agreements')
      .select('version')
      .eq('application_id', application_id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = existingAgreement ? existingAgreement.version + 1 : 1

    // 合意シートを作成
    const { data: agreement, error: agreementError } = await supabase
      .from('agreements')
      .insert({
        application_id,
        scope_text,
        deliverables_json: deliverables_json || null,
        due_at,
        amount: amount || null,
        ip_terms: ip_terms || null,
        communication_channel: communication_channel || null,
        version: nextVersion,
      })
      .select()
      .single()

    if (agreementError) {
      console.error('Supabase error:', agreementError)
      return NextResponse.json(
        { error: '合意シートの作成に失敗しました' },
        { status: 500 },
      )
    }

    // 監査ログの記録
    try {
      await supabase.rpc('log_audit', {
        p_entity: 'agreement',
        p_entity_id: agreement.id,
        p_action: 'created',
        p_actor_id: authUser.userId,
        p_meta: { application_id, version: nextVersion },
      })
    } catch (logError) {
      // 監査ログの記録に失敗しても処理は続行
      console.warn('Failed to log audit:', logError)
    }

    return NextResponse.json({ success: true, data: agreement })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

// 合意シートの取得（application_idで検索）
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
    const agreementId = searchParams.get('id')

    if (!applicationId && !agreementId) {
      return NextResponse.json(
        { error: 'application_id または id が必要です' },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    let query = supabase
      .from('agreements')
      .select(`
        *,
        applications!inner(
          id,
          project_id,
          organization_id,
          student_id,
          status,
          projects!inner(company_id)
        )
      `)

    if (agreementId) {
      query = query.eq('id', agreementId)
    } else {
      query = query.eq('application_id', applicationId)
    }

    const { data: agreements, error } = await query.order('version', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: '合意シートの取得に失敗しました' },
        { status: 500 },
      )
    }

    if (!agreements || agreements.length === 0) {
      return NextResponse.json({ success: true, data: null })
    }

    // 権限チェック（最初の合意シートのapplicationで確認）
    const firstAgreement = agreements[0] as any
    const application = firstAgreement.applications

    if (!application) {
      return NextResponse.json(
        { error: '応募情報が見つかりません' },
        { status: 404 },
      )
    }

    const project = application.projects

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
        { error: 'この合意シートを閲覧する権限がありません' },
        { status: 403 },
      )
    }

    // 最新バージョンのみ返す（agreementIdが指定されていない場合）
    const result = agreementId ? agreements[0] : agreements[0]

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

