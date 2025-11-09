import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

// 応募ステータスの更新（企業が承認/拒否/完了を設定）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 },
      )
    }

    if (authUser.type !== 'company' || !authUser.companyId) {
      return NextResponse.json(
        { error: '企業アカウントでログインしてください' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { status } = body

    // 既存ステータス + 新しいステータス
    const validStatuses = [
      'pending',           // 審査中（既存）
      'accepted',          // 承認済み（既存）
      'rejected',          // 不承認（既存）
      'agreed',            // 合意済み（新規）
      'kickoff_scheduled', // キックオフ予定（新規）
      'in_progress',       // 実行中（新規）
      'delivering',        // 納品中（新規）
      'under_review',      // 検収中（新規）
      'revisions',         // 修正依頼（新規）
      'completed',         // 完了（既存）
      'rated',             // 評価済み（新規）
    ]
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 応募情報を取得して、この応募が企業の案件に属しているか確認
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('project_id, projects!inner(company_id)')
      .eq('id', params.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: '応募情報が見つかりません' },
        { status: 404 }
      )
    }

    const project = application.projects as any
    if (!project || project.company_id !== authUser.companyId) {
      return NextResponse.json(
        { error: 'この応募を管理する権限がありません' },
        { status: 403 }
      )
    }

    // ステータス更新
    const updateData: any = { status }
    
    // 既存のタイムスタンプ更新（後方互換性）
    if (status === 'accepted') {
      updateData.accepted_at = new Date().toISOString()
    }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }
    
    // 新しいステータス遷移のタイムスタンプ
    if (status === 'agreed') {
      // agreed_atはagreementsテーブルで管理されるため、ここでは更新しない
    }
    
    if (status === 'kickoff_scheduled') {
      updateData.kickoff_scheduled_at = new Date().toISOString()
    }
    
    // 監査ログの記録（将来実装）
    // await log_audit('application', params.id, `status_changed_to_${status}`, authUser.userId, { old_status: application.status, new_status: status })

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', params.id)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 応募情報の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 },
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('applications')
      .select(
        `
        id, project_id, appeal, organization_name, contact_info, 
        status, created_at, accepted_at, completed_at,
        projects(id, title, company_id),
        organization_id,
        student_id
        `
      )
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: '応募情報が見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック
    const project = data.projects as any
    if (authUser.type === 'company') {
      if (!project || project.company_id !== authUser.companyId) {
        return NextResponse.json(
          { error: 'この応募を閲覧する権限がありません' },
          { status: 403 }
        )
      }
    } else if (authUser.type === 'organization') {
      if (data.organization_id !== authUser.organizationId) {
        return NextResponse.json(
          { error: 'この応募を閲覧する権限がありません' },
          { status: 403 }
        )
      }
    } else if (authUser.type === 'student') {
      if (data.student_id !== authUser.studentId) {
        return NextResponse.json(
          { error: 'この応募を閲覧する権限がありません' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

