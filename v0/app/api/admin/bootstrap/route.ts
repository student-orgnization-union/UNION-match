import { NextRequest, NextResponse } from 'next/server'
import { bootstrapSchema } from '@/lib/db/bootstrap'

// Basic Auth
function checkAuth(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth) return false
  const token = auth.split(' ')[1]
  if (!token) return false
  const [user, pass] = atob(token).split(':')

  const ADMIN_USER = process.env.ADMIN_USERNAME || process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'unionadmin'
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
  return user === ADMIN_USER && pass === ADMIN_PASS
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Unauthorized' } },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' } }
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
