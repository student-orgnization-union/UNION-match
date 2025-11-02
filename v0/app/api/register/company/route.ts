import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ensureSchemaOnce, bootstrapSchema, isMissingRelationError } from '@/lib/db/bootstrap'

async function insertCompany(payload: {
  company_name: string
  contact_email: string
  description?: string | null
  logo_url?: string | null
  website?: string | null
}) {
  const supabase = createServerClient()

  const { data: company, error: cErr } = await supabase
    .from('companies')
    .insert({
      name: payload.company_name,
      description: payload.description || null,
      logo_url: payload.logo_url || null,
      website: payload.website || null,
      contact_email: payload.contact_email,
    })
    .select('id, name')
    .single()

  if (cErr) return { company: null, error: cErr }

  // waiting_listは重複（email UNIQUE）時のエラーを無視
  const { error: wlErr } = await supabase.from('waiting_list').insert({
    email: payload.contact_email,
    type: 'company',
    name: payload.company_name,
    referrer: 'company-registration',
    interest_score: null,
  })
  if (wlErr && wlErr.code !== '23505') {
    console.warn('waiting_list insert warning:', wlErr)
  }

  return { company, error: null }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_name, contact_email, description, logo_url, website } = body || {}

    if (!company_name || !contact_email) {
      return NextResponse.json({ error: '必須項目が未入力です' }, { status: 400 })
    }

    // まず一度だけスキーマを整える（初回500対策）
    await ensureSchemaOnce()

    // 1回目
    let { company, error } = await insertCompany({ company_name, contact_email, description, logo_url, website })

    // テーブル未作成等 → ブートストラップして再試行
    if (error && isMissingRelationError(error)) {
      await bootstrapSchema()
      const retry = await insertCompany({ company_name, contact_email, description, logo_url, website })
      company = retry.company
      error = retry.error
    }

    if (error) {
      console.error('Supabase error (company register):', error)
      return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, company })
  } catch (e: any) {
    console.error('API error (company register):', e)
    return NextResponse.json({ error: e?.message || 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
