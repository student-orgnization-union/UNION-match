// Mock data for UNION Match MVP
export const mockProjects = [
  {
    id: "1",
    title: "大学祭スポンサー企業との共同イベント企画",
    budget: "20万円〜50万円",
    deadline: "2025-07-15",
    description: `## 企画概要
大学祭期間中に実施する体験型イベントのプランニングから運営まで一緒に取り組んでいただける学生団体を募集しています。

## 求める内容
- イベント企画立案
- 当日運営スタッフ
- SNS宣伝協力

## 提供内容
- 企画費用の一部負担
- 商品・ノベルティ提供
- インターンシップ機会の提供`,
    contact_email: "events@example-corp.com",
    contact_line: "@example_events",
    contact_slack: "",
    internal_tag: "イベント企画,大学祭,スポンサー",
    status: "public",
    created_at: "2025-01-15T10:00:00Z",
    applications: []
  },
  {
    id: "2", 
    title: "新商品PRのためのSNSマーケティング協力",
    budget: "5万円〜15万円 + 商品提供",
    deadline: "2025-07-20",
    description: `## 企画概要
新発売の学生向け商品のSNSマーケティングをお手伝いいただける学生団体を募集します。

## 求める内容
- Instagram/TikTokでの商品紹介
- フォロワー向けキャンペーン企画
- レビュー記事作成

## 提供内容
- 商品無償提供
- 広告費用の一部負担
- マーケティング実績として使用許可`,
    contact_email: "marketing@newproduct.jp",
    contact_line: "",
    contact_slack: "newproduct-team",
    internal_tag: "SNSマーケティング,商品PR,学生向け",
    status: "public",
    created_at: "2025-01-14T15:30:00Z",
    applications: []
  },
  {
    id: "3",
    title: "ITスタートアップとの技術勉強会共同開催",
    budget: "10万円〜30万円",
    deadline: "2025-08-01",
    description: `## 企画概要
学生向けの技術勉強会を共同で開催していただける学生団体を募集しています。

## 求める内容
- 勉強会企画・運営
- 参加者募集
- 会場手配協力

## 提供内容
- 会場費・懇親会費負担
- 技術メンター派遣
- 優秀者にはインターン機会提供`,
    contact_email: "tech@startup-inc.com",
    contact_line: "@tech_events",
    contact_slack: "startup-tech",
    internal_tag: "技術勉強会,IT,スタートアップ",
    status: "public",
    created_at: "2025-01-13T09:15:00Z",
    applications: []
  }
];

export const mockApplications = [
  {
    id: "app1",
    project_id: "1",
    appeal: "私たちのサークルは過去3年間で5回の大学祭イベントを成功させてきました。特にSNS運用に強みがあり、前回のイベントでは1週間で3000フォロワーを獲得しました。",
    org_name: "○○大学イベント企画サークル",
    rep_name: "田中太郎",
    contact_email: "tanaka@student-email.com",
    created_at: "2025-01-16T14:20:00Z"
  },
  {
    id: "app2", 
    project_id: "1",
    appeal: "弊団体は学内で最大規模のボランティア団体です。200名の活動メンバーがおり、大規模イベントの運営経験が豊富です。",
    org_name: "学生ボランティア連合",
    rep_name: "",
    contact_email: "",
    created_at: "2025-01-16T16:45:00Z"
  }
];

// Helper functions to simulate localStorage operations
export const getStoredProjects = () => {
  const stored = localStorage.getItem('union_match_projects');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data if nothing stored
  localStorage.setItem('union_match_projects', JSON.stringify(mockProjects));
  return mockProjects;
};

export const getStoredApplications = () => {
  const stored = localStorage.getItem('union_match_applications');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data if nothing stored
  localStorage.setItem('union_match_applications', JSON.stringify(mockApplications));
  return mockApplications;
};

export const saveProject = (project) => {
  const projects = getStoredProjects();
  const newProject = {
    ...project,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    status: 'public',
    applications: []
  };
  projects.unshift(newProject);
  localStorage.setItem('union_match_projects', JSON.stringify(projects));
  return newProject;
};

export const saveApplication = (application) => {
  const applications = getStoredApplications();
  const newApplication = {
    ...application,
    id: Date.now().toString(),
    created_at: new Date().toISOString()
  };
  applications.push(newApplication);
  localStorage.setItem('union_match_applications', JSON.stringify(applications));
  return newApplication;
};

export const getProjectById = (id) => {
  const projects = getStoredProjects();
  return projects.find(project => project.id === id);
};

export const getApplicationsByProjectId = (projectId) => {
  const applications = getStoredApplications();
  return applications.filter(app => app.project_id === projectId);
};