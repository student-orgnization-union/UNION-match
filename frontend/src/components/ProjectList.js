import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ArrowLeft, Search, Calendar, MapPin, Building2, TrendingUp } from "lucide-react";
import { getStoredProjects } from "../data/mockData";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const storedProjects = getStoredProjects();
      setProjects(storedProjects.filter(p => p.status === 'public'));
      setLoading(false);
    }, 500);
  }, []);

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.internal_tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return "締切済み";
    if (daysDiff === 0) return "本日締切";
    if (daysDiff === 1) return "明日締切";
    return `あと${daysDiff}日`;
  };

  const getUrgencyColor = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return "bg-gray-100 text-gray-600";
    if (daysDiff <= 3) return "bg-red-100 text-red-700";
    if (daysDiff <= 7) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

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
              UNION Match
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/post">
              <Button className="bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white">
                案件を掲載
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                ホーム
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-4">案件一覧</h1>
          <p className="text-lg text-gray-600 mb-8">
            学生団体との協業案件を探して、今すぐ応募しましょう
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="案件を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Building2 className="h-6 w-6 text-[#066FF2] mr-2" />
                <span className="text-2xl font-bold text-gray-900">{projects.length}</span>
              </div>
              <p className="text-sm text-gray-600">掲載中の案件</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-[#EC4FAF] mr-2" />
                <span className="text-2xl font-bold text-gray-900">32</span>
              </div>
              <p className="text-sm text-gray-600">今月の応募数</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-[#066FF2] mr-2" />
                <span className="text-2xl font-bold text-gray-900">8</span>
              </div>
              <p className="text-sm text-gray-600">今月の成約数</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects List */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {loading ? (
            <div className="space-y-6">
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
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
              <CardContent>
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "検索結果が見つかりません" : "掲載中の案件はありません"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? "別のキーワードで検索してみてください" : "新しい案件の掲載をお待ちください"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 group-hover:text-[#066FF2] transition-colors">
                          {project.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline" className="text-[#066FF2] border-[#066FF2]/30">
                            {project.budget}
                          </Badge>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(project.deadline)}まで
                          </div>
                        </div>
                      </div>
                      <Badge className={`${getUrgencyColor(project.deadline)} shrink-0`}>
                        {getTimeRemaining(project.deadline)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {project.description.replace(/#+/g, '').substring(0, 150)}...
                    </p>
                    
                    {project.internal_tag && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.internal_tag.split(',').map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        掲載日: {formatDate(project.created_at)}
                      </span>
                      <Link to={`/projects/${project.id}`}>
                        <Button className="bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white">
                          詳細を見る
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProjectList;