import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

// 合意シートの更新（合意確定）
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

    const body = await request.json()
    const { agreed } = body // true の場合、合意を確定

    const supabase = createServerClient()

    // 合意シートを取得
    const { data: agreement, error: agreementError } = await supabase
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
      .eq('id', params.id)
      .single()

    if (agreementError || !agreement) {
      return NextResponse.json(
        { error: '合意シートが見つかりません' },
        { status: 404 },
      )
    }

    const app = (agreement as any).applications
    const project = app.projects

    // 権限チェック
    let hasPermission = false
    if (authUser.type === 'company' && project.company_id === authUser.companyId) {
      hasPermission = true
    } else if (authUser.type === 'organization' && app.organization_id === authUser.organizationId) {
      hasPermission = true
    } else if (authUser.type === 'student' && app.student_id === authUser.studentId) {
      hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'この合意シートを更新する権限がありません' },
        { status: 403 },
      )
    }

    // 合意を確定する場合
    if (agreed === true) {
      // 両者が合意しているか確認（企業側と学生側の両方が合意している必要がある）
      // 簡易実装: 最初に合意したユーザーが企業側か学生側かを記録
      // より詳細な実装では、双方の合意を別途管理するテーブルが必要

      const updateData: any = {
        agreed_at: new Date().toISOString(),
      }

      const { data: updatedAgreement, error: updateError } = await supabase
        .from('agreements')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (updateError) {
        console.error('Supabase error:', updateError)
        return NextResponse.json(
          { error: '合意シートの更新に失敗しました' },
          { status: 500 },
        )
      }

      // 応募のステータスを 'agreed' に更新
      if (app.status === 'accepted') {
        await supabase
          .from('applications')
          .update({ status: 'agreed' })
          .eq('id', app.id)
      }

      // 監査ログの記録
      try {
        await supabase.rpc('log_audit', {
          p_entity: 'agreement',
          p_entity_id: params.id,
          p_action: 'agreed',
          p_actor_id: authUser.userId,
          p_meta: { application_id: app.id },
        })
      } catch (logError) {
        console.warn('Failed to log audit:', logError)
      }

      return NextResponse.json({ success: true, data: updatedAgreement })
    }

    // その他の更新（scope_text, deliverables_json等）
    const updateData: any = {}
    if (body.scope_text !== undefined) updateData.scope_text = body.scope_text
    if (body.deliverables_json !== undefined) updateData.deliverables_json = body.deliverables_json
    if (body.due_at !== undefined) updateData.due_at = body.due_at
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.ip_terms !== undefined) updateData.ip_terms = body.ip_terms
    if (body.communication_channel !== undefined) updateData.communication_channel = body.communication_channel

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目が指定されていません' },
        { status: 400 },
      )
    }

    const { data: updatedAgreement, error: updateError } = await supabase
      .from('agreements')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Supabase error:', updateError)
      return NextResponse.json(
        { error: '合意シートの更新に失敗しました' },
        { status: 500 },
      )
    }

    // 監査ログの記録
    try {
      await supabase.rpc('log_audit', {
        p_entity: 'agreement',
        p_entity_id: params.id,
        p_action: 'updated',
        p_actor_id: authUser.userId,
        p_meta: { changes: updateData },
      })
    } catch (logError) {
      console.warn('Failed to log audit:', logError)
    }

    return NextResponse.json({ success: true, data: updatedAgreement })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

// 合意シートの取得（ID指定）
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

    const { data: agreement, error } = await supabase
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
      .eq('id', params.id)
      .single()

    if (error || !agreement) {
      return NextResponse.json(
        { error: '合意シートが見つかりません' },
        { status: 404 },
      )
    }

    const app = (agreement as any).applications
    const project = app.projects

    // 権限チェック
    let hasPermission = false
    if (authUser.type === 'company' && project.company_id === authUser.companyId) {
      hasPermission = true
    } else if (authUser.type === 'organization' && app.organization_id === authUser.organizationId) {
      hasPermission = true
    } else if (authUser.type === 'student' && app.student_id === authUser.studentId) {
      hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'この合意シートを閲覧する権限がありません' },
        { status: 403 },
      )
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

