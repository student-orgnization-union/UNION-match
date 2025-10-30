import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '企業登録 | UNION Match',
  description: '企業の皆様はこちらから登録して、学生団体との協業案件を投稿できます。',
  keywords: ['企業登録', '企業', '学生団体', '協業', '案件投稿'],
  openGraph: {
    title: '企業登録 | UNION Match',
    description: '企業の皆様はこちらから登録して、学生団体との協業案件を投稿できます。',
    url: 'https://union-match.vercel.app/company',
  },
  twitter: {
    title: '企業登録 | UNION Match',
    description: '企業の皆様はこちらから登録して、学生団体との協業案件を投稿できます。',
  },
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
