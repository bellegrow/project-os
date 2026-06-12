-- ════════════════════════════════════════════
-- ProjectOS v2.3.0: Soft Delete (ゴミ箱) 機能
-- 実行場所: Supabase SQL Editor
-- ════════════════════════════════════════════

-- ────────────────────────────────────────────
-- STEP 1: deleted_at カラム追加（9テーブル）
-- ────────────────────────────────────────────
alter table customers     add column if not exists deleted_at timestamptz;
alter table projects      add column if not exists deleted_at timestamptz;
alter table tasks         add column if not exists deleted_at timestamptz;
alter table activities    add column if not exists deleted_at timestamptz;
alter table estimates     add column if not exists deleted_at timestamptz;
alter table invoices      add column if not exists deleted_at timestamptz;
alter table contracts     add column if not exists deleted_at timestamptz;
alter table project_costs add column if not exists deleted_at timestamptz;
alter table project_files add column if not exists deleted_at timestamptz;

-- ────────────────────────────────────────────
-- STEP 2: インデックス（ゴミ箱検索の高速化）
-- ────────────────────────────────────────────
create index if not exists customers_deleted_at_idx     on customers     (organization_id, deleted_at) where deleted_at is not null;
create index if not exists projects_deleted_at_idx      on projects      (organization_id, deleted_at) where deleted_at is not null;
create index if not exists tasks_deleted_at_idx         on tasks         (organization_id, deleted_at) where deleted_at is not null;
create index if not exists activities_deleted_at_idx    on activities    (organization_id, deleted_at) where deleted_at is not null;
create index if not exists estimates_deleted_at_idx     on estimates     (organization_id, deleted_at) where deleted_at is not null;
create index if not exists invoices_deleted_at_idx      on invoices      (organization_id, deleted_at) where deleted_at is not null;
create index if not exists contracts_deleted_at_idx     on contracts     (organization_id, deleted_at) where deleted_at is not null;
create index if not exists project_costs_deleted_at_idx on project_costs (organization_id, deleted_at) where deleted_at is not null;
create index if not exists project_files_deleted_at_idx on project_files (organization_id, deleted_at) where deleted_at is not null;

-- ────────────────────────────────────────────
-- STEP 3: 確認クエリ（全テーブルに deleted_at が追加されていること）
-- ────────────────────────────────────────────
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where
  table_schema = 'public'
  and column_name = 'deleted_at'
  and table_name in (
    'customers','projects','tasks','activities','estimates',
    'invoices','contracts','project_costs','project_files'
  )
order by table_name;

-- ────────────────────────────────────────────
-- メモ:
-- - RLS ポリシーの変更は不要。
--   deleted_at フィルタはアプリ層（lib/supabase/*.ts）で管理する。
--   organization_id による組織間分離は RLS で保証済み。
-- - 既存データの deleted_at は NULL のまま（アクティブ扱い）。
-- - ゴミ箱クエリ: deleted_at IS NOT NULL
-- - 通常クエリ:   deleted_at IS NULL
-- ────────────────────────────────────────────
