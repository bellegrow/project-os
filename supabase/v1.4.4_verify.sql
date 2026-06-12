-- ════════════════════════════════════════════
-- ProjectOS v1.4.4 organization_id 移行完了確認クエリ
-- 実行場所: Supabase SQL Editor (service_role 権限で実行)
-- ════════════════════════════════════════════

-- ────────────────────────────────────────────
-- ① NOT NULL 制約の確認
--    is_nullable = 'NO' であれば NOT NULL 付与済み
-- ────────────────────────────────────────────
select
  table_name,
  column_name,
  is_nullable,
  case when is_nullable = 'NO' then '✅ NOT NULL' else '❌ NULLABLE（要STEP3実行）' end as status
from information_schema.columns
where
  table_schema = 'public'
  and column_name = 'organization_id'
  and table_name in (
    'customers','projects','tasks','activities','estimates',
    'invoices','contracts','project_costs','project_files'
  )
order by table_name;

-- ────────────────────────────────────────────
-- ② organization_id IS NULL の行数確認
--    全テーブルで 0 件であること
-- ────────────────────────────────────────────
select 'customers'     as table_name, count(*) as null_count, case when count(*) = 0 then '✅ OK' else '❌ NULL行あり（要STEP2実行）' end as status from customers     where organization_id is null
union all
select 'projects',                    count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from projects      where organization_id is null
union all
select 'tasks',                       count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from tasks         where organization_id is null
union all
select 'activities',                  count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from activities    where organization_id is null
union all
select 'estimates',                   count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from estimates     where organization_id is null
union all
select 'invoices',                    count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from invoices      where organization_id is null
union all
select 'contracts',                   count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from contracts     where organization_id is null
union all
select 'project_costs',               count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from project_costs where organization_id is null
union all
select 'project_files',               count(*), case when count(*) = 0 then '✅ OK' else '❌ NULL行あり' end from project_files where organization_id is null
order by table_name;

-- ────────────────────────────────────────────
-- ③ RLS 動作確認（organization_id 前提のポリシーが有効か）
--    各テーブルに RLS ポリシーが存在し、有効であること
-- ────────────────────────────────────────────
select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
from pg_policies
where
  schemaname = 'public'
  and tablename in (
    'customers','projects','tasks','activities','estimates',
    'invoices','contracts','project_costs','project_files'
  )
  and (qual like '%organization_id%' or with_check like '%organization_id%')
order by tablename, policyname;

-- ────────────────────────────────────────────
-- ③-b RLS が有効（rowsecurity = true）かどうかも確認
-- ────────────────────────────────────────────
select
  relname as table_name,
  relrowsecurity as rls_enabled,
  case when relrowsecurity then '✅ RLS ON' else '❌ RLS OFF' end as status
from pg_class
where
  relnamespace = 'public'::regnamespace
  and relname in (
    'customers','projects','tasks','activities','estimates',
    'invoices','contracts','project_costs','project_files'
  )
order by relname;

-- ────────────────────────────────────────────
-- ④ インデックス確認（v1.4.1 で作成済みのはず）
-- ────────────────────────────────────────────
select
  t.relname  as table_name,
  i.relname  as index_name,
  case when i.relname is not null then '✅ INDEX あり' else '❌ INDEX なし' end as status
from
  pg_class t
  left join pg_index ix    on t.oid = ix.indrelid
  left join pg_class i     on i.oid = ix.indexrelid
  left join pg_attribute a on a.attrelid = t.oid and a.attnum = any(ix.indkey)
where
  t.relkind = 'r'
  and t.relnamespace = 'public'::regnamespace
  and t.relname in (
    'customers','projects','tasks','activities','estimates',
    'invoices','contracts','project_costs','project_files'
  )
  and a.attname = 'organization_id'
order by t.relname;
