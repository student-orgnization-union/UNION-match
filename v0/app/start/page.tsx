import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function StartPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />

      <main className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-12">はじめに</h1>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          <Card className="union-card border-white/10">
            <CardHeader>
              <div className="w-12 h-12 union-gradient rounded-xl flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">一般ユーザー</CardTitle>
              <CardDescription className="text-gray-400">
                公開中の案件を探して応募できます（ログイン不要）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full union-gradient text-white border-0">
                <Link href="/projects">案件を探す</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="union-card border-white/10">
            <CardHeader>
              <div className="w-12 h-12 union-gradient rounded-xl flex items-center justify-center mb-3">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">投稿ユーザー（企業）</CardTitle>
              <CardDescription className="text-gray-400">まずは企業登録のうえ、案件を投稿してください</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full union-gradient text-white border-0">
                <Link href="/company">企業登録へ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* </CHANGE> */}
      </main>

      <SiteFooter />
    </div>
  )
}
