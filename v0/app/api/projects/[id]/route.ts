import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError, ensureSchemaOnce } from '@/lib/db/bootstrap'

async function getProject(id: string) {
  const supabase = createServerClient()
  return supabase
    .from('projects')
    .select(`
      id, title, budget, deadline, description, created_at, status,
      company:companies!projects_company_id_fkey ( id, name, logo_url, description, website )
    `)
    .eq('id', id)
    .eq('status', 'public')
    .single()
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchemaOnce()

    let { data, error } = await getProject(params.id)

    if (error && isMissingRelationError(error)) {
      await bootstrapSchema()
      const retry = await getProject(params.id)
      data = retry.data
      error = retry.error
    }

    if (error || !data) {
      return NextResponse.json(
        { error: '案件が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
