import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

// 評価の作成
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
      project_id,
      application_id,
      ratee_type, // 'company' | 'organization' | 'student'
      ratee_id,
      score, // 1-5
      comment,
      communication_rating,
      quality_rating,
      punctuality_rating,
      professionalism_rating,
    } = body

    if (!project_id || !application_id || !ratee_type || !ratee_id || !score) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    if (score < 1 || score > 5) {
      return NextResponse.json(
        { error: '評価は1-5の範囲で入力してください' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 評価者の情報を取得
    let raterType: 'company' | 'organization' | 'student'
    let raterId: string

    if (authUser.type === 'company' && authUser.companyId) {
      raterType = 'company'
      raterId = authUser.companyId
    } else if (authUser.type === 'organization' && authUser.organizationId) {
      raterType = 'organization'
      raterId = authUser.organizationId
    } else if (authUser.type === 'student' && authUser.studentId) {
      raterType = 'student'
      raterId = authUser.studentId
    } else {
      return NextResponse.json(
        { error: '評価権限がありません' },
        { status: 403 }
      )
    }

    // 応募情報を確認（評価者がこの案件に関連しているか確認）
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('project_id, organization_id, student_id, status')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: '応募情報が見つかりません' },
        { status: 404 }
      )
    }

    if (application.project_id !== project_id) {
      return NextResponse.json(
        { error: '案件IDが一致しません' },
        { status: 400 }
      )
    }

    // 評価者が企業の場合、応募者は学生団体または学生個人である必要がある
    if (raterType === 'company') {
      if (ratee_type !== 'organization' && ratee_type !== 'student') {
        return NextResponse.json(
          { error: '企業は学生団体または学生個人のみ評価できます' },
          { status: 400 }
        )
      }
    }

    // 評価者が学生団体または学生個人の場合、被評価者は企業である必要がある
    if (raterType === 'organization' || raterType === 'student') {
      if (ratee_type !== 'company') {
        return NextResponse.json(
          { error: '学生は企業のみ評価できます' },
          { status: 400 }
        )
      }
    }

    // 評価を挿入（既存の評価がある場合は更新）
    const { data, error } = await supabase
      .from('ratings')
      .upsert(
        {
          project_id,
          application_id,
          rater_type: raterType,
          rater_id: raterId,
          ratee_type,
          ratee_id,
          score,
          comment: comment || null,
          communication_rating: communication_rating || null,
          quality_rating: quality_rating || null,
          punctuality_rating: punctuality_rating || null,
          professionalism_rating: professionalism_rating || null,
        },
        {
          onConflict: 'application_id,rater_type,rater_id',
        }
      )
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

// 評価の取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const applicationId = searchParams.get('application_id')
    const rateeType = searchParams.get('ratee_type')
    const rateeId = searchParams.get('ratee_id')

    const supabase = createServerClient()

    let query = supabase.from('ratings').select('*')

    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }
    if (rateeType) {
      query = query.eq('ratee_type', rateeType)
    }
    if (rateeId) {
      query = query.eq('ratee_id', rateeId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

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

