import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './fallback.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UNION Match - 学生団体×企業マッチングプラットフォーム',
  description: '学生団体と企業をつなぐマッチングプラットフォーム。新しい可能性を発見し、共に成長できるパートナーシップを築きましょう。',
  keywords: ['学生団体', '企業', 'マッチング', '協業', 'プロジェクト', 'インターンシップ', '就活'],
  authors: [{ name: 'UNION Match' }],
  creator: 'UNION Match',
  publisher: 'UNION Match',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://union-match.vercel.app'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'UNION Match - 学生団体×企業マッチングプラットフォーム',
    description: '学生団体と企業をつなぐマッチングプラットフォーム。新しい可能性を発見し、共に成長できるパートナーシップを築きましょう。',
    url: 'https://union-match.vercel.app',
    siteName: 'UNION Match',
    images: [
      {
        url: '/images/service.png',
        width: 1200,
        height: 630,
        alt: 'UNION Match - 学生団体×企業マッチングプラットフォーム',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNION Match - 学生団体×企業マッチングプラットフォーム',
    description: '学生団体と企業をつなぐマッチングプラットフォーム。新しい可能性を発見し、共に成長できるパートナーシップを築きましょう。',
    images: ['/images/service.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: 'Next.js'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
