import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError, ensureSchemaOnce } from '@/lib/db/bootstrap'

async function fetchOrganization(id: string) {
  const supabase = createServerClient()

  const organizationQuery = supabase
    .from('organizations')
    .select('id, name, description, contact_email, created_at, rating_avg, rating_count')
    .eq('id', id)
    .single()

  // 評価一覧を取得
  const ratingsQuery = supabase
    .from('ratings')
    .select(`
      id, score, comment, created_at, rater_type, rater_id
    `)
    .eq('ratee_type', 'organization')
    .eq('ratee_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const [organizationRes, ratingsRes] = await Promise.all([organizationQuery, ratingsQuery])

  return {
    organization: organizationRes.data,
    organizationError: organizationRes.error,
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
    let { organization, organizationError, ratings, ratingsError } = await fetchOrganization(params.id)

    if (organizationError && isMissingRelationError(organizationError)) {
      await bootstrapSchema()
      const retry = await fetchOrganization(params.id)
      organization = retry.organization
      organizationError = retry.organizationError
      ratings = retry.ratings
      ratingsError = retry.ratingsError
    }

    if (organizationError || !organization) {
      return NextResponse.json({ error: '学生団体が見つかりません' }, { status: 404 })
    }

    // 評価に評価者情報を追加
    const supabase = createServerClient()
    const ratingsWithRaterInfo = await Promise.all(
      (ratings || []).map(async (rating: any) => {
        let raterName: string | null = null
        if (rating.rater_type === 'company') {
          const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('id', rating.rater_id)
            .single()
          raterName = companyData?.name || null
        }

        return {
          ...rating,
          companies: rating.rater_type === 'company' ? { name: raterName } : null,
        }
      })
    )

    return NextResponse.json({ organization, ratings: ratingsWithRaterInfo })
  } catch (e: any) {
    console.error('API error (/api/organizations/[id]):', e)
    return NextResponse.json({ error: e?.message || 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

