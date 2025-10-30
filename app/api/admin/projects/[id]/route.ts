import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError } from '@/lib/db/bootstrap'
import { requireAdmin } from '@/lib/auth/admin'

async function updateStatus(id: string, status: string) {
  const supabase = createServerClient()
  return supabase.from('projects').update({ status }).eq('id', id).select()
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { status } = body

    if (!['public', 'rejected', 'review', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      )
    }

    // 1回目
    let { data, error } = await updateStatus(params.id, status)

    if (error && isMissingRelationError(error)) {
      await bootstrapSchema()
      const retry = await updateStatus(params.id, status)
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Supabase error (update project):', error)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error (/api/admin/projects/[id]):', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
