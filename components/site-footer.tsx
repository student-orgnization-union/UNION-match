import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

const footerNav = [
  { href: '/projects', label: '案件一覧' },
  { href: '/company', label: '企業登録' },
  { href: '/post', label: '案件投稿' },
  { href: '/admin', label: '管理画面' },
]

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-white/10 pb-10 pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/8 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel grid gap-10 rounded-3xl px-6 py-8 sm:px-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="relative h-12 w-[220px] sm:h-14 sm:w-[280px]">
              <Image
                src="/images/for-footer.png"
                alt="UNION Match ロゴ"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              学生団体と企業が共創する未来を描くマッチング・プラットフォーム。案件の投稿から応募、承認までをシームレスに支援します。
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-indigo-200">
              <span>Students</span>
              <span className="text-slate-500">•</span>
              <span>Companies</span>
              <span className="text-slate-500">•</span>
              <span>UNION Team</span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">NAVIGATION</p>
              <nav className="grid gap-3 text-sm text-slate-300">
                {footerNav.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Get in touch</p>
              <Button
                asChild
                className="union-gradient union-glow h-11 w-full rounded-xl text-sm font-semibold"
              >
                <Link href="/company">企業として参加する</Link>
              </Button>
              <p className="text-right text-[11px] text-slate-500">
                © {new Date().getFullYear()} UNION Match. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
