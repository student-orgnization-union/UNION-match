import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '案件投稿 | UNION Match',
  description: '学生団体との協業案件を投稿してください。投稿後、運営による承認を経て公開されます。',
  keywords: ['案件投稿', '協業案件', '企業', '学生団体', 'プロジェクト'],
  openGraph: {
    title: '案件投稿 | UNION Match',
    description: '学生団体との協業案件を投稿してください。投稿後、運営による承認を経て公開されます。',
    url: 'https://union-match.vercel.app/post',
  },
  twitter: {
    title: '案件投稿 | UNION Match',
    description: '学生団体との協業案件を投稿してください。投稿後、運営による承認を経て公開されます。',
  },
}

export default function PostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
