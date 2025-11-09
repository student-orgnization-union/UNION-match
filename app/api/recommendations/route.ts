import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/user'

// レコメンド機能：評価に基づいて案件を推薦
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'ログインしてください' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const targetType = searchParams.get('target_type') || 'both' // 'student' | 'organization' | 'both'

    const supabase = createServerClient()

    // ユーザータイプに応じたレコメンドロジック
    if (authUser.type === 'organization' && authUser.organizationId) {
      // 学生団体の場合：高評価の企業の案件を推薦
      const { data: projects, error } = await supabase
        .from('projects')
        .select(
          `
          id, title, budget, deadline, description, created_at, target_type,
          company:companies!projects_company_id_fkey (
            id, name, logo_url, rating_avg, rating_count
          )
          `
        )
        .eq('status', 'public')
        .in('target_type', ['organization', 'both'])
        .order('created_at', { ascending: false })
        .limit(limit * 2) // より多く取得してからフィルタリング

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'データベースエラーが発生しました' },
          { status: 500 }
        )
      }

      // 企業の評価平均でソート（評価が高い順）
      const sortedProjects = (projects || [])
        .filter((p) => p.company && !Array.isArray(p.company))
        .sort((a, b) => {
          const aRating = (a.company as any)?.rating_avg || 0
          const bRating = (b.company as any)?.rating_avg || 0
          return bRating - aRating
        })
        .slice(0, limit)

      return NextResponse.json({ success: true, data: sortedProjects })
    }

    if (authUser.type === 'student' && authUser.studentId) {
      // 学生個人の場合：高評価の企業の案件を推薦
      const { data: projects, error } = await supabase
        .from('projects')
        .select(
          `
          id, title, budget, deadline, description, created_at, target_type,
          company:companies!projects_company_id_fkey (
            id, name, logo_url, rating_avg, rating_count
          )
          `
        )
        .eq('status', 'public')
        .in('target_type', ['student', 'both'])
        .order('created_at', { ascending: false })
        .limit(limit * 2)

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'データベースエラーが発生しました' },
          { status: 500 }
        )
      }

      // 企業の評価平均でソート（評価が高い順）
      const sortedProjects = (projects || [])
        .filter((p) => p.company && !Array.isArray(p.company))
        .sort((a, b) => {
          const aRating = (a.company as any)?.rating_avg || 0
          const bRating = (b.company as any)?.rating_avg || 0
          return bRating - aRating
        })
        .slice(0, limit)

      return NextResponse.json({ success: true, data: sortedProjects })
    }

    if (authUser.type === 'company' && authUser.companyId) {
      // 企業の場合：高評価の学生団体・学生個人を推薦（応募者として）
      // これは将来的に応募者推薦機能として実装可能
      return NextResponse.json({
        success: true,
        data: [],
        message: '企業向けレコメンド機能は今後実装予定です',
      })
    }

    return NextResponse.json(
      { error: 'サポートされていないユーザータイプです' },
      { status: 400 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

