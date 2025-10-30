import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '案件一覧 | UNION Match',
  description: '企業から投稿された協業案件の一覧です。学生団体が興味のある案件を見つけて応募できます。',
  keywords: ['案件一覧', '協業案件', '学生団体', '企業', 'プロジェクト', '応募'],
  openGraph: {
    title: '案件一覧 | UNION Match',
    description: '企業から投稿された協業案件の一覧です。学生団体が興味のある案件を見つけて応募できます。',
    url: 'https://union-match.vercel.app/projects',
  },
  twitter: {
    title: '案件一覧 | UNION Match',
    description: '企業から投稿された協業案件の一覧です。学生団体が興味のある案件を見つけて応募できます。',
  },
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
