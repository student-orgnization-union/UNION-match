interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span
        className={`orb ${sizeClasses[size]} animate-[swirl_18s_linear_infinite] before:absolute before:inset-[12%] before:rounded-full before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-60`}
      />
      {text && (
        <p className="mt-4 text-sm text-slate-300">{text}</p>
      )}
    </div>
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className = '' }: LoadingCardProps) {
  return (
    <div className={`glass-panel overflow-hidden border-white/10 ${className}`}>
      <div className="grid-glimmer relative h-full p-6">
        <div className="space-y-4">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/8" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-white/8" />
          <div className="h-24 w-full animate-pulse rounded-2xl bg-white/8" />
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full border border-white/5 bg-white/5" />
      </div>
    </div>
  )
}

interface LoadingGridProps {
  count?: number
  className?: string
}

export function LoadingGrid({ count = 6, className = '' }: LoadingGridProps) {
  return (
    <div className={`grid gap-8 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}
