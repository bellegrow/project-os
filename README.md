# ProjectOS

> **情報を探す時間は、仕事じゃない。**

ProjectOS は、個人事業主・フリーランス・小規模チーム向けの業務管理OSです。顧客・案件・見積・請求・タスク・利益をひとつの場所に集約し、「どこに何があるか探す時間」をゼロにすることを目指しています。

---

## ProjectOS とは

- **ログイン不要でも即使える** — ブラウザのlocalStorageにデータを保存。セットアップゼロで今日から使えます。
- **クラウドにアップグレード可能** — Supabase を設定すると、デバイス間同期・顧客管理・チーム利用に対応します。
- **⌘K でどこからでも検索** — 全データを横断検索。案件名・顧客名・金額・見積番号・タスクメモで即ジャンプ。

---

## ターゲット

- 個人事業主・フリーランス
- 1〜10名規模の小規模事業者
- 顧客・案件・請求・タスク・利益をバラバラに管理している人

---

## 主な機能

| 機能 | 説明 |
|------|------|
| **グローバル検索 / ⌘K** | 全データを横断検索。金額・番号・URLでも検索可能 |
| **顧客管理** | 顧客情報・担当者を一元管理（クラウドモード） |
| **案件管理** | ステータス・予算・顧客を紐付けて案件を管理 |
| **打ち合わせメモ** | 日付つきでヒアリング内容を時系列に蓄積 |
| **活動履歴** | 案件・顧客ごとのメモ・打ち合わせ記録 |
| **タスク管理** | 優先度・期限つきタスク。期限超過アラート付き |
| **見積書** | 明細・税率設定・PDF出力・見積番号管理 |
| **契約管理** | 契約日・金額・ステータスの記録と番号管理 |
| **請求書** | 明細・支払期限・税率設定・PDF出力・請求番号管理 |
| **入金管理** | 入金日・入金額・差額（過不足）の記録 |
| **利益管理（原価）** | 外注費・材料費・広告費などの原価を案件ごとに記録 |
| **ファイル管理** | 外部URL・ファイルのアップロードと案件への紐付け |
| **ダッシュボード** | 今月の請求額・入金額・粗利・放置案件・期限超過タスクを一覧 |
| **案件状況チェック** | 放置日数・利益率・超過タスクに基づくアラート判定 |
| **PDF出力** | 見積書・請求書をA4 PDFとして印刷・保存 |
| **設定画面** | 事業者情報・振込先・税率・放置判定日数などをカスタマイズ |
| **データ移行** | localStorageのデータをSupabaseクラウドへワンクリックで移行 |

---

## 使用技術

| カテゴリ | 技術 |
|----------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Storage | localStorage（ローカルモード）/ Supabase PostgreSQL（クラウドモード） |
| Auth | Supabase Auth（マジックリンク） |
| Icons | lucide-react |

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd ProjectOS
npm install
```

### 2. 開発サーバーを起動（localStorageモード）

Supabase を設定しなくても、ブラウザのlocalStorageにデータを保存してすぐ使えます。

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

---

## Supabase 設定（クラウドモード）

> **localStorageモードで使う場合、この手順は不要です。**
> クラウド保存・デバイス間同期・顧客管理が必要な場合のみ設定してください。

### 3-1. Supabase プロジェクトを作成

1. [supabase.com](https://supabase.com) でアカウントを作成
2. 「New project」でプロジェクトを作成
3. プロジェクト設定 → API から以下をコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public キー** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3-2. 環境変数を設定

`.env.local` を作成して以下を記入：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3-3. データベーススキーマを作成

Supabase ダッシュボード → **SQL Editor** を開き、`supabase/schema.sql` の内容を貼り付けて実行してください。

以下のテーブルが作成されます：

| テーブル | 内容 |
|---------|------|
| `customers` | 顧客情報 |
| `contacts` | 顧客担当者 |
| `projects` | 案件 |
| `hearings` | 打ち合わせメモ |
| `estimates` / `estimate_items` | 見積書・明細 |
| `invoices` / `invoice_items` | 請求書・明細 |
| `contracts` | 契約 |
| `activities` | 活動履歴 |
| `tasks` | タスク |
| `project_costs` | 原価 |
| `project_files` | ファイル |
| `settings` | 事業者設定 |

### 3-4. Storage バケットを作成（ファイルアップロード機能を使う場合）

1. Supabase ダッシュボード → **Storage** を開く
2. 「New bucket」をクリック
3. バケット名を `project-files` と入力
4. **Private bucket** を選択して作成
5. 作成後、**Policies** タブを開いて以下のポリシーを追加：

```sql
-- アップロード
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 閲覧・ダウンロード
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 削除
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

> ⚠️ このポリシーがないとファイルのアップロードが失敗します。

### 3-5. 認証設定

Supabase ダッシュボード → **Authentication → URL Configuration** に以下を追加：

- **Redirect URLs**: `http://localhost:3000/auth/callback`

本番環境では `https://your-domain.com/auth/callback` も追加してください。

---

## ローカルデータをクラウドへ移行

localStorageモードで使い始めた後でSupabaseを設定した場合、ワンクリックでデータを移行できます。

1. Supabase を設定してログイン
2. `/projects` または `/dashboard` を開く
3. 画面上部に移行バナーが表示されたら「クラウドへ移行する」をクリック
4. 案件・ヒアリング・見積書・請求書・契約・タスク・活動履歴・原価・ファイルが自動で移行されます
5. 移行完了後、ローカルデータを削除するか選択できます

---

## 開発コマンド

```bash
npm run dev     # 開発サーバー起動（http://localhost:3000）
npm run build   # プロダクションビルド
npm run start   # プロダクションサーバー起動
npm run lint    # ESLint チェック
```

---

## デモデータ

セットアップ後に以下のURLへアクセスすると、サンプルデータが挿入されます（localStorageモードのみ）：

```
http://localhost:3000/seed
```

> ⚠️ 既存のlocalStorageデータは上書きされます。

---

## ローカルモード と クラウドモードの違い

| 項目 | ローカルモード | クラウドモード |
|------|--------------|--------------|
| データ保存先 | ブラウザのlocalStorage | Supabase PostgreSQL |
| セットアップ | 不要（即使える） | Supabase設定が必要 |
| ログイン | 不要 | マジックリンクメール認証 |
| デバイス間同期 | ✗ | ✓ |
| 顧客・担当者管理 | ✗ | ✓ |
| ファイルアップロード | ✗ | ✓ |
| チーム利用 | ✗（個人ブラウザのみ） | ✓（同一アカウントで共有） |

---

## 今後のロードマップ

| フェーズ | 内容 |
|---------|------|
| **検索強化** | マッチ箇所ハイライト・絞り込みフィルター |
| **スマホ最適化** | モバイルUIの改善・タッチ操作の最適化 |
| **CSV出力** | 案件・請求・原価一覧のエクスポート |
| **通知** | 放置案件・支払期限のメール・プッシュ通知 |
| **チーム機能** | 複数ユーザーでの案件共有・コメント |
| **請求テンプレート** | よく使う明細のテンプレート保存 |

---

## ライセンス

Private — All rights reserved.
