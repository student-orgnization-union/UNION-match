import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError, ensureSchemaOnce } from '@/lib/db/bootstrap'

async function fetchCompany(id: string) {
  const supabase = createServerClient()

  const companyQuery = supabase
    .from('companies')
    .select('id, name, description, logo_url, website, created_at, rating_avg, rating_count')
    .eq('id', id)
    .single()

  const projectsQuery = supabase
    .from('projects')
    .select('id, title, budget, deadline, description, created_at, status')
    .eq('company_id', id)
    .eq('status', 'public')
    .order('created_at', { ascending: false })

  // 評価一覧を取得
  const ratingsQuery = supabase
    .from('ratings')
    .select(`
      id, score, comment, created_at, rater_type, rater_id
    `)
    .eq('ratee_type', 'company')
    .eq('ratee_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const [companyRes, projectsRes, ratingsRes] = await Promise.all([companyQuery, projectsQuery, ratingsQuery])

  return {
    company: companyRes.data,
    companyError: companyRes.error,
    projects: projectsRes.data || [],
    projectsError: projectsRes.error,
    ratings: ratingsRes.data || [],
    ratingsError: ratingsRes.error,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchemaOnce()

    // 1回目
    let { company, companyError, projects, projectsError, ratings, ratingsError } = await fetchCompany(params.id)

    if ((companyError || projectsError) && (isMissingRelationError(companyError) || isMissingRelationError(projectsError))) {
      await bootstrapSchema()
      const retry = await fetchCompany(params.id)
      company = retry.company
      companyError = retry.companyError
      projects = retry.projects
      projectsError = retry.projectsError
      ratings = retry.ratings
      ratingsError = retry.ratingsError
    }

    if (companyError || !company) {
      return NextResponse.json({ error: '企業が見つかりません' }, { status: 404 })
    }

    // 評価に評価者情報を追加
    const supabase = createServerClient()
    const ratingsWithRaterInfo = await Promise.all(
      (ratings || []).map(async (rating: any) => {
        let raterName: string | null = null
        if (rating.rater_type === 'organization') {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', rating.rater_id)
            .single()
          raterName = orgData?.name || null
        } else if (rating.rater_type === 'student') {
          const { data: studentData } = await supabase
            .from('students')
            .select('name')
            .eq('id', rating.rater_id)
            .single()
          raterName = studentData?.name || null
        }

        return {
          ...rating,
          organizations: rating.rater_type === 'organization' ? { name: raterName } : null,
          students: rating.rater_type === 'student' ? { name: raterName } : null,
        }
      })
    )

    return NextResponse.json({ company, projects, ratings: ratingsWithRaterInfo })
  } catch (e: any) {
    console.error('API error (/api/companies/[id]):', e)
    return NextResponse.json({ error: e?.message || 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
