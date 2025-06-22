import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowLeft, Download, Eye, Edit, Trash2, Users, Building2, TrendingUp } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { getStoredProjects, getStoredApplications } from "../data/mockData";

const AdminPanel = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authenticated, setAuthenticated] = useState(false);
  const [authForm, setAuthForm] = useState({ username: "", password: "" });

  // Simple authentication (for demo purposes)
  const handleAuth = (e) => {
    e.preventDefault();
    if (authForm.username === "admin" && authForm.password === "union2025") {
      setAuthenticated(true);
      loadData();
    } else {
      toast({
        title: "認証エラー",
        description: "ユーザー名またはパスワードが正しくありません。",
        variant: "destructive"
      });
    }
  };

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      const storedProjects = getStoredProjects();
      const storedApplications = getStoredApplications();
      setProjects(storedProjects);
      setApplications(storedApplications);
      setLoading(false);
    }, 500);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateProjectStatus = (projectId, newStatus) => {
    const updatedProjects = projects.map(project => 
      project.id === projectId ? { ...project, status: newStatus } : project
    );
    setProjects(updatedProjects);
    localStorage.setItem('union_match_projects', JSON.stringify(updatedProjects));
    
    toast({
      title: "ステータスを更新しました",
      description: `案件のステータスを${newStatus}に変更しました。`,
    });
  };

  const deleteProject = (projectId) => {
    if (window.confirm("この案件を削除してもよろしいですか？")) {
      const updatedProjects = projects.filter(project => project.id !== projectId);
      setProjects(updatedProjects);
      localStorage.setItem('union_match_projects', JSON.stringify(updatedProjects));
      
      toast({
        title: "案件を削除しました",
        description: "案件が正常に削除されました。",
      });
    }
  };

  const exportToCSV = (type) => {
    let data, headers, filename;
    
    if (type === 'projects') {
      headers = ['ID', 'タイトル', '予算', '締切', 'ステータス', '連絡先メール', 'LINE ID', 'Slack ID', 'タグ', '作成日'];
      data = projects.map(project => [
        project.id,
        project.title,
        project.budget,
        project.deadline,
        project.status,
        project.contact_email,
        project.contact_line || '',
        project.contact_slack || '',
        project.internal_tag || '',
        project.created_at
      ]);
      filename = 'projects_export.csv';
    } else {
      headers = ['ID', '案件ID', 'アピール内容', '団体名', '代表者名', '連絡先', '応募日'];
      data = applications.map(app => [
        app.id,
        app.project_id,
        app.appeal.substring(0, 100) + '...',
        app.org_name || '匿名',
        app.rep_name || '未記入',
        app.contact_email || '未記入',
        app.created_at
      ]);
      filename = 'applications_export.csv';
    }

    const csvContent = [headers, ...data]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();

    toast({
      title: "CSVエクスポート完了",
      description: `${filename}をダウンロードしました。`,
    });
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getApplicationsForProject = (projectId) => {
    return applications.filter(app => app.project_id === projectId);
  };

  const stats = {
    totalProjects: projects.length,
    publicProjects: projects.filter(p => p.status === 'public').length,
    totalApplications: applications.length,
    avgApplicationsPerProject: projects.length > 0 ? (applications.length / projects.length).toFixed(1) : 0
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] bg-clip-text text-transparent">
              UNION Match 管理画面
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">ユーザー名</Label>
                <Input
                  id="username"
                  type="text"
                  value={authForm.username}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white"
              >
                ログイン
              </Button>
              <p className="text-xs text-gray-500 text-center">
                デモ用: admin / union2025
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] bg-clip-text text-transparent">
              UNION Match 管理画面
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button onClick={() => setAuthenticated(false)} variant="outline">
              ログアウト
            </Button>
            <Link to="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                サイトに戻る
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0">
            <CardContent className="p-4 text-center">
              <Building2 className="h-8 w-8 text-[#066FF2] mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <div className="text-sm text-gray-600">総案件数</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0">
            <CardContent className="p-4 text-center">
              <Eye className="h-8 w-8 text-[#EC4FAF] mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.publicProjects}</div>
              <div className="text-sm text-gray-600">公開中案件</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-[#066FF2] mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <div className="text-sm text-gray-600">総応募数</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-[#EC4FAF] mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.avgApplicationsPerProject}</div>
              <div className="text-sm text-gray-600">平均応募数/案件</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="projects">案件管理</TabsTrigger>
            <TabsTrigger value="applications">応募管理</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {/* Filters and Export */}
            <Card className="bg-white/80 backdrop-blur-sm border-0">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <Input
                      placeholder="案件を検索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="max-w-sm">
                        <SelectValue placeholder="ステータスで絞り込み" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="public">公開中</SelectItem>
                        <SelectItem value="draft">下書き</SelectItem>
                        <SelectItem value="archived">アーカイブ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => exportToCSV('projects')}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] text-white"
                  >
                    <Download className="h-4 w-4" />
                    CSVエクスポート
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Projects List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse bg-white/80">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-4" />
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="bg-white/80 backdrop-blur-sm border-0">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{project.title}</h3>
                            <Badge 
                              className={
                                project.status === 'public' ? 'bg-green-100 text-green-700' :
                                project.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }
                            >
                              {project.status === 'public' ? '公開中' : 
                               project.status === 'draft' ? '下書き' : 'アーカイブ'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>予算: {project.budget}</p>
                            <p>締切: {formatDate(project.deadline)}</p>
                            <p>作成日: {formatDate(project.created_at)}</p>
                            <p>応募数: {getApplicationsForProject(project.id).length}件</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Select 
                            value={project.status} 
                            onValueChange={(value) => updateProjectStatus(project.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">公開</SelectItem>
                              <SelectItem value="draft">下書き</SelectItem>
                              <SelectItem value="archived">アーカイブ</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            <Link to={`/projects/${project.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteProject(project.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            {/* Export Button */}
            <Card className="bg-white/80 backdrop-blur-sm border-0">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">応募一覧</h3>
                  <Button 
                    onClick={() => exportToCSV('applications')}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] text-white"
                  >
                    <Download className="h-4 w-4" />
                    CSVエクスポート
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            <div className="space-y-4">
              {applications.map((application) => {
                const project = projects.find(p => p.id === application.project_id);
                return (
                  <Card key={application.id} className="bg-white/80 backdrop-blur-sm border-0">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">
                            {project ? project.title : '案件が見つかりません'}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1 mb-3">
                            <p>団体名: {application.org_name || "匿名"}</p>
                            <p>代表者: {application.rep_name || "未記入"}</p>
                            <p>連絡先: {application.contact_email || "未記入"}</p>
                            <p>応募日: {formatDate(application.created_at)}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-1">アピール内容:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {application.appeal}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;