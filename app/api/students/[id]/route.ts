import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError, ensureSchemaOnce } from '@/lib/db/bootstrap'

async function fetchStudent(id: string) {
  const supabase = createServerClient()

  const studentQuery = supabase
    .from('students')
    .select('id, name, description, contact_email, created_at, rating_avg, rating_count')
    .eq('id', id)
    .single()

  // 評価一覧を取得
  const ratingsQuery = supabase
    .from('ratings')
    .select(`
      id, score, comment, created_at, rater_type, rater_id
    `)
    .eq('ratee_type', 'student')
    .eq('ratee_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const [studentRes, ratingsRes] = await Promise.all([studentQuery, ratingsQuery])

  return {
    student: studentRes.data,
    studentError: studentRes.error,
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
    let { student, studentError, ratings, ratingsError } = await fetchStudent(params.id)

    if (studentError && isMissingRelationError(studentError)) {
      await bootstrapSchema()
      const retry = await fetchStudent(params.id)
      student = retry.student
      studentError = retry.studentError
      ratings = retry.ratings
      ratingsError = retry.ratingsError
    }

    if (studentError || !student) {
      return NextResponse.json({ error: '学生が見つかりません' }, { status: 404 })
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

    return NextResponse.json({ student, ratings: ratingsWithRaterInfo })
  } catch (e: any) {
    console.error('API error (/api/students/[id]):', e)
    return NextResponse.json({ error: e?.message || 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

