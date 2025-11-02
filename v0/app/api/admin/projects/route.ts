import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError } from '@/lib/db/bootstrap'

function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const credentials = authHeader.split(' ')[1]
  if (!credentials) return false

  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':')

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'unionadmin'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

async function fetchProjects() {
  const supabase = createServerClient()
  return supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { 
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"'
        }
      }
    )
  }

  try {
    // 1回目
    let { data, error } = await fetchProjects()

    if (error && isMissingRelationError(error)) {
      await bootstrapSchema()
      const retry = await fetchProjects()
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Supabase error (admin projects):', error)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error (/api/admin/projects):', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
