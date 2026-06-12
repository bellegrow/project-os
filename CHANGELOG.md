# CHANGELOG

## v2.3.0 (2026-06-12)

### 新機能: Soft Delete（ゴミ箱）

削除したデータをゴミ箱に移動し、あとから復元または完全削除できる機能を追加しました。

#### 対象テーブル（9種類）
- 顧客 / 案件 / タスク / 活動履歴 / 見積 / 請求 / 契約 / 原価 / ファイル

#### 主な変更内容

**DB（Supabase）**
- 全9テーブルに `deleted_at timestamptz` カラムを追加
- ゴミ箱検索高速化のための部分インデックスを追加（`WHERE deleted_at IS NOT NULL`）

**アプリ動作**
- 削除操作: データを物理削除せず `deleted_at = now()` を設定（Soft Delete）
- 通常一覧: `deleted_at IS NULL` のデータのみ表示
- ゴミ箱 `/trash`: 削除済みデータを一覧表示、復元・完全削除が可能
- 復元: `deleted_at = null` に戻し、元の画面に再表示
- 完全削除: DBから物理削除（確認モーダルあり）
- `project_files` のSoft Delete時はStorageファイルを保持。完全削除時のみStorageも削除

**ナビゲーション**
- サイドバーの設定リンク下に「ゴミ箱」リンクを追加

**localStorageモード**
- 顧客以外の8種類でSoft Delete / 復元 / 完全削除に対応

#### 変更ファイル
- `supabase/v2.3.0_soft_delete.sql` — DBマイグレーション
- `lib/types.ts` — `TrashItem` 型・各エンティティへ `deletedAt` 追加
- `lib/supabase/activities.ts` / `contracts.ts` / `customers.ts` / `estimates.ts` / `invoices.ts` / `projectCosts.ts` / `projectFiles.ts` / `projects.ts` / `tasks.ts` — Soft Delete対応
- `lib/supabase/trash.ts` — ゴミ箱一覧取得（新規）
- `lib/storage.ts` — localStorageモードのSoft Delete対応
- `lib/dataSource.ts` — ゴミ箱操作のルーティング追加
- `app/trash/page.tsx` — ゴミ箱ページ（新規）
- `components/AppShell.tsx` — ゴミ箱サイドバーリンク追加

---

## v2.2.0

プラン管理・無料トライアル基盤、解約後データ持ち出し猶予期間を実装。

---

## v2.1.0

CSVインポート機能を追加。顧客・案件データをCSVから一括取り込み可能（クラウドモードのみ）。

---

## v1.4.4

全9テーブルの `organization_id` NOT NULL化 + RLS強化。マルチテナント分離の完全移行。

---

## v1.x

初期リリース。localStorage / Supabaseデュアルモード、顧客・案件・見積・請求・タスク・原価・ファイル管理の基盤実装。
