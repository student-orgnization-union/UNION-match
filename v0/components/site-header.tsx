import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="UNION Match ホーム">
          <div className="relative h-12 w-[300px] sm:h-14 sm:w-[420px]">
            <Image
              src="/images/logo-for-black.png"
              alt="UNION 学生団体連合 ロゴ"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/projects" className="text-sm font-medium text-white/80 hover:text-white">
            案件一覧
          </Link>
          <Link href="/start" className="text-sm font-medium text-white/80 hover:text-white">
            はじめに
          </Link>
          {/* </CHANGE> */}
          <Button asChild className="union-gradient text-white shadow-none">
            <Link href="/company">案件を投稿</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
