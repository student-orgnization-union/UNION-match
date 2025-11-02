import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Target, Clock, CheckCircle, ArrowRight, Sparkles, Zap, Globe } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 union-gradient opacity-10"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
              <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm text-gray-300">学生団体×企業マッチングプラットフォーム</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            機会損失をなくし、
            <br />
            <span className="union-text-gradient">最適なパートナー</span>
            <br />
            と出会う
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            学生団体と企業をつなぐ革新的なマッチングプラットフォーム。
            新しい可能性を発見し、共に成長できるパートナーシップを築きましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button asChild size="lg" className="union-gradient text-white union-glow border-0 px-8 py-4 text-lg">
              <Link href="/projects">
                案件を探す
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/company">案件を投稿</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Entry Section: 3 Players */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">はじめに</h2>
          <p className="text-center text-gray-400 mb-12">目的にあわせて、以下の入り口からお進みください。</p>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* 一般ユーザー */}
            <Card className="union-card border-white/10">
              <CardHeader>
                <div className="w-12 h-12 union-gradient rounded-xl flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">一般ユーザー（学生・学生団体）</CardTitle>
                <CardDescription className="text-gray-400">公開中の案件を閲覧・応募（ログイン不要）</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full union-gradient text-white border-0">
                  <Link href="/projects">案件一覧へ</Link>
                </Button>
              </CardContent>
            </Card>

            {/* 投稿ユーザー */}
            <Card className="union-card border-white/10">
              <CardHeader>
                <div className="w-12 h-12 union-gradient rounded-xl flex items-center justify-center mb-3">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">投稿ユーザー（企業）</CardTitle>
                <CardDescription className="text-gray-400">企業登録のあと、案件投稿ページに移動します</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full union-gradient text-white border-0">
                  <Link href="/company">企業登録 → 案件投稿へ</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              なぜ<span className="union-text-gradient">UNION Match</span>なのか
            </h2>
            <p className="text-xl text-gray-400">学生団体と企業、それぞれにとってのメリット</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* 学生団体のメリット */}
            <div className="space-y-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 union-gradient-2 rounded-2xl flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold">学生団体の皆様</h3>
              </div>
              <div className="space-y-6">
                <Card className="union-card border-white/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Target className="h-4 w-4 text-green-400" />
                      </div>
                      多様な機会へのアクセス
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">人脈に頼らず、様々な企業からの案件に応募できます</p>
                  </CardContent>
                </Card>
                <Card className="union-card border-white/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      効率的な案件探し
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">一覧で案件を確認し、興味のあるものにすぐ応募可能</p>
                  </CardContent>
                </Card>
                <Card className="union-card border-white/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                      </div>
                      スキルアップの機会
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">実践的なプロジェクトを通じて経験とスキルを積めます</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 企業のメリット */}
            <div className="space-y-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 union-gradient-3 rounded-2xl flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold">企業の皆様</h3>
              </div>
              <div className="space-y-6">
                <Card className="union-card border-white/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Globe className="h-4 w-4 text-green-400" />
                      </div>
                      幅広い学生団体へリーチ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">従来の人脈では出会えない多様な学生団体と接点を持てます</p>
                  </CardContent>
                </Card>
                <Card className="union-card border-white/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Zap className="h-4 w-4 text-blue-400" />
                      </div>
                      効率的な採用・協業
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">意欲的な学生団体からの応募を効率的に受け付けられます</p>
                  </CardContent>
                </Card>
                <Card className="union-card border-white/10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center text-white">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      </div>
                      新しいアイデアの獲得
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">学生ならではの視点から新鮮なアイデアを得られます</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 union-gradient opacity-20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">今すぐ始めましょう</h2>
          <p className="text-xl text-gray-400 mb-12">新しい出会いと機会があなたを待っています</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button asChild size="lg" className="union-gradient text-white union-glow border-0 px-8 py-4 text-lg">
              <Link href="/projects">案件を探す</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/company">案件を投稿する</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
