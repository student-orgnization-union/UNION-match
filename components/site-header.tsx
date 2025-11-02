import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="glass-panel flex h-16 items-center justify-between rounded-full px-4 py-2 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="UNION Match ホーム">
            <div style={{ position: 'relative', width: '160px', height: '40px' }}>
              <Image
                src="/images/for-header.png"
                alt="UNION Match ロゴ"
                fill
                sizes="(max-width: 640px) 160px, 220px"
                className="object-contain object-left"
                priority
              />
            </div>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200 sm:block">
              Beta
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-200 md:flex">
            <Link href="/projects" className="transition hover:text-white">
              案件一覧
            </Link>
            <Link href="/start" className="transition hover:text-white">
              はじめに
            </Link>
            <Link href="/company" className="transition hover:text-white">
              企業登録
            </Link>
            <Link href="/admin" className="transition hover:text-white">
              管理画面
            </Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Join</span>
            <Button
              asChild
              className="union-gradient union-glow h-10 rounded-full px-5 text-xs font-semibold uppercase tracking-[0.2em]"
            >
              <Link href="/company">案件を投稿</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
