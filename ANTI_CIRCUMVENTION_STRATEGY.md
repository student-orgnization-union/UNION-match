# UNION Match 中抜き防止戦略

## 問題点

外部ツール（メール等）で直接連絡すると、UNION Matchを経由せずに取引が成立し、プラットフォームが中抜きされるリスクがある。

## 解決策

### 1. メール送信時のトラッキング情報の埋め込み

**実装方法**:
- メール本文にUNION Matchの案件URLを含める
- メール送信時にログを記録（誰が・いつ・どの案件で連絡したか）
- メール件名に「【UNION Match】」プレフィックスを付与

**効果**:
- メール送信履歴を追跡可能
- 案件URLを共有することで、UNION Match経由であることを明示

### 2. 連絡先情報の段階的公開

**実装方法**:
- **マッチング成立時**: 連絡先情報を完全に公開（現状維持）
- **改善案**: メールアドレスを直接表示せず、「メールで連絡」ボタンのみ表示
- **メール送信時**: 自動的にUNION Matchの案件URLとトラッキング情報を含める

**効果**:
- 連絡先情報の直接コピーを防ぐ
- メール送信ボタン経由での連絡を促す

### 3. 利用規約・契約条項

**実装方法**:
- 利用規約に「UNION Match経由での取引を必須とする」条項を追加
- 中抜き行為を禁止する条項を明記
- 違反時のペナルティ（アカウント停止等）を明記

**効果**:
- 法的な抑止力
- 違反時の対応根拠

### 4. プロジェクト完了までの連絡履歴管理

**実装方法**:
- メール送信履歴をデータベースに記録
- プロジェクト完了まで連絡履歴を監視
- 異常な連絡パターン（大量のメール送信等）を検知

**効果**:
- 中抜きの兆候を早期に検知
- データに基づいた対応が可能

### 5. 案件URLの必須共有

**実装方法**:
- メール本文に必ず案件URLを含める
- 案件URLにはトラッキングパラメータを付与（例: `?ref=email&application_id=xxx`）
- 案件URLのクリックを追跡

**効果**:
- UNION Match経由での取引を可視化
- メール経由での連絡を追跡可能

## 実装の優先順位

### Phase 1: 即座に実装可能（高効果・低コスト）

1. **メール送信履歴の記録**
   - `contact_logs` テーブルを作成
   - メール送信時にログを記録

2. **メール本文の改善**
   - 案件URLを必須で含める
   - トラッキングパラメータを付与
   - より詳細なテンプレート

3. **連絡先情報の表示方法の改善**
   - メールアドレスを直接表示せず、ボタンのみ
   - 「メールで連絡」ボタンで自動的にメール送信

### Phase 2: 中期実装（中効果・中コスト）

1. **異常検知機能**
   - 大量のメール送信を検知
   - 中抜きの兆候をアラート

2. **利用規約の更新**
   - 中抜き防止条項を追加
   - ユーザーに同意を求める

### Phase 3: 長期実装（高効果・高コスト）

1. **プラットフォーム内メッセージ機能**
   - 完全にプラットフォーム内で完結
   - 中抜きリスクを最小化

## 推奨アプローチ

**現時点での最適解**:
1. **メール送信履歴の記録**を実装
2. **メール本文の改善**（案件URL必須、トラッキング情報含む）
3. **連絡先情報の表示方法の改善**（ボタンのみ、直接表示しない）

これにより：
- 開発コストを抑えられる
- 中抜きリスクを一定程度軽減できる
- ユーザー体験を向上できる
- 将来的にプラットフォーム内メッセージ機能に移行しやすい

## 技術的実装

### データベーススキーマ

```sql
-- 連絡履歴テーブル
CREATE TABLE contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'company' | 'organization' | 'student'
  sender_id UUID NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_id UUID,
  contact_method TEXT NOT NULL, -- 'email' | 'phone' | 'other'
  contact_info TEXT, -- 連絡先情報（暗号化推奨）
  message_preview TEXT, -- メッセージのプレビュー
  project_url TEXT, -- 案件URL（トラッキング付き）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_logs_application_id ON contact_logs(application_id);
CREATE INDEX idx_contact_logs_created_at ON contact_logs(created_at);
```

### メール送信API

```typescript
// POST /api/contact/send-email
{
  application_id: string
  recipient_email: string
  subject: string
  body: string
  // 自動的に案件URLとトラッキング情報を追加
}
```

## 結論

**チャット機能を外部化する場合**:
- メール送信履歴を記録
- メール本文に案件URLを必須で含める
- 連絡先情報を直接表示せず、ボタンのみ
- 利用規約に中抜き防止条項を追加

これにより、中抜きリスクを軽減しつつ、ユーザー体験を向上させることができます。

