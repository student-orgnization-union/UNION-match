import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError } from '@/lib/db/bootstrap'
import { requireAdmin } from '@/lib/auth/admin'

async function fetchApplications() {
  const supabase = createServerClient()
  return supabase
    .from('applications')
    .select(`
      *,
      project:projects(title)
    `)
    .order('created_at', { ascending: false })
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  try {
    // 1回目
    let { data, error } = await fetchApplications()

    if (error && isMissingRelationError(error)) {
      await bootstrapSchema()
      const retry = await fetchApplications()
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Supabase error (admin applications):', error)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error (/api/admin/applications):', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
