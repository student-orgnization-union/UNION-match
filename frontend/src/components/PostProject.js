import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowLeft, Upload, Mail, MessageSquare, Calendar, Tag } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { saveProject } from "../data/mockData";

const PostProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    budget: "",
    deadline: "",
    description: "",
    contact_email: "",
    contact_line: "",
    contact_slack: "",
    internal_tag: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!formData.title || !formData.budget || !formData.deadline || !formData.description || !formData.contact_email) {
      toast({
        title: "入力エラー",
        description: "必須項目をすべて入力してください。",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      toast({
        title: "入力エラー", 
        description: "正しいメールアドレスを入力してください。",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to mock storage
      const newProject = saveProject(formData);
      
      toast({
        title: "案件を掲載しました！",
        description: "学生団体からの応募をお待ちください。",
      });

      // Redirect to projects list after success
      setTimeout(() => {
        navigate("/projects");
      }, 1500);

    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "しばらく時間をおいて再度お試しください。",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] bg-clip-text text-transparent">
              UNION Match
            </span>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Badge className="mb-4 bg-gradient-to-r from-[#066FF2]/10 to-[#EC4FAF]/10 text-[#066FF2] border-[#066FF2]/20">
            案件掲載
          </Badge>
          <h1 className="text-3xl font-bold mb-2">新しい案件を掲載する</h1>
          <p className="text-gray-600">学生団体との協業案件を投稿してください。掲載は無料です。</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#066FF2]" />
              案件情報の入力
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  案件タイトル <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="例：大学祭スポンサー企業との共同イベント企画"
                  className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                  required
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium">
                  予算・報酬 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="例：20万円〜50万円 + 商品提供"
                  className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                  required
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  応募締切 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                  required
                />
              </div>

              {/* Category/Tag */}
              <div className="space-y-2">
                <Label htmlFor="internal_tag" className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  カテゴリ・タグ
                </Label>
                <Input
                  id="internal_tag"
                  name="internal_tag"
                  value={formData.internal_tag}
                  onChange={handleChange}
                  placeholder="例：イベント企画,SNSマーケティング,技術勉強会"
                  className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                />
                <p className="text-xs text-gray-500">複数のタグはカンマ（,）で区切ってください</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  案件詳細 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={8}
                  placeholder={`## 企画概要\n（案件の概要を記載してください）\n\n## 求める内容\n- 具体的な作業内容\n- 必要なスキル・経験\n\n## 提供内容\n- 報酬や特典の詳細\n- その他提供可能なサポート`}
                  className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2] resize-none"
                  required
                />
                <p className="text-xs text-gray-500">Markdown記法が使用できます</p>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-[#066FF2]" />
                  連絡先情報
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-sm font-medium">
                      メールアドレス <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="contact@example.com"
                      className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                      required
                    />
                    <p className="text-xs text-gray-500">マッチング成立時に学生団体に共有されます</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_line" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        LINE ID
                      </Label>
                      <Input
                        id="contact_line"
                        name="contact_line"
                        value={formData.contact_line}
                        onChange={handleChange}
                        placeholder="@example_line"
                        className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_slack" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Slack ID
                      </Label>
                      <Input
                        id="contact_slack"
                        name="contact_slack"
                        value={formData.contact_slack}
                        onChange={handleChange}
                        placeholder="example-team"
                        className="border-gray-300 focus:border-[#066FF2] focus:ring-[#066FF2]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">LINE IDまたはSlack IDを入力すると、よりスムーズな連絡が可能です</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white py-3 text-lg font-medium"
                >
                  {isSubmitting ? "掲載中..." : "案件を掲載する"}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  掲載は無料です。学生団体からの応募をお待ちください。
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostProject;