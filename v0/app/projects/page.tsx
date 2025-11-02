import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"

type ProjectCard = {
  id: string
  title: string
  budget: string | null
  deadline: string | null
  description: string
  created_at: string
  company: { id: string; name: string; logo_url: string | null } | null
}

type ProjectsResult = {
  projects: ProjectCard[]
  needsSetup: boolean
}

async function getProjects(): Promise<ProjectsResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("projects")
      .select(`
        id, title, budget, deadline, description, created_at,
        company:companies!projects_company_id_fkey ( id, name, logo_url )
      `)
      .eq("status", "public")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
      return { projects: [], needsSetup: false }
    }

    return { projects: (data as any) || [], needsSetup: false }
  } catch (e) {
    console.error("Unexpected error fetching projects:", e)
    return { projects: [], needsSetup: false }
  }
}

export default async function ProjectsPage() {
  const { projects, needsSetup } = await getProjects()

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            案件<span className="union-text-gradient">一覧</span>
          </h1>
          <p className="text-xl text-gray-400">
            企業から投稿された協業案件の一覧です。興味のある案件があれば詳細をご確認ください。
          </p>
        </div>

        {projects.length === 0 ? (
          <Card className="union-card border-white/10 text-center py-16">
            <CardContent>
              <div className="w-16 h-16 union-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">案件がまだありません</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">新しい案件が投稿されるまでお待ちください。</p>
              <Button asChild className="union-gradient hover:opacity-90 text-white border-0">
                <Link href="/company">案件を投稿する</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="union-card border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">募集中</Badge>
                  </div>
                  <CardTitle className="text-xl text-white group-hover:union-text-gradient transition-all duration-300 line-clamp-2">
                    {project.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.company && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
                          {project.company.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={project.company.logo_url || "/placeholder.svg"}
                              alt={`${project.company.name} ロゴ`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 text-white/60" />
                          )}
                        </div>
                        <Link
                          href={`/companies/${project.company.id}`}
                          className="text-sm text-white/80 hover:text-white"
                        >
                          {project.company.name}
                        </Link>
                      </div>
                    )}
                    {project.budget && (
                      <div className="flex items-center text-sm text-gray-400">
                        <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                          <DollarSign className="h-3 w-3 text-blue-400" />
                        </div>
                        {project.budget}
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center text-sm text-gray-400">
                        <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="h-3 w-3 text-orange-400" />
                        </div>
                        締切: {new Date(project.deadline).toLocaleDateString("ja-JP")}
                      </div>
                    )}
                    <CardDescription className="line-clamp-3 text-gray-400">{project.description}</CardDescription>
                    <Button asChild className="w-full union-gradient hover:opacity-90 text-white border-0 mt-6">
                      <Link href={`/projects/${project.id}`}>詳細を見る</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
