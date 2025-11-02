import { NextRequest, NextResponse } from 'next/server'

// Basic Auth (Edge-safe)
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

function extractOrigin(raw: string): string | null {
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    try {
      const u2 = new URL(`https://${raw}`)
      return `${u2.protocol}//${u2.host}`
    } catch {
      return null
    }
  }
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' } }
    )
  }

  const raw =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''

  const hasValue = Boolean(raw)
  const hasRestPath = /\/rest\/v1\b/.test(raw)
  const hasAnyPath = /^https?:\/\/[^/]+\/.+/.test(raw)
  const origin = hasValue ? extractOrigin(raw) : null

  const advice: string[] = []
  if (!hasValue) {
    advice.push('SUPABASE_URL または NEXT_PUBLIC_SUPABASE_URL が未設定です。https://{ref}.supabase.co を設定してください。')
  }
  if (hasRestPath) {
    advice.push('SUPABASE_URL に /rest/v1 を含めないでください（origin のみ）。例: https://xxxx.supabase.co')
  }
  if (hasAnyPath && !hasRestPath) {
    advice.push('SUPABASE_URL はパスなし（origin のみ）にしてください。')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    advice.push('SUPABASE_SERVICE_ROLE_KEY が未設定です。サーバー専用の Service Role Key を設定してください。')
  }

  return NextResponse.json({
    ok: true,
    supabaseUrlRawPreview: raw ? raw.replace(/^(https?:\/\/)([^/]+)/, '$1***') : '',
    derivedOrigin: origin,
    flags: { hasValue, hasRestPath, hasAnyPath },
    advice,
  })
}
