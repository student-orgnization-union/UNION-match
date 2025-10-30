import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

type BrandedPageShellProps = {
  badge?: ReactNode
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export function BrandedPageShell({
  badge,
  title,
  description,
  actions,
  children,
  contentClassName,
}: BrandedPageShellProps) {
  const hasHero = badge || title || description || actions

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <BackgroundAura />
      <SiteHeader />
      <main className={cn('relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8')}>
        {hasHero && (
          <div className="mx-auto max-w-3xl text-center">
            {badge && <div className="inline-flex items-center justify-center">{badge}</div>}
            {title && <div className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</div>}
            {description && (
              <p className="mt-4 text-lg leading-relaxed text-slate-300 sm:text-xl">{description}</p>
            )}
            {actions && <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div>}
          </div>
        )}
        <div className={cn('mt-12 space-y-10', contentClassName)}>{children}</div>
      </main>
      <SiteFooter />
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

