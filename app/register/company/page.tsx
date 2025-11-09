'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle2, Building2, Upload, X, Image as ImageIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { persistCompanySession } from '@/lib/auth/session'

export default function CompanyRegisterPage() {
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch {
      return null
    }
  }, [])
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [authData, setAuthData] = useState<any>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUploadWarning, setLogoUploadWarning] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    contactEmail: '',
    website: '',
    logoUrl: '',
    description: '',
  })

  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください')
      return
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('画像ファイル（JPEG、PNG、GIF、WebP）のみアップロード可能です')
      return
    }

    setLogoFile(file)
    setError(null)

    // プレビューを生成
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // ファイルをアップロード（登録前の一時アップロードは行わない）
    // 登録時に一緒にアップロードする
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData((prev) => ({ ...prev, logoUrl: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!supabase || !hasSupabaseConfig) {
      setError('Supabase設定が完了していません。環境変数を確認してください。')
      setLoading(false)
      return
    }

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      // 1. Supabase Authでユーザー作成
      // メール確認が必要な場合でも、メタデータに企業情報を保存
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login/company?confirmed=true`,
          data: {
            type: 'company',
            company_name: formData.companyName,
            company_contact_email: formData.contactEmail || formData.email,
            company_website: formData.website || null,
            company_logo_url: formData.logoUrl || null,
            company_description: formData.description || null,
            pending_company_registration: true, // 登録待ちフラグ
          },
        },
      })

      if (authError) {
        // メールアドレスが既に登録されている場合
        if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
          throw new Error('このメールアドレスは既に登録されています。ログインページからログインしてください。')
        }
        throw authError
      }
      if (!authData.user) throw new Error('ユーザー作成に失敗しました')

      // authDataを状態に保存（成功メッセージ表示用）
      setAuthData(authData)

      // メール確認が必要な場合（sessionがnull）、メール確認を促す
      if (!authData.session) {
        // ユーザーは作成されたが、メール確認が必要
        // メタデータには既に企業情報が保存されている（signUpのoptions.dataで）
        // メール確認後、ログインページで自動的にcompaniesテーブルに登録される
        
        // 成功メッセージを表示
        setSuccess(true)
        setError(null)
        setLoading(false)
        
        // メール確認を促すメッセージを表示（成功状態で）
        return
      }

      // 1.5. ロゴファイルをアップロード（ファイルが選択されている場合）
      // ロゴアップロードはオプションなので、失敗しても登録を続行
      let finalLogoUrl = formData.logoUrl
      if (logoFile && authData.session) {
        setUploadingLogo(true)
        try {
          // ファイル名を生成（ユーザーID + タイムスタンプ）
          const timestamp = Date.now()
          const fileExt = logoFile.name.split('.').pop()
          const fileName = `${authData.user.id}_${timestamp}.${fileExt}`

          // Supabase Storageに直接アップロード
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('company-logos')
            .upload(fileName, logoFile, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.warn('Logo upload failed, continuing without logo:', uploadError)
            // ロゴアップロードが失敗しても登録を続行（ロゴはオプション）
            // 警告メッセージを表示（エラーではない）
            setLogoUploadWarning(
              'ロゴのアップロードに失敗しましたが、登録は続行します。\n' +
              'ロゴは後から設定できます。\n\n' +
              'Storageの設定を確認してください:\n' +
              '1. Supabase Dashboard → Storage → company-logos バケットが存在するか\n' +
              '2. バケットが公開（Public）になっているか\n' +
              '3. ポリシーが正しく設定されているか'
            )
          } else {
            // 公開URLを取得
            const { data: urlData } = supabase.storage
              .from('company-logos')
              .getPublicUrl(fileName)

            finalLogoUrl = urlData.publicUrl
            setLogoUploadWarning(null) // 成功したら警告をクリア
          }
        } catch (uploadErr: any) {
          console.warn('Logo upload error, continuing without logo:', uploadErr)
          // ロゴアップロードが失敗しても登録を続行
          setLogoUploadWarning(
            'ロゴのアップロードに失敗しましたが、登録は続行します。\n' +
            'ロゴは後から設定できます。'
          )
        } finally {
          setUploadingLogo(false)
        }
      }

      // 2. companiesテーブルに登録
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: authData.user.id,
          name: formData.companyName,
          contact_email: formData.contactEmail || formData.email,
          website: formData.website || null,
          logo_url: finalLogoUrl || null,
          description: formData.description || null,
        })
        .select('id, name, contact_email')
        .single()

      if (companyError) {
        // エラーの詳細をログに記録
        console.error('Company insert error:', companyError)
        
        // ユーザーを削除する（サーバーサイドのAPIを使用）
        try {
          if (authData.session?.access_token) {
            await fetch('/api/auth/delete-user', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authData.session.access_token}`,
              },
            }).catch(() => {
              // 削除に失敗してもエラーを無視（既に削除されている可能性がある）
            })
          }
        } catch (deleteErr) {
          console.error('Failed to delete user:', deleteErr)
        }
        
        // 外部キー制約エラーの場合、より詳細なメッセージを提供
        if (companyError.code === '23503' || companyError.message?.includes('foreign key constraint')) {
          throw new Error(
            'ユーザー情報の登録に失敗しました。メール確認が必要な場合は、メール内のリンクをクリックしてアカウントを有効化してください。'
          )
        }
        
        // 重複エラー（409）の場合
        if (companyError.code === '23505' || companyError.message?.includes('duplicate') || companyError.message?.includes('unique')) {
          throw new Error('このメールアドレスは既に登録されています。')
        }
        
        throw new Error(companyError.message || '企業情報の登録に失敗しました')
      }

      // 3. セッションを保存（登録後自動ログイン）
      if (authData.session && companyData) {
        persistCompanySession({
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          profile: {
            id: companyData.id,
            name: companyData.name ?? null,
            contact_email: companyData.contact_email ?? null,
          },
        })
      }

      setSuccess(true)
      // メール確認が必要な場合は、リダイレクトしない（メッセージを表示）
      if (authData.session) {
        setTimeout(() => {
          router.push('/dashboard/company')
        }, 2000)
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorMessage = err?.message || '登録に失敗しました'
      
      // ユーザーが作成されている場合、削除を試みる
      if (authData?.user?.id) {
        try {
          if (authData.session?.access_token) {
            await fetch('/api/auth/delete-user', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authData.session.access_token}`,
              },
            }).catch(() => {
              // 削除に失敗してもエラーを無視
            })
          }
        } catch (deleteErr) {
          console.error('Failed to delete user after error:', deleteErr)
        }
      }
      
      setError(errorMessage)
      setSuccess(false)
      setLoading(false)
    }
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen text-white" style={{ background: 'var(--bg-0-fallback)' }}>
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <Alert className="border-yellow-400/40 bg-yellow-500/10 text-yellow-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Supabase の設定が必要です</AlertDescription>
          </Alert>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
      <div 
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(circle at 50% 20%, var(--um-blue-fallback) 0%, transparent 60%)',
        }}
      />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm transition hover:text-white"
            style={{ color: 'var(--ink-muted-fallback)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            トップに戻る
          </Link>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="glass-panel border-0 rounded-um-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                <Building2 className="h-4 w-4" />
                Company Registration
              </div>
              <CardTitle className="text-3xl text-white">企業として登録</CardTitle>
              <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                アカウントを作成して、案件の投稿や管理を行えます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="whitespace-pre-line">
                      {authData?.session
                        ? '登録が完了しました。案件投稿ページに移動します...'
                        : 'アカウントを作成しました。\n\n📧 登録したメールアドレスに確認メールを送信しました。\nメール内のリンクをクリックして、アカウントを有効化してください。\n\nメールが届かない場合は、スパムフォルダもご確認ください。'}
                    </AlertDescription>
                  </Alert>
                  {!authData?.session && (
                    <div className="text-center space-y-3">
                      <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                        メール確認後、以下のページからログインしてください。
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Link href="/login/company">ログインページへ</Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert className="border-rose-400/40 bg-rose-500/10 text-rose-100">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="whitespace-pre-line">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {logoUploadWarning && (
                    <Alert className="border-yellow-400/40 bg-yellow-500/10 text-yellow-100">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="whitespace-pre-line">
                        {logoUploadWarning}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="companyName" style={{ color: 'var(--ink-muted-fallback)' }}>
                      企業名 <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="例）ユニオン株式会社"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      メールアドレス（ログインID） <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="example@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">
                      パスワード <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="6文字以上"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">
                      パスワード（確認） <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-slate-300">
                      連絡先メールアドレス
                    </Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="連絡用メール（任意）"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-slate-300">
                      Webサイト
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo" className="text-slate-300">
                      ロゴ
                    </Label>
                    <div className="space-y-3">
                      {logoPreview ? (
                        <div className="relative">
                          <div className="relative w-32 h-32 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                            <img
                              src={logoPreview}
                              alt="ロゴプレビュー"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="logoFile"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2" style={{ color: 'var(--ink-muted-fallback)' }} />
                            <p className="mb-2 text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                              <span className="font-semibold">クリックしてアップロード</span>
                            </p>
                            <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>PNG, JPG, GIF, WebP (最大5MB)</p>
                          </div>
                          <input
                            id="logoFile"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleLogoFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                      <div className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                        または、ロゴURLを直接入力することもできます
                      </div>
                      <Input
                        id="logoUrl"
                        name="logoUrl"
                        type="url"
                        value={formData.logoUrl}
                        onChange={handleChange}
                        disabled={!!logoFile}
                        className="h-11 rounded-um-md border-white/10 bg-white/5 text-white disabled:opacity-50"
                        style={{ 
                          '--tw-placeholder-opacity': '0.5',
                        } as React.CSSProperties}
                        placeholder="https://.../logo.png（ファイルアップロード時は無効）"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-300">
                      企業概要
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="事業内容や学生との協業における姿勢・期待などをご記入ください"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || uploadingLogo}
                    className="union-gradient union-glow h-11 w-full text-sm font-semibold"
                  >
                    {loading || uploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploadingLogo ? 'ロゴをアップロード中...' : '登録中...'}
                      </>
                    ) : (
                      '登録して案件投稿へ進む'
                    )}
                  </Button>

                  <p className="text-center text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                    すでにアカウントをお持ちですか？{' '}
                    <Link href="/login/company" className="text-indigo-300 hover:text-indigo-200">
                      ログイン
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
