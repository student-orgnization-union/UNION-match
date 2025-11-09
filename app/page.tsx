import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Target, Clock, CheckCircle, ArrowRight, Sparkles, Zap, Globe, User } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--bg-0-fallback)' }}>
      {/* Header */}
      <SiteHeader />

      {/* Hero Section - Neo-Glass + Ambient Light */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Light: 点光源としての背景グラデーション */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: 'radial-gradient(circle at 30% 20%, var(--um-blue-fallback) 0%, transparent 50%), radial-gradient(circle at 70% 80%, var(--um-violet-fallback) 0%, transparent 50%)',
          }}
        />
        <div className="max-w-6xl mx-auto text-center relative z-10 motion-fade-in">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full glass-panel border-0 mb-6">
              <Sparkles className="h-4 w-4 mr-2" style={{ color: 'var(--um-blue-fallback)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--ink-subtle-fallback)' }}>学生個人・学生団体×企業マッチングプラットフォーム</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-white">
            機会損失をなくし、
            <br />
            <span className="union-text-gradient">最適なパートナー</span>
            <br />
            と出会う
          </h1>
          <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--ink-muted-fallback)' }}>
            学生個人・学生団体と企業をつなぐ革新的なマッチングプラットフォーム。
            新しい可能性を発見し、共に成長できるパートナーシップを築きましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="union-gradient text-white union-glow border-0 px-8 py-4 text-lg motion-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <Link href="/projects">
                案件を探す
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Entry Section: 3 Players - Neo-Glass Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white">はじめに</h2>
          <p className="text-center mb-12" style={{ color: 'var(--ink-subtle-fallback)' }}>目的にあわせて、以下の入り口からお進みください。</p>
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {/* 学生個人 */}
            <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <div className="w-12 h-12 union-gradient rounded-xl flex items-center justify-center mb-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">学生個人</CardTitle>
                <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>個人として案件に応募できます</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full union-gradient text-white border-0">
                  <Link href="/register/student">新規登録</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent">
                  <Link href="/login/student">ログイン</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full" style={{ color: 'var(--ink-muted-fallback)' }}>
                  <Link href="/projects/students">案件を探す（ログイン不要）</Link>
                </Button>
              </CardContent>
            </Card>

            {/* 学生団体 */}
            <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="w-12 h-12 union-gradient rounded-xl flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">学生団体</CardTitle>
                <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>団体として案件に応募できます</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full union-gradient text-white border-0">
                  <Link href="/register/organization">新規登録</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent">
                  <Link href="/login/organization">ログイン</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full" style={{ color: 'var(--ink-muted-fallback)' }}>
                  <Link href="/projects/organizations">案件を探す（ログイン不要）</Link>
                </Button>
              </CardContent>
            </Card>

            {/* 企業 */}
            <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <div className="w-12 h-12 union-gradient rounded-xl flex items-center justify-center mb-3">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">企業</CardTitle>
                <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>案件を投稿して学生とマッチング</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full union-gradient text-white border-0">
                  <Link href="/register/company">企業登録</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent">
                  <Link href="/login/company">ログイン</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full" style={{ color: 'var(--ink-muted-fallback)' }}>
                  <Link href="/post">案件を投稿</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - Neo-Glass */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 motion-fade-in">
            <h2 className="text-4xl font-bold mb-6 text-white">
              なぜ<span className="union-text-gradient">UNION Match</span>なのか
            </h2>
            <p className="text-xl" style={{ color: 'var(--ink-muted-fallback)' }}>学生個人・学生団体と企業、それぞれにとってのメリット</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* 学生団体のメリット */}
            <div className="space-y-8">
              <div className="flex items-center mb-8 motion-fade-in">
                <div className="w-12 h-12 union-gradient rounded-um-lg flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white">学生個人・学生団体の皆様</h3>
              </div>
              <div className="space-y-6">
                <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Target className="h-4 w-4 text-green-400" />
                      </div>
                      多様な機会へのアクセス
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'var(--ink-muted-fallback)' }}>人脈に頼らず、様々な企業からの案件に応募できます。学生個人としても、学生団体としても参加可能です。</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      効率的な案件探し
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'var(--ink-muted-fallback)' }}>一覧で案件を確認し、興味のあるものにすぐ応募可能</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.3s' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                      </div>
                      スキルアップの機会
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'var(--ink-muted-fallback)' }}>実践的なプロジェクトを通じて経験とスキルを積めます</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 企業のメリット */}
            <div className="space-y-8">
              <div className="flex items-center mb-8 motion-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="w-12 h-12 union-gradient rounded-um-lg flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white">企業の皆様</h3>
              </div>
              <div className="space-y-6">
                <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.5s' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Globe className="h-4 w-4 text-green-400" />
                      </div>
                      幅広い学生個人・学生団体へリーチ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'var(--ink-muted-fallback)' }}>従来の人脈では出会えない多様な学生個人・学生団体と接点を持てます</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.6s' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Zap className="h-4 w-4 text-blue-400" />
                      </div>
                      効率的な採用・協業
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'var(--ink-muted-fallback)' }}>意欲的な学生個人・学生団体からの応募を効率的に受け付けられます</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel border-0 rounded-um-lg motion-fade-in" style={{ animationDelay: '0.7s' }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      </div>
                      新しいアイデアの獲得
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'var(--ink-muted-fallback)' }}>学生ならではの視点から新鮮なアイデアを得られます</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Ambient Light */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Light: リムライト効果 */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            background: 'radial-gradient(circle at 50% 50%, var(--um-violet-fallback) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto text-center relative z-10 motion-fade-in">
          <h2 className="text-4xl font-bold mb-6 text-white">今すぐ始めましょう</h2>
          <p className="text-xl mb-12" style={{ color: 'var(--ink-muted-fallback)' }}>新しい出会いと機会があなたを待っています</p>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <Button asChild size="lg" className="union-gradient text-white union-glow border-0 px-6 py-4 text-base">
              <Link href="/register/student">学生個人として登録</Link>
            </Button>
            <Button asChild size="lg" className="union-gradient text-white union-glow border-0 px-6 py-4 text-base">
              <Link href="/register/organization">学生団体として登録</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-6 py-4 text-base bg-transparent"
            >
              <Link href="/register/company">企業として登録</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="ghost" style={{ color: 'var(--ink-muted-fallback)' }}>
              <Link href="/projects">案件を探す（ログイン不要）</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
