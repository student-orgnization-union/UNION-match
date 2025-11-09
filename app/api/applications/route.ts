import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

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
    const { project_id, appeal, organization_name, contact_info } = body

    if (!project_id || !appeal || !contact_info) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 学生団体の場合
    if (authUser.type === 'organization' && authUser.organizationId) {
      let resolvedOrganizationName = organization_name || null
      let resolvedContactInfo = contact_info

      if (!organization_name) {
        const { data: orgProfile } = await supabase
          .from('organizations')
          .select('name, contact_email')
          .eq('id', authUser.organizationId)
          .single()

        resolvedOrganizationName = orgProfile?.name || null
        if (!contact_info && orgProfile?.contact_email) {
          resolvedContactInfo = orgProfile.contact_email
        }
      }

      const { data, error } = await supabase
        .from('applications')
        .insert({
          project_id,
          appeal,
          organization_name: resolvedOrganizationName,
          contact_info: resolvedContactInfo,
          organization_id: authUser.organizationId,
          student_id: null,
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'データベースエラーが発生しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

    // 学生個人の場合
    if (authUser.type === 'student' && authUser.studentId) {
      let resolvedContactInfo = contact_info

      const { data: studentProfile } = await supabase
        .from('students')
        .select('name, contact_email')
        .eq('id', authUser.studentId)
        .single()

      if (!contact_info && studentProfile?.contact_email) {
        resolvedContactInfo = studentProfile.contact_email
      }

      const { data, error } = await supabase
        .from('applications')
        .insert({
          project_id,
          appeal,
          organization_name: studentProfile?.name || null,
          contact_info: resolvedContactInfo,
          organization_id: null,
          student_id: authUser.studentId,
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'データベースエラーが発生しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json(
      { error: '学生団体または学生個人アカウントでログインしてください' },
      { status: 403 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
