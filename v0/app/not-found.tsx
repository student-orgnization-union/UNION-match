import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 union-gradient rounded-3xl mx-auto mb-8 flex items-center justify-center">
          <span className="text-3xl font-bold">404</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">ページが見つかりません</h1>
        <p className="text-gray-400 mb-8">
          お探しのページは存在しないか、移動または削除された可能性があります。URLをご確認いただくか、以下のリンクからお探しください。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="union-gradient text-white">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              ホームに戻る
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              掲示板（案件一覧）
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
