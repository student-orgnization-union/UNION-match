import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowRight, Users, Building2, TrendingUp, Star } from "lucide-react";

const LandingPage = () => {
  const stats = [
    { label: "登録学生団体", value: "230+", icon: Users },
    { label: "協力企業", value: "55+", icon: Building2 },
    { label: "成約件数", value: "120+", icon: TrendingUp },
    { label: "満足度", value: "4.8/5", icon: Star }
  ];

  const features = [
    {
      title: "簡単な案件掲載",
      description: "3分で企業案件を掲載。学生団体からの応募を待つだけ。",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "質の高いマッチング", 
      description: "厳選された学生団体との効率的なマッチングを実現。",
      gradient: "from-pink-500 to-pink-600"
    },
    {
      title: "透明な条件設定",
      description: "報酬や条件を明確化し、ミスマッチを防止します。",
      gradient: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] bg-clip-text text-transparent">
              UNION Match
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/projects" className="text-gray-600 hover:text-[#066FF2] transition-colors">
              案件一覧
            </Link>
            <Link to="/post">
              <Button className="bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white">
                案件を掲載する
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-gradient-to-r from-[#066FF2]/10 to-[#EC4FAF]/10 text-[#066FF2] border-[#066FF2]/20">
            β版リリース中 🚀
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            学生団体と企業を<br />
            <span className="bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] bg-clip-text text-transparent">
              つなぐ
            </span>
            プラットフォーム
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            優秀な学生団体との協業機会を見つけたい企業と、
            実践的な経験を積みたい学生団体のための
            マッチングプラットフォームです。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/post">
              <Button size="lg" className="bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] hover:from-[#055bd8] hover:to-[#d63d94] text-white px-8 py-4 text-lg group">
                無料で案件を掲載
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/projects">
              <Button size="lg" variant="outline" className="border-2 border-[#066FF2] text-[#066FF2] hover:bg-[#066FF2] hover:text-white px-8 py-4 text-lg">
                案件を探す
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">なぜUNION Matchなのか</h2>
            <p className="text-xl text-gray-600">学生団体と企業の最適なマッチングを実現する3つの特徴</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl mb-6 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">今すぐ始めてみませんか？</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            アカウント登録不要で、すぐに案件の掲載・応募が可能です。
            学生団体との新しい協業の形を体験してください。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/post">
              <Button size="lg" className="bg-white text-[#066FF2] hover:bg-gray-50 px-8 py-4 text-lg font-semibold">
                企業として案件を掲載
              </Button>
            </Link>
            <Link to="/projects">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#066FF2] px-8 py-4 text-lg font-semibold">
                学生として案件を探す
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-[#066FF2] to-[#EC4FAF] rounded-md" />
              <span className="text-lg font-bold">UNION Match</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 UNION Match. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;