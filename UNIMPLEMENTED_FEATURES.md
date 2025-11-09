# 未実装機能の詳細リスト

## 📋 ステップバイステップ：未実装機能の確認

### ✅ 既に実装済み（確認済み）

1. ✅ **企業詳細ページの評価表示機能**
   - 評価平均値・評価数の表示
   - 評価一覧の表示
   - UIのNeo-Glassデザイン適用

2. ✅ **案件完了後の相互評価機能の導線**
   - 企業・学生団体・学生個人のダッシュボードに評価ボタン追加
   - 評価ページへのリンク実装

3. ✅ **応募ステータス管理機能（API実装済み）**
   - 企業が応募を承認/拒否/完了にするAPI (`/api/applications/[id]` PATCH)
   - 企業ダッシュボードに承認/拒否/完了ボタン実装済み

4. ✅ **パスワードリセット機能**
   - UIのNeo-Glassデザイン適用済み
   - 機能は実装済み

---

## ⏳ 未実装機能（優先度順）

### 🔴 優先度：高

#### 1. **レコメンド機能のフロントエンド実装**
- **現状**: API (`/api/recommendations/route.ts`) は実装済み
- **未実装**: フロントエンドでの表示
- **必要な実装**:
  - 学生団体ダッシュボード (`app/dashboard/organization/page.tsx`) に「おすすめ案件」セクション追加
  - 学生個人ダッシュボード (`app/dashboard/student/page.tsx`) に「おすすめ案件」セクション追加
  - レコメンドAPIを呼び出して案件を表示
  - レコメンド理由の表示（例：「この企業は高評価です」）
- **ファイル**: 
  - `app/dashboard/organization/page.tsx`
  - `app/dashboard/student/page.tsx`

#### 2. **学生団体・学生個人の詳細ページに評価表示機能**
- **現状**: 企業詳細ページ (`app/companies/[id]/page.tsx`) には実装済み
- **未実装**: 学生団体・学生個人の詳細ページ
- **必要な実装**:
  - 学生団体詳細ページ (`app/organizations/[id]/page.tsx`) の作成または更新
  - 学生個人詳細ページ (`app/students/[id]/page.tsx`) の作成または更新
  - 評価平均値・評価数の表示
  - 評価一覧の表示
  - APIエンドポイントの作成 (`/api/organizations/[id]/route.ts`, `/api/students/[id]/route.ts`)
- **ファイル**: 
  - `app/organizations/[id]/page.tsx` (存在しない可能性)
  - `app/students/[id]/page.tsx` (存在しない可能性)
  - `app/api/organizations/[id]/route.ts` (存在しない可能性)
  - `app/api/students/[id]/route.ts` (存在しない可能性)

---

### 🟡 優先度：中

#### 3. **評価フォームの改善（評価カテゴリ別入力）**
- **現状**: 評価フォーム (`app/ratings/[applicationId]/page.tsx`) は実装済み
- **未実装**: 評価カテゴリ別入力（コミュニケーション、品質、時間厳守、プロフェッショナリズム）
- **必要な実装**:
  - 評価フォームに4つのカテゴリ評価を追加
  - 各カテゴリに1-5の星評価を追加
  - APIに送信するデータにカテゴリ評価を含める
- **ファイル**: 
  - `app/ratings/[applicationId]/page.tsx`
  - `app/api/ratings/route.ts` (既にカラムは存在するが、フロントエンドで未使用)

#### 4. **学生団体・学生個人のプロフィール編集機能**
- **現状**: 企業のプロフィール編集機能は実装済み (`app/dashboard/company/page.tsx`)
- **未実装**: 学生団体・学生個人のプロフィール編集機能
- **必要な実装**:
  - 学生団体ダッシュボードにプロフィール編集セクション追加
  - 学生個人ダッシュボードにプロフィール編集セクション追加
  - プロフィール更新APIの実装（既存の更新APIを確認）
- **ファイル**: 
  - `app/dashboard/organization/page.tsx`
  - `app/dashboard/student/page.tsx`
  - `app/api/organizations/[id]/route.ts` (存在しない可能性)
  - `app/api/students/[id]/route.ts` (存在しない可能性)

#### 5. **学生団体・学生個人の詳細ページのプレビュー機能**
- **現状**: 企業ダッシュボードにプレビュー機能は実装済み
- **未実装**: 学生団体・学生個人の詳細ページのプレビュー
- **必要な実装**:
  - 学生団体・学生個人の詳細ページの作成
  - ダッシュボードからプレビューリンクを追加
- **ファイル**: 
  - `app/organizations/[id]/page.tsx`
  - `app/students/[id]/page.tsx`
  - `app/dashboard/organization/page.tsx`
  - `app/dashboard/student/page.tsx`

---

### 🟢 優先度：低

#### 6. **通知機能（メール通知）**
- **現状**: 通知機能は未実装
- **未実装**: 
  - 応募が承認されたときの通知
  - 応募が拒否されたときの通知
  - 案件が完了したときの通知
  - 評価が投稿されたときの通知
- **必要な実装**:
  - Supabase Edge FunctionsまたはAPI Routesでメール送信機能を実装
  - 各イベント（承認、拒否、完了、評価）で通知を送信
- **ファイル**: 
  - 新規作成が必要（`app/api/notifications/route.ts` など）

#### 7. **検索・フィルタ機能の強化**
- **現状**: 基本的な案件一覧は実装済み
- **未実装**: 
  - 案件の検索機能（キーワード検索）
  - フィルタ機能（予算、期限、企業の評価など）
- **必要な実装**:
  - 検索バーの追加
  - フィルタUIの追加
  - 検索・フィルタAPIの実装
- **ファイル**: 
  - `app/projects/page.tsx`
  - `app/projects/students/page.tsx`
  - `app/projects/organizations/page.tsx`
  - `app/api/projects/route.ts` (検索・フィルタパラメータの追加)

#### 8. **案件の編集・削除機能**
- **現状**: 案件の投稿機能は実装済み
- **未実装**: 
  - 案件の編集機能
  - 案件の削除機能
- **必要な実装**:
  - 企業ダッシュボードに編集・削除ボタンを追加
  - 編集ページの作成
  - 編集・削除APIの実装
- **ファイル**: 
  - `app/dashboard/company/page.tsx`
  - `app/projects/[id]/edit/page.tsx` (新規作成)
  - `app/api/projects/[id]/route.ts` (PATCH, DELETEメソッドの追加)

#### 9. **応募の取り消し機能**
- **現状**: 応募機能は実装済み
- **未実装**: 
  - 学生団体・学生個人が応募を取り消す機能
- **必要な実装**:
  - ダッシュボードに「応募を取り消す」ボタンを追加
  - 応募削除APIの実装
- **ファイル**: 
  - `app/dashboard/organization/page.tsx`
  - `app/dashboard/student/page.tsx`
  - `app/api/applications/[id]/route.ts` (DELETEメソッドの追加)

#### 10. **統計・分析機能**
- **現状**: 基本的なダッシュボードは実装済み
- **未実装**: 
  - 企業側：応募数、承認率、完了率などの統計
  - 学生側：応募数、承認率、完了率などの統計
- **必要な実装**:
  - 統計データを取得するAPIの実装
  - ダッシュボードに統計セクションを追加
- **ファイル**: 
  - `app/api/statistics/route.ts` (新規作成)
  - 各ダッシュボードページに統計セクション追加

---

## 📝 実装チェックリスト

### 優先度：高
- [ ] レコメンド機能のフロントエンド実装
- [ ] 学生団体・学生個人の詳細ページに評価表示機能

### 優先度：中
- [ ] 評価フォームの改善（評価カテゴリ別入力）
- [ ] 学生団体・学生個人のプロフィール編集機能
- [ ] 学生団体・学生個人の詳細ページのプレビュー機能

### 優先度：低
- [ ] 通知機能（メール通知）
- [ ] 検索・フィルタ機能の強化
- [ ] 案件の編集・削除機能
- [ ] 応募の取り消し機能
- [ ] 統計・分析機能

---

## 🔍 確認が必要なファイル

以下のファイルが存在するか確認が必要です：

1. `app/organizations/[id]/page.tsx` - 学生団体詳細ページ
2. `app/students/[id]/page.tsx` - 学生個人詳細ページ
3. `app/api/organizations/[id]/route.ts` - 学生団体詳細API
4. `app/api/students/[id]/route.ts` - 学生個人詳細API

これらのファイルが存在しない場合は、新規作成が必要です。

