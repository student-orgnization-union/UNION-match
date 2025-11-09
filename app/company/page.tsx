'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Globe,
  ImageIcon,
  Sparkles,
  Upload,
} from 'lucide-react'

import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type MessageState =
  | { type: 'success'; text: string }
  | { type: 'error'; text: string }
  | null

export default function CompanyRegistrationPage() {
  const router = useRouter()

  useEffect(() => {
    // 新しい認証付き登録ページにリダイレクト
    router.replace('/register/company')
  }, [router])

  return null // リダイレクト中
}

