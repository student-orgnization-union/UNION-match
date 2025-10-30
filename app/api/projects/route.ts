import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError, ensureSchemaOnce } from '@/lib/db/bootstrap'

async function insertProject(payload: {
  title: string
  budget?: string | null
  deadline?: string | null
  description: string
  contact_info: string
  company_id?: string | null
}) {
  const supabase = createServerClient()
  return supabase
    .from('projects')
    .insert({
      title: payload.title,
      budget: payload.budget || null,
      deadline: payload.deadline || null,
      description: payload.description,
      contact_info: payload.contact_info,
      status: 'review',
      company_id: payload.company_id || null,
    })
    .select()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, budget, deadline, description, contact_info, company_id } = body

    if (!title || !description || !contact_info) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      )
    }

    await ensureSchemaOnce()

    // 1回目
    let { data, error } = await insertProject({
      title,
      budget: budget || null,
      deadline: deadline || null,
      description,
      contact_info,
      company_id: company_id || null,
    })

    if (error && isMissingRelationError(error)) {
      await bootstrapSchema()
      const retry = await insertProject({
        title,
        budget: budget || null,
        deadline: deadline || null,
        description,
        contact_info,
        company_id: company_id || null,
      })
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Supabase error (create project):', error)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('API error (/api/projects):', error)
    return NextResponse.json(
      { error: error?.message || 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
