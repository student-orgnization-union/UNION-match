import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { bootstrapSchema, isMissingRelationError, ensureSchemaOnce } from '@/lib/db/bootstrap'
import { getAuthenticatedUser } from '@/lib/auth/user'

async function getProject(id: string, companyId?: string) {
  const supabase = createServerClient()
  
  console.log('[getProject] Starting fetch:', { id, companyId })
  
  // まず案件が存在するか確認（statusに関係なく）
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, company_id, status')
    .eq('id', id)
    .single()

  console.log('[getProject] Initial fetch result:', {
    hasData: !!projectData,
    hasError: !!projectError,
    projectCompanyId: projectData?.company_id,
    projectStatus: projectData?.status,
    requestedCompanyId: companyId,
    companyIdMatch: projectData?.company_id === companyId,
  })

  if (projectError || !projectData) {
    console.log('[getProject] Project not found or error:', projectError?.message)
    return { data: null, error: projectError || new Error('案件が見つかりません') }
  }

  // 企業が自分の案件を見る場合は、statusに関係なく取得
  // companyIdが提供されている場合、または案件のcompany_idが存在する場合にチェック
  const isCompanyOwned = companyId && projectData.company_id && 
    String(projectData.company_id).trim() === String(companyId).trim()
  
  console.log('[getProject] Ownership check:', {
    companyId,
    projectCompanyId: projectData.company_id,
    isCompanyOwned,
    companyIdType: typeof companyId,
    projectCompanyIdType: typeof projectData.company_id,
  })

  if (isCompanyOwned) {
    console.log('[getProject] Company owns project, fetching full data')
    // 企業の自分の案件なので、statusに関係なく全情報を取得
    const result = await supabase
      .from('projects')
      .select(`
        id, title, budget, deadline, description, created_at, status, company_id,
        company:companies!projects_company_id_fkey ( id, name, logo_url, description, website )
      `)
      .eq('id', id)
      .single()
    
    console.log('[getProject] Company project fetch result:', {
      hasData: !!result.data,
      hasError: !!result.error,
      errorMessage: result.error?.message,
      errorCode: result.error?.code,
    })
    
    return result
  }

  // 一般ユーザーは公開中の案件のみ
  if (projectData.status !== 'public') {
    console.log('[getProject] Project not public, status:', projectData.status, 'companyId:', companyId, 'projectCompanyId:', projectData.company_id)
    return { 
      data: null, 
      error: { message: '案件が見つかりません', code: 'NOT_FOUND' } as any 
    }
  }

  console.log('[getProject] Fetching public project for public')
  const result = await supabase
    .from('projects')
    .select(`
      id, title, budget, deadline, description, created_at, status, company_id,
      company:companies!projects_company_id_fkey ( id, name, logo_url, description, website )
    `)
    .eq('id', id)
    .eq('status', 'public')
    .single()
  
  console.log('[getProject] Public project fetch result:', {
    hasData: !!result.data,
    hasError: !!result.error,
    errorMessage: result.error?.message,
  })
  
  return result
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchemaOnce()

    // 企業がログインしているか確認（認証されていなくてもエラーにしない）
    const authUser = await getAuthenticatedUser(request)
    const companyId = authUser?.type === 'company' ? authUser.companyId : undefined

    const authHeader = request.headers.get('authorization')
    
    // companyIdがundefinedの場合でも、トークンから直接ユーザーIDを取得してcompaniesテーブルを検索
    let finalCompanyId = companyId
    if (!finalCompanyId && authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const supabase = createServerClient()
        
        // まず通常のgetUserを試す
        const { data: tokenData, error: tokenError } = await supabase.auth.getUser(token)
        
        let userId: string | null = null
        
        if (!tokenError && tokenData?.user) {
          userId = tokenData.user.id
          console.log('[API] Token user found via getUser:', userId)
        } else {
          // トークンが期限切れの場合、JWTをデコードしてユーザーIDを取得
          try {
            const parts = token.split('.')
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
              userId = payload.sub || payload.user_id || null
              console.log('[API] User ID extracted from expired token:', userId)
            }
          } catch (decodeError) {
            console.error('[API] Failed to decode JWT:', decodeError)
          }
        }
        
        if (userId) {
          // ユーザーIDからcompaniesテーブルを検索
          const { data: companyData, error: companyLookupError } = await supabase
            .from('companies')
            .select('id')
            .eq('user_id', userId)
            .single()
          
          console.log('[API] Company lookup result:', {
            hasData: !!companyData,
            companyId: companyData?.id,
            hasError: !!companyLookupError,
            errorMessage: companyLookupError?.message,
            errorCode: companyLookupError?.code,
          })
          
          if (companyData) {
            finalCompanyId = companyData.id
            console.log('[API] Company ID found via token fallback:', finalCompanyId)
          } else {
            console.log('[API] No company found for user:', userId)
          }
        } else {
          console.log('[API] Could not extract user ID from token')
        }
      } catch (fallbackError) {
        console.error('[API] Token fallback error:', fallbackError)
      }
    }

    console.log('[API] Project fetch request:', {
      projectId: params.id,
      authUserType: authUser?.type,
      companyId,
      finalCompanyId: finalCompanyId,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 30) || 'none',
      authUserCompanyId: authUser?.companyId,
    })

    let { data, error } = await getProject(params.id, finalCompanyId)
    
    console.log('[API] Project fetch result:', {
      projectId: params.id,
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code,
      projectCompanyId: data?.company_id,
      requestedCompanyId: companyId,
      projectStatus: data?.status,
    })

    if (error && isMissingRelationError(error)) {
      await bootstrapSchema()
      const retry = await getProject(params.id, companyId)
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error('[API] Project fetch error:', {
        projectId: params.id,
        error: error.message,
        code: error.code,
        companyId,
      })
    }

    if (error || !data) {
      return NextResponse.json(
        { error: '案件が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API] Project fetch exception:', error)
    return NextResponse.json(
      { error: error?.message || 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
