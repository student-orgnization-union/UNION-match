import { NextRequest, NextResponse } from 'next/server'
import { bootstrapSchema } from '@/lib/db/bootstrap'
import { requireAdmin } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: auth.status === 403 ? 'forbidden' : 'unauthorized', message: auth.message } },
      { status: auth.status }
    )
  }

  try {
    await bootstrapSchema()
    return NextResponse.json({ ok: true, note: 'スキーマ初期化が完了しました。5-10秒後に再読込してください。' })
  } catch (e: any) {
    const message = String(e?.message || e)
    // 代表的な誤設定は 400 で返し、フロントで指示を出しやすくする
    if (/requested path is invalid/i.test(message) || /invalid_path/.test(e?.code)) {
      return NextResponse.json(
        {
          error: {
            code: 'bad_request',
            message: 'requested path is invalid',
            details: 'SUPABASE_URL は https://{ref}.supabase.co（パスなし）を設定してください。/rest/v1 などは不要です。'
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'internal_server_error', message } },
      { status: 500 }
    )
  }
}
