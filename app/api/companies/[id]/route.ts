import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError, ensureSchemaOnce } from '@/lib/db/bootstrap'

async function fetchCompany(id: string) {
  const supabase = createServerClient()

  const companyQuery = supabase
    .from('companies')
    .select('id, name, description, logo_url, website, created_at')
    .eq('id', id)
    .single()

  const projectsQuery = supabase
    .from('projects')
    .select('id, title, budget, deadline, description, created_at, status')
    .eq('company_id', id)
    .eq('status', 'public')
    .order('created_at', { ascending: false })

  const [companyRes, projectsRes] = await Promise.all([companyQuery, projectsQuery])

  return {
    company: companyRes.data,
    companyError: companyRes.error,
    projects: projectsRes.data || [],
    projectsError: projectsRes.error,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchemaOnce()

    // 1回目
    let { company, companyError, projects, projectsError } = await fetchCompany(params.id)

    if ((companyError || projectsError) && (isMissingRelationError(companyError) || isMissingRelationError(projectsError))) {
      await bootstrapSchema()
      const retry = await fetchCompany(params.id)
      company = retry.company
      companyError = retry.companyError
      projects = retry.projects
      projectsError = retry.projectsError
    }

    if (companyError || !company) {
      return NextResponse.json({ error: '企業が見つかりません' }, { status: 404 })
    }

    return NextResponse.json({ company, projects })
  } catch (e: any) {
    console.error('API error (/api/companies/[id]):', e)
    return NextResponse.json({ error: e?.message || 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
