'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, CheckCircle, AlertCircle, ArrowRight, AlertTriangle, ImageIcon, Globe } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function CompanyRegistrationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    description: '',
    logo_url: '',
    website: '',
  })

  const isUsingMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (isUsingMock) {
        // デモ時はスキップして /post へ
        await new Promise((r) => setTimeout(r, 600))
        localStorage.setItem('company_id', 'demo-company')
        setMessage({ type: 'success', text: '登録が完了しました（デモ）' })
        router.push('/post')
        return
      }

      const res = await fetch('/api/register/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || '登録に失敗しました')
      }

      const json = await res.json()
      const companyId = json?.company?.id
      if (companyId) {
        localStorage.setItem('company_id', companyId)
      }
      setMessage({ type: 'success', text: '企業登録が完了しました。次の画面で案件を投稿してください。' })
      setTimeout(() => router.push('/post'), 500)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || '登録に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = formData.company_name && formData.contact_email

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />

      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center">
          <div className="w-12 h-12 union-gradient rounded-2xl flex items-center justify-center mr-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">企業登録</h1>
        </div>

        {isUsingMock && (
          <Card className="union-card border-yellow-500/30 bg-yellow-500/10 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <p className="text-yellow-300 font-medium">デモモード</p>
                  <p className="text-yellow-400/80 text-sm">
                    Supabase未設定のため、登録は保存されませんが次の画面へ進めます。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className="flex items-center">
              {message.type === 'success'
                ? <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                : <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              }
              <AlertDescription className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Card className="union-card border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">基本情報</CardTitle>
            <CardDescription className="text-gray-400">
              登録後に案件投稿ページへ移動します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-white">企業名 *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="例）ユニオン株式会社"
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-white">担当者メールアドレス *</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  required
                  placeholder="example@company.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-white">Webサイト</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-white/60" />
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url" className="text-white">ロゴURL</Label>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-white/60" />
                  <Input
                    id="logo_url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    placeholder="https://.../logo.png（画像URL）"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40 h-12"
                  />
                </div>
                <p className="text-xs text-gray-500">画像の直リンクURLを貼り付けてください（将来はアップロード対応予定）</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">企業概要</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="企業の概要説明を入力してください（事業内容、取組み、学生との協業方針など）"
                  rows={6}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                />
              </div>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full union-gradient text-white border-0 py-4 text-lg hover:opacity-90"
              >
                {isSubmitting ? '登録中…' : (
                  <>
                    続けて案件を投稿する
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <SiteFooter />
    </div>
  )
}
