import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryProps {
  error?: Error
  resetError?: () => void
  title?: string
  description?: string
  showRetry?: boolean
  showHome?: boolean
  className?: string
}

export function ErrorDisplay({ 
  error, 
  resetError, 
  title = 'エラーが発生しました',
  description = '予期しないエラーが発生しました。ページを再読み込みするか、しばらく時間をおいてから再度お試しください。',
  showRetry = true,
  showHome = true,
  className = ''
}: ErrorBoundaryProps) {
  return (
    <div className={`min-h-screen bg-black text-white flex items-center justify-center px-4 ${className}`}>
      <Card className="union-card border-red-500/30 bg-red-500/10 text-center p-8 max-w-lg">
        <CardContent>
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-4">{title}</h3>
          <p className="text-gray-400 mb-6">{description}</p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">技術的詳細</summary>
              <pre className="text-xs text-gray-600 mt-2 p-2 bg-black/20 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && resetError && (
              <Button 
                onClick={resetError}
                className="union-gradient text-white border-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
            )}
            {showHome && (
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  ホームに戻る
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface NotFoundDisplayProps {
  title?: string
  description?: string
  showBackButton?: boolean
  backHref?: string
  backText?: string
}

export function NotFoundDisplay({ 
  title = 'ページが見つかりません',
  description = 'お探しのページは存在しないか、移動または削除された可能性があります。',
  showBackButton = true,
  backHref = '/projects',
  backText = '案件一覧に戻る'
}: NotFoundDisplayProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <Card className="union-card border-white/10 text-center p-8 max-w-lg">
        <CardContent>
          <div className="w-16 h-16 union-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold">404</span>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-4">{title}</h3>
          <p className="text-gray-400 mb-6">{description}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="union-gradient text-white border-0">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                ホームに戻る
              </Link>
            </Button>
            {showBackButton && (
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backText}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
