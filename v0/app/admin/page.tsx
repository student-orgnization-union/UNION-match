'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Check, X, CheckCircle, AlertCircle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

interface Project {
  id: string
  title: string
  budget: string | null
  deadline: string | null
  description: string
  contact_info: string
  status: string
  created_at: string
}

interface Application {
  id: string
  project_id: string
  appeal: string
  organization_name: string | null
  contact_info: string
  created_at: string
  project: {
    title: string
  }
}

function authHeaderOrUndefined() {
  const u = process.env.NEXT_PUBLIC_ADMIN_USERNAME
  const p = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  if (u && p) {
    return { Authorization: `Basic ${btoa(`${u}:${p}`)}` }
  }
  return undefined
}

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = authHeaderOrUndefined()
      const [projectsRes, applicationsRes] = await Promise.all([
        fetch('/api/admin/projects', { headers }),
        fetch('/api/admin/applications', { headers }),
      ])

      if (!projectsRes.ok || !applicationsRes.ok) {
        console.warn('Admin API fetch failed', { projects: projectsRes.status, applications: applicationsRes.status })
      }

      const projectsData = projectsRes.ok ? await projectsRes.json() : []
      const applicationsData = applicationsRes.ok ? await applicationsRes.json() : []
      setProjects(projectsData)
      setApplications(applicationsData)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json', ...(authHeaderOrUndefined() || {}) }
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `案件を${status === 'public' ? '承認' : '否認'}しました` })
        fetchData()
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || '更新に失敗しました')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ステータス更新に失敗しました' })
    }
  }

  const downloadCSV = () => {
    const csvContent = [
      ['応募ID', '案件名', '団体名', '連絡先', '応募理由', '応募日時'],
      ...applications.map(app => [
        app.id,
        app.project.title,
        app.organization_name || '',
        app.contact_info,
        app.appeal.replace(/\n/g, ' '),
        new Date(app.created_at).toLocaleString('ja-JP')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'review':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">審査中</Badge>
      case 'public':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">公開中</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">否認</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 union-gradient rounded-xl animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            管理<span className="union-text-gradient">画面</span>
          </h1>
          <p className="text-xl text-gray-400">案件の承認・否認と応募情報の管理を行います</p>
        </div>

        {message && (
          <Alert className={`mb-8 ${
            message.type === 'success' 
              ? 'border-green-500/30 bg-green-500/10' 
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              )}
              <AlertDescription className={
                message.type === 'success' ? 'text-green-300' : 'text-red-300'
              }>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid gap-12">
          {/* 案件管理 */}
          <Card className="union-card border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">案件管理</CardTitle>
              <CardDescription className="text-gray-400">投稿された案件の承認・否認を行います</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-gray-500 text-center py-12">案件がありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-300">案件名</TableHead>
                        <TableHead className="text-gray-300">予算</TableHead>
                        <TableHead className="text-gray-300">締切</TableHead>
                        <TableHead className="text-gray-300">ステータス</TableHead>
                        <TableHead className="text-gray-300">投稿日</TableHead>
                        <TableHead className="text-gray-300">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id} className="border-gray-800">
                          <TableCell className="font-medium text-white max-w-xs truncate">
                            {project.title}
                          </TableCell>
                          <TableCell className="text-gray-300">{project.budget || '-'}</TableCell>
                          <TableCell className="text-gray-300">
                            {project.deadline ? new Date(project.deadline).toLocaleDateString('ja-JP') : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(project.status)}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(project.created_at).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {project.status === 'review' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateProjectStatus(project.id, 'public')}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    承認
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateProjectStatus(project.id, 'rejected')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    否認
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 応募管理 */}
          <Card className="union-card border-white/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl text-white">応募管理</CardTitle>
                  <CardDescription className="text-gray-400">学生団体からの応募情報を管理します</CardDescription>
                </div>
                <Button 
                  onClick={downloadCSV} 
                  disabled={applications.length === 0}
                  className="union-gradient hover:opacity-90 text-white border-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV出力
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-12">応募がありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-300">案件名</TableHead>
                        <TableHead className="text-gray-300">団体名</TableHead>
                        <TableHead className="text-gray-300">連絡先</TableHead>
                        <TableHead className="text-gray-300">応募理由</TableHead>
                        <TableHead className="text-gray-300">応募日</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((application) => (
                        <TableRow key={application.id} className="border-gray-800">
                          <TableCell className="font-medium text-white max-w-xs truncate">
                            {application.project.title}
                          </TableCell>
                          <TableCell className="text-gray-300">{application.organization_name || '-'}</TableCell>
                          <TableCell className="text-gray-300">{application.contact_info}</TableCell>
                          <TableCell className="max-w-xs truncate text-gray-300">{application.appeal}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(application.created_at).toLocaleDateString('ja-JP')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
