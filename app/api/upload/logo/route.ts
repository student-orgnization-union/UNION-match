import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireCompany } from '@/lib/auth/user'

export async function POST(request: NextRequest) {
  try {
    const companyAuth = await requireCompany(request)
    if (!companyAuth) {
      return NextResponse.json(
        { error: '企業アカウントでログインしてください' },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 },
      )
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは5MB以下にしてください' },
        { status: 400 },
      )
    }

    // ファイルタイプチェック（画像のみ）
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '画像ファイル（JPEG、PNG、GIF、WebP）のみアップロード可能です' },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // ファイル名を生成（ユーザーID + タイムスタンプ）
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${companyAuth.userId}_${timestamp}.${fileExt}`

    // Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'ファイルのアップロードに失敗しました' },
        { status: 500 },
      )
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path,
    })
  } catch (error: any) {
    console.error('API error (/api/upload/logo):', error)
    return NextResponse.json(
      { error: error?.message || 'サーバーエラーが発生しました' },
      { status: 500 },
    )
  }
}

