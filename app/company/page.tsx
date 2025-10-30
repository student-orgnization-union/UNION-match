'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Globe,
  ImageIcon,
  Sparkles,
  Upload,
} from 'lucide-react'

import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type MessageState =
  | { type: 'success'; text: string }
  | { type: 'error'; text: string }
  | null

export default function CompanyRegistrationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    description: '',
    logo_url: '',
    website: '',
  })

  const isUsingMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isValid = Boolean(formData.company_name && formData.contact_email)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (isUsingMock) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        localStorage.setItem('company_id', 'demo-company')
        setMessage({ type: 'success', text: '登録が完了しました（デモ）' })
        router.push('/post')
        return
      }

      const response = await fetch('/api/register/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || '登録に失敗しました')
      }

      const json = await response.json()
      const companyId = json?.company?.id
      if (companyId) {
        localStorage.setItem('company_id', companyId)
      }

      setMessage({ type: 'success', text: '企業登録が完了しました。次の画面で案件を投稿してください。' })
      setTimeout(() => router.push('/post'), 500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || '登録に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell>
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <ArrowLeft className="h-4 w-4" />
        <Link href="/projects" className="transition hover:text-white">
          公開中の案件を見る
        </Link>
      </div>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-8">
          <Card className="glass-outline border-white/10 bg-black/25">
            <CardHeader className="space-y-6">
              <Badge className="w-fit border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
                For Company
              </Badge>
              <div className="space-y-4">
                <CardTitle className="text-3xl font-semibold text-white">企業登録</CardTitle>
                <CardDescription className="text-base text-slate-300">
                  企業情報を登録すると、案件投稿ページで募集内容を作成できます。学生団体に伝えたい想いや期待を具体的に記載しましょう。
                </CardDescription>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Highlight
                  icon={<Sparkles className="h-4 w-4" />}
                  title="審査付きで安心"
                  description="投稿された案件は運営が内容を確認してから公開されます。"
                />
                <Highlight
                  icon={<Upload className="h-4 w-4" />}
                  title="企業ロゴも掲載可能"
                  description="ロゴURLを登録すると、案件カードにロゴが表示され認知が高まります。"
                />
              </div>
            </CardHeader>
          </Card>

          <Card className="glass-outline border-white/10 bg-black/25">
            <CardHeader>
              <CardTitle className="text-xl text-white">登録の流れ</CardTitle>
              <CardDescription className="text-slate-300">
                企業情報は案件ごとに再利用できます。投稿までの所要時間は約5分です。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                { label: '基本情報', detail: '企業名・担当者連絡先など、必須項目は最小限です。' },
                { label: 'オプション情報', detail: 'Webサイトやロゴを登録すると信頼感が向上します。' },
                { label: '案件投稿へ', detail: '登録後すぐに案件入力画面へ遷移します。' },
                { label: '公開申請', detail: '運営審査を経て公開。進捗は管理画面から確認できます。' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">{item.label}</p>
                  <p className="mt-2 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          {isUsingMock && (
            <Alert className="glass-outline border-yellow-400/40 bg-yellow-500/10 text-yellow-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <AlertDescription>
                  Supabase が未設定のためデモモードで動作します。実際の保存は行われませんが、案件投稿ページへは遷移できます。
                </AlertDescription>
              </div>
            </Alert>
          )}

          {message && (
            <Alert
              className={`glass-outline ${
                message.type === 'success'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <AlertDescription>{message.text}</AlertDescription>
              </div>
            </Alert>
          )}

          <Card className="glass-outline border-white/10 bg-black/30">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-white">企業情報フォーム</CardTitle>
              <CardDescription className="text-slate-300">
                入力内容は管理画面でいつでも編集できます。まずは基本情報から登録しましょう。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <Field label="企業名" name="company_name" required>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="例）ユニオン株式会社"
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                    required
                  />
                </Field>

                <Field label="担当者メールアドレス" name="contact_email" required>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="example@company.com"
                    className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                    required
                  />
                </Field>

                <Field label="Webサイト" name="website">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="h-11 flex-1 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                </Field>

                <Field label="ロゴURL" name="logo_url">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    <Input
                      id="logo_url"
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      placeholder="https://.../logo.png（画像URL）"
                      className="h-11 flex-1 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    画像の直リンクを貼り付けると案件カードにロゴが表示されます。
                  </p>
                </Field>

                <Field label="企業概要" name="description">
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="事業内容や学生との協業における姿勢・期待などをご記入ください。"
                    rows={6}
                    className="rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="union-gradient union-glow h-11 w-full text-sm font-semibold disabled:opacity-60"
                >
                  {isSubmitting ? '登録中…' : '登録して案件投稿に進む'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                <p className="text-xs text-slate-400">
                  登録後は公開申請前に内容を確認できます。入力内容はいつでも編集可能です。
                </p>
              </form>
            </CardContent>
          </Card>
        </aside>
      </section>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <BackgroundAura />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
            <Sparkles className="h-4 w-4" />
            Company Entry
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            企業情報を登録する
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            学生団体と信頼ある接点をつくるため、企業としての想いや採用ポリシーを丁寧に伝えましょう。登録完了後すぐに案件投稿を始められます。
          </p>
        </div>
        <div className="mt-12 space-y-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

function Field({
  label,
  name,
  children,
  required,
}: {
  label: string
  name: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
      >
        {label}
        {required && <span className="ml-1 text-rose-300">*</span>}
      </Label>
      {children}
    </div>
  )
}

function Highlight({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
      <div className="flex items-center gap-2 text-indigo-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10">
          {icon}
        </span>
        <p className="font-semibold text-white">{title}</p>
      </div>
      <p className="mt-3 leading-relaxed text-slate-300">{description}</p>
    </div>
  )
}

function BackgroundAura() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[30%] h-[420px] bg-[radial-gradient(circle_at_center,_rgba(236,147,255,0.16),_transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-25%] h-[480px] bg-[radial-gradient(circle_at_bottom,_rgba(45,212,191,0.12),_transparent_70%)] blur-3xl" />
    </>
  )
}
