import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ArrowLeft, Calendar, Mail, MessageSquare, Building2, Users, Send } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { getProjectById, getApplicationsByProjectId, saveApplication } from "../data/mockData";

const ProjectDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    appeal: "",
    org_name: "",
    rep_name: "",
    contact_email: ""
  });

  useEffect(() => {
    const loadProject = () => {
      const projectData = getProjectById(id);
      const projectApplications = getApplicationsByProjectId(id);
      
      setProject(projectData);
      setApplications(projectApplications);
      setLoading(false);
    };

    loadProject();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return { text: "締切済み", color: "bg-gray-100 text-gray-600" };
    if (daysDiff === 0) return { text: "本日締切", color: "bg-red-100 text-red-700" };
    if (daysDiff === 1) return { text: "明日締切", color: "bg-yellow-100 text-yellow-700" };
    if (daysDiff <= 7) return { text: `あと${daysDiff}日`, color: "bg-yellow-100 text-yellow-700" };
    return { text: `あと${daysDiff}日`, color: "bg-green-100 text-green-700" };
  };

  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setApplying(true);

    // Validation
    if (!applicationData.appeal.trim()) {
      toast({
        title: "入力エラー",
        description: "アピール内容を入力してください。",
        variant: "destructive"
      });
      setApplying(false);
      return;
    }

    // Email validation if provided
    if (applicationData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicationData.contact_email)) {
      toast({
        title: "入力エラー",
        description: "正しいメールアドレスを入力してください。",
        variant: "destructive"
      });
      setApplying(false);
      return;
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save application
      const newApplication = saveApplication({
        project_id: id,
        ...applicationData
      });
      
      // Update local state
      setApplications(prev => [...prev, newApplication]);
      
      toast({
        title: "応募を送信しました！",
        description: "企業からの連絡をお待ちください。",
      });

      // Reset form
      setApplicationData({
        appeal: "",
        org_name: "",
        rep_name: "",
        contact_email: ""
      });
      setShowApplicationForm(false);

    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "しばらく時間をおいて再度お試しください。",
        variant: "destructive"
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#066FF2]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">案件が見つかりません</h1>
          <Link to="/projects">
            <Button>案件一覧に戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(project.deadline);
  const isExpired = new Date(project.deadline) < new Date();

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
          <Link to="/projects">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              案件一覧に戻る
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Project Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-3">{project.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="text-[#066FF2] border-[#066FF2]/30">
                        {project.budget}
                      </Badge>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        締切: {formatDate(project.deadline)}
                      </div>
                    </div>
                  </div>
                  <Badge className={timeRemaining.color}>
                    {timeRemaining.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {project.description.split('\n').map((line, index) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-gray-900">
                          {line.replace('## ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={index} className="ml-4 mb-1">
                          {line.replace('- ', '')}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={index} />;
                    }
                    return (
                      <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                </div>

                {project.internal_tag && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">関連タグ</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.internal_tag.split(',').map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Form */}
            {!isExpired && (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-[#066FF2]" />
                    この案件に応募する
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showApplicationForm ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-[#066FF2] mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">応募してみませんか？</h3>
                      <p className="text-gray-600 mb-6">
                        この案件に興味がある場合は、応募フォームからアピールを送信してください。
                      </p>
                      <Button
                        onClick={() => setShowApplicationForm(true)}
                        className="bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white"
                      >
                        応募フォームを開く
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplicationSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="appeal">
                          アピール内容 <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="appeal"
                          name="appeal"
                          value={applicationData.appeal}
                          onChange={handleApplicationChange}
                          rows={6}
                          placeholder="私たちの団体がこの案件に最適な理由、過去の実績、取り組み方など、自由にアピールしてください。"
                          className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                          required
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">連絡先情報（任意）</h4>
                        <p className="text-sm text-gray-600">
                          入力いただくと、企業からの直接連絡が可能になります。
                          未入力の場合は、UNION運営を通じて連絡調整を行います。
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="org_name">団体名</Label>
                            <Input
                              id="org_name"
                              name="org_name"
                              value={applicationData.org_name}
                              onChange={handleApplicationChange}
                              placeholder="○○大学△△サークル"
                              className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="rep_name">代表者名</Label>
                            <Input
                              id="rep_name"
                              name="rep_name"
                              value={applicationData.rep_name}
                              onChange={handleApplicationChange}
                              placeholder="田中太郎"
                              className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contact_email">連絡先メールアドレス</Label>
                          <Input
                            id="contact_email"
                            name="contact_email"
                            type="email"
                            value={applicationData.contact_email}
                            onChange={handleApplicationChange}
                            placeholder="contact@example.com"
                            className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowApplicationForm(false)}
                          className="flex-1"
                        >
                          キャンセル
                        </Button>
                        <Button
                          type="submit"
                          disabled={applying}
                          className="flex-1 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white"
                        >
                          {applying ? "送信中..." : "応募する"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#066FF2]" />
                  案件情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">掲載日</h4>
                  <p className="text-gray-600">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">応募締切</h4>
                  <p className="text-gray-600">{formatDate(project.deadline)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">予算・報酬</h4>
                  <p className="text-gray-600">{project.budget}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">応募状況</h4>
                  <p className="text-[#066FF2] font-medium">{applications.length}件の応募</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#066FF2]" />
                  連絡先
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">メール連絡可能</span>
                </div>
                {project.contact_line && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">LINE連絡可能</span>
                  </div>
                )}
                {project.contact_slack && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Slack連絡可能</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  ※ 具体的な連絡先は応募後に共有されます
                </p>
              </CardContent>
            </Card>

            {/* Related Actions */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Link to="/projects">
                    <Button variant="outline" className="w-full">
                      他の案件を見る
                    </Button>
                  </Link>
                  <Link to="/post">
                    <Button className="w-full bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white">
                      企業として案件を掲載
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;