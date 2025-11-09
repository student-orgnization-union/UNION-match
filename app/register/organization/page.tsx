'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle2, Upload, X as XIcon, Image as ImageIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { persistOrganizationSession } from '@/lib/auth/session'

export default function OrganizationRegisterPage() {
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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUploadWarning, setLogoUploadWarning] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    contactEmail: '',
    contactPhone: '',
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
    setLogoUploadWarning(null)

    // プレビューを生成
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData((prev) => ({ ...prev, logoUrl: '' }))
    setLogoUploadWarning(null)
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login/organization?confirmed=true`,
          data: {
            type: 'organization',
            organization_name: formData.organizationName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('ユーザー作成に失敗しました')

      // メール確認が必要な場合（sessionがnull）、ユーザーに案内を表示
      if (!authData.session) {
        setError(
          'メール確認が必要です。\n\n' +
          '⚠️ メールが届かない場合:\n' +
          '1. Supabase Dashboard → Authentication → Settings を開く\n' +
          '2. 「Enable email confirmations」をOFFにする（推奨）\n' +
          'または\n' +
          '3. 「SMTP Settings」でメール送信設定を行う\n\n' +
          '設定後、再度登録をお試しください。'
        )
        setLoading(false)
        return
      }

      // 1.5. ロゴファイルをアップロード（ファイルが選択されている場合）
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
            .from('organization-logos')
            .upload(fileName, logoFile, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.warn('Logo upload failed, continuing without logo:', uploadError)
            setLogoUploadWarning(
              'ロゴのアップロードに失敗しましたが、登録は続行します。\n' +
              'ロゴは後から設定できます。\n\n' +
              'Storageの設定を確認してください:\n' +
              '1. Supabase Dashboard → Storage → organization-logos バケットが存在するか\n' +
              '2. バケットが公開（Public）になっているか\n' +
              '3. ポリシーが正しく設定されているか'
            )
          } else {
            // 公開URLを取得
            const { data: urlData } = supabase.storage
              .from('organization-logos')
              .getPublicUrl(fileName)

            if (urlData?.publicUrl) {
              finalLogoUrl = urlData.publicUrl
            }
          }
        } catch (uploadErr) {
          console.warn('Logo upload error:', uploadErr)
          setLogoUploadWarning('ロゴのアップロード中にエラーが発生しましたが、登録は続行します。')
        } finally {
          setUploadingLogo(false)
        }
      }

      // 2. organizationsテーブルに登録
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          user_id: authData.user.id,
          name: formData.organizationName,
          contact_email: formData.contactEmail || formData.email,
          contact_phone: formData.contactPhone || null,
          website: formData.website || null,
          logo_url: finalLogoUrl || null,
          description: formData.description || null,
        })
        .select('id, name, contact_email, contact_phone')
        .single()

      if (orgError) {
        // ユーザー作成済みなので削除を試みる（エラーは無視）
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
        throw orgError
      }

      // 3. セッションを保存（登録後自動ログイン）
      if (authData.session && orgData) {
        persistOrganizationSession({
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          profile: {
            id: orgData.id,
            name: orgData.name ?? null,
            contact_email: orgData.contact_email ?? null,
            contact_phone: orgData.contact_phone ?? null,
          },
        })
      }

      setSuccess(true)
      // メール確認が必要な場合は、リダイレクトしない（メッセージを表示）
      if (authData.session) {
        setTimeout(() => {
          router.push('/dashboard/organization')
        }, 2000)
      }
    } catch (err: any) {
      setError(err?.message || '登録に失敗しました')
    } finally {
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
                <Sparkles className="h-4 w-4" />
                Organization Registration
              </div>
              <CardTitle className="text-3xl text-white">学生団体として登録</CardTitle>
              <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                アカウントを作成して、案件への応募や管理を行えます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    登録が完了しました。ページを移動します...
                  </AlertDescription>
                </Alert>
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

                  <div className="space-y-2">
                    <Label htmlFor="organizationName" style={{ color: 'var(--ink-muted-fallback)' }}>
                      団体名 <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="organizationName"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="例）学生団体○○"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: 'var(--ink-muted-fallback)' }}>
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
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" style={{ color: 'var(--ink-muted-fallback)' }}>
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
                    <Label htmlFor="confirmPassword" style={{ color: 'var(--ink-muted-fallback)' }}>
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
                    <Label htmlFor="contactEmail" style={{ color: 'var(--ink-muted-fallback)' }}>
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
                    <Label htmlFor="contactPhone" style={{ color: 'var(--ink-muted-fallback)' }}>
                      電話番号
                    </Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="090-1234-5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" style={{ color: 'var(--ink-muted-fallback)' }}>
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
                    <Label htmlFor="logo" style={{ color: 'var(--ink-muted-fallback)' }}>
                      ロゴ
                    </Label>
                    <div className="space-y-3">
                      {logoPreview ? (
                        <div className="relative">
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoPreview}
                              alt="ロゴプレビュー"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-500/90 hover:bg-rose-600 p-0 text-white"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="logo"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="h-8 w-8 mb-2" style={{ color: 'var(--ink-muted-fallback)' }} />
                            <p className="text-sm mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                              <span className="font-semibold">クリックしてアップロード</span>
                            </p>
                            <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                              PNG, JPG, GIF, WebP (最大5MB)
                            </p>
                          </div>
                          <input
                            id="logo"
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleLogoFileChange}
                            disabled={uploadingLogo}
                          />
                        </label>
                      )}
                      {!logoPreview && (
                        <div className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                          または、ロゴURLを直接入力:
                        </div>
                      )}
                      {!logoPreview && (
                        <Input
                          id="logoUrl"
                          name="logoUrl"
                          type="url"
                          value={formData.logoUrl}
                          onChange={handleChange}
                          className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                          style={{ 
                            '--tw-placeholder-opacity': '0.5',
                          } as React.CSSProperties}
                          placeholder="https://.../logo.png"
                        />
                      )}
                      {logoUploadWarning && (
                        <Alert className="border-yellow-400/40 bg-yellow-500/10 text-yellow-100">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="whitespace-pre-line text-xs">
                            {logoUploadWarning}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" style={{ color: 'var(--ink-muted-fallback)' }}>
                      団体概要
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
                      placeholder="活動内容や実績などをご記入ください"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="union-gradient union-glow h-11 w-full text-sm font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登録中...
                      </>
                    ) : (
                      '登録する'
                    )}
                  </Button>

                  <p className="text-center text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                    すでにアカウントをお持ちですか？{' '}
                    <Link href="/login/organization" className="text-indigo-300 hover:text-indigo-200">
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
