import Image from 'next/image'
import Link from 'next/link'

export function SiteFooter() {
return (
  <footer className="border-t border-white/10 bg-black">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="relative h-14 w-[320px] md:h-16 md:w-[420px]">
          <Image
            src="/images/for-footer.png"
            alt="UNION 学生団体連合 ロゴ（フッター）"
            fill
            className="object-contain"
          />
        </div>
        <div className="text-center text-sm text-white/60 md:text-right">
          <p>© {new Date().getFullYear()} UNION Match. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/projects" className="hover:text-white">掲示板</Link>
            <span className="mx-2 text-white/30">/</span>
            <Link href="/post" className="hover:text-white">案件投稿</Link>
          </p>
        </div>
      </div>
    </div>
  </footer>
)
}

export default SiteFooter
