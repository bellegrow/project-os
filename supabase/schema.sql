-- ProjectOS v2 データベーススキーマ
-- Supabase SQL Editor で実行してください
-- ※ auth.users は Supabase が管理するため定義不要

-- ────────────────────────────────────────────
-- 顧客（customers）
-- ────────────────────────────────────────────
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  industry    text,
  website     text,
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- ────────────────────────────────────────────
-- 顧客担当者（contacts）
-- ────────────────────────────────────────────
create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  name        text not null,
  role        text,
  email       text,
  phone       text,
  created_at  timestamptz default now() not null
);

-- ────────────────────────────────────────────
-- 案件（projects）
-- ────────────────────────────────────────────
-- customer_id は移行期間中は nullable
-- client_name は移行完了後に削除予定
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  customer_id  uuid references customers(id) on delete set null,
  client_name  text not null,
  name         text not null,
  status       text not null default '商談中'
                 check (status in ('商談中','提案済','受注','進行中','完了','失注')),
  budget       integer,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- ────────────────────────────────────────────
-- ヒアリング記録（hearings）
-- ────────────────────────────────────────────
create table if not exists hearings (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade not null,
  date        date not null,
  memo        text not null default '',
  created_at  timestamptz default now() not null
);

-- ────────────────────────────────────────────
-- 見積書（estimates）
-- ────────────────────────────────────────────
create table if not exists estimates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  project_id  uuid references projects(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  title       text not null,
  status      text not null default 'draft'
                check (status in ('draft','sent','approved','rejected')),
  subtotal    integer not null default 0,
  tax         integer not null default 0,
  total       integer not null default 0,
  note        text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- ────────────────────────────────────────────
-- 見積明細（estimate_items）
-- ────────────────────────────────────────────
create table if not exists estimate_items (
  id          uuid primary key default gen_random_uuid(),
  estimate_id uuid references estimates(id) on delete cascade not null,
  name        text not null,
  description text,
  quantity    numeric(10,2) not null default 1,
  unit_price  integer not null default 0,
  amount      integer not null default 0,
  sort_order  integer not null default 0,
  created_at  timestamptz default now() not null
);

-- ────────────────────────────────────────────
-- updated_at 自動更新トリガー
-- ────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at();

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger estimates_updated_at
  before update on estimates
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────
-- Row Level Security（RLS）
-- ────────────────────────────────────────────
alter table customers        enable row level security;
alter table contacts         enable row level security;
alter table projects         enable row level security;
alter table hearings         enable row level security;
alter table estimates        enable row level security;
alter table estimate_items   enable row level security;

-- customers：自分のデータのみ
create policy "customers: own data only"
  on customers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- contacts：自分の顧客の担当者のみ
create policy "contacts: own customers only"
  on contacts for all
  using (
    exists (
      select 1 from customers
      where customers.id = contacts.customer_id
        and customers.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from customers
      where customers.id = contacts.customer_id
        and customers.user_id = auth.uid()
    )
  );

-- projects：自分のデータのみ
create policy "projects: own data only"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- hearings：自分の案件のヒアリングのみ
create policy "hearings: own projects only"
  on hearings for all
  using (
    exists (
      select 1 from projects
      where projects.id = hearings.project_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from projects
      where projects.id = hearings.project_id
        and projects.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────
-- インデックス（検索・JOIN 高速化）
-- ────────────────────────────────────────────
create index if not exists customers_user_id_idx    on customers(user_id);
create index if not exists projects_user_id_idx     on projects(user_id);
create index if not exists projects_customer_id_idx on projects(customer_id);
create index if not exists hearings_project_id_idx  on hearings(project_id);
create index if not exists hearings_date_idx        on hearings(date desc);
create index if not exists contacts_customer_id_idx       on contacts(customer_id);
create index if not exists estimates_project_id_idx       on estimates(project_id);
create index if not exists estimates_user_id_idx          on estimates(user_id);
create index if not exists estimate_items_estimate_id_idx on estimate_items(estimate_id);

-- ────────────────────────────────────────────
-- RLS ポリシー：estimates / estimate_items
-- ────────────────────────────────────────────
create policy "estimates: own data only"
  on estimates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "estimate_items: own estimates only"
  on estimate_items for all
  using (
    exists (
      select 1 from estimates
      where estimates.id = estimate_items.estimate_id
        and estimates.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from estimates
      where estimates.id = estimate_items.estimate_id
        and estimates.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────
-- 請求書（invoices）
-- ────────────────────────────────────────────
create table if not exists invoices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  project_id  uuid references projects(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  estimate_id uuid references estimates(id) on delete set null,
  title       text not null,
  status      text not null default 'draft'
                check (status in ('draft','sent','paid','overdue','canceled')),
  subtotal    integer not null default 0,
  tax         integer not null default 0,
  total       integer not null default 0,
  due_date    date,
  note        text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- ────────────────────────────────────────────
-- 請求明細（invoice_items）
-- ────────────────────────────────────────────
create table if not exists invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid references invoices(id) on delete cascade not null,
  name        text not null,
  description text,
  quantity    numeric(10,2) not null default 1,
  unit_price  integer not null default 0,
  amount      integer not null default 0,
  sort_order  integer not null default 0
);

-- updated_at トリガー
create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

-- RLS
alter table invoices      enable row level security;
alter table invoice_items enable row level security;

create policy "invoices: own data only"
  on invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "invoice_items: own invoices only"
  on invoice_items for all
  using (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from invoices
      where invoices.id = invoice_items.invoice_id
        and invoices.user_id = auth.uid()
    )
  );

-- インデックス
create index if not exists invoices_project_id_idx      on invoices(project_id);
create index if not exists invoices_user_id_idx         on invoices(user_id);
create index if not exists invoice_items_invoice_id_idx on invoice_items(invoice_id);

-- ────────────────────────────────────────────
-- 契約（contracts）v5.1 で追加
-- ────────────────────────────────────────────
create table if not exists contracts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  project_id    uuid references projects(id) on delete cascade not null,
  customer_id   uuid references customers(id) on delete set null,
  estimate_id   uuid references estimates(id) on delete set null,
  invoice_id    uuid references invoices(id) on delete set null,
  title         text not null,
  status        text not null default 'draft'
                  check (status in ('draft','sent','signed','completed','canceled')),
  contract_date date,
  start_date    date,
  end_date      date,
  amount        integer,
  note          text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

create trigger contracts_updated_at
  before update on contracts
  for each row execute function update_updated_at();

alter table contracts enable row level security;

create policy "contracts: own data only"
  on contracts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists contracts_project_id_idx on contracts(project_id);
create index if not exists contracts_user_id_idx    on contracts(user_id);

-- ────────────────────────────────────────────
-- ユーザー設定（user_settings）v6 で追加
-- ────────────────────────────────────────────
create table if not exists user_settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  issuer_name         text not null default '',
  issuer_department   text not null default '',
  issuer_email        text not null default '',
  bank_name           text not null default '',
  bank_branch         text not null default '',
  bank_account_type   text not null default '普通',
  bank_account_number text not null default '',
  bank_account_holder text not null default '',
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();

alter table user_settings enable row level security;

create policy "user_settings: own data only"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_settings_user_id_idx on user_settings(user_id);

-- ────────────────────────────────────────────
-- v7 入金管理：invoices テーブルへのカラム追加
-- （既存のSupabaseプロジェクトには下記を SQL Editor で実行）
-- ────────────────────────────────────────────
alter table invoices add column if not exists paid_at      date;
alter table invoices add column if not exists paid_amount  integer;
alter table invoices add column if not exists payment_note text;

-- ────────────────────────────────────────────
-- v9.1 明細置換 RPC（アトミック保存）
-- Supabase SQL Editor で実行してください
-- ────────────────────────────────────────────

-- 見積明細をトランザクション内で一括置換する
-- DELETE→INSERT を1関数内で実行するため、INSERT失敗時に明細が消えない
create or replace function replace_estimate_items(
  p_estimate_id uuid,
  p_items       jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from estimate_items where estimate_id = p_estimate_id;
  if jsonb_array_length(p_items) > 0 then
    insert into estimate_items (estimate_id, name, description, quantity, unit_price, amount, sort_order)
    select
      p_estimate_id,
      item ->> 'name',
      nullif(item ->> 'description', ''),
      (item ->> 'quantity')::numeric,
      (item ->> 'unit_price')::integer,
      (item ->> 'amount')::integer,
      (item ->> 'sort_order')::integer
    from jsonb_array_elements(p_items) as item;
  end if;
end;
$$;

grant execute on function replace_estimate_items(uuid, jsonb) to authenticated;

-- 請求明細をトランザクション内で一括置換する
create or replace function replace_invoice_items(
  p_invoice_id uuid,
  p_items      jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from invoice_items where invoice_id = p_invoice_id;
  if jsonb_array_length(p_items) > 0 then
    insert into invoice_items (invoice_id, name, description, quantity, unit_price, amount, sort_order)
    select
      p_invoice_id,
      item ->> 'name',
      nullif(item ->> 'description', ''),
      (item ->> 'quantity')::numeric,
      (item ->> 'unit_price')::integer,
      (item ->> 'amount')::integer,
      (item ->> 'sort_order')::integer
    from jsonb_array_elements(p_items) as item;
  end if;
end;
$$;

grant execute on function replace_invoice_items(uuid, jsonb) to authenticated;

-- ─── Project Costs（v12 で追加） ─────────────────────────────

create table if not exists project_costs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null default auth.uid(),
  project_id  uuid references projects(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  title       text not null,
  category    text not null default 'other',
  amount      integer not null default 0,
  note        text,
  cost_date   date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table project_costs enable row level security;

create policy "project_costs: user owns" on project_costs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists project_costs_project_id_idx  on project_costs(project_id);
create index if not exists project_costs_customer_id_idx on project_costs(customer_id);
create index if not exists project_costs_cost_date_idx   on project_costs(cost_date);

grant all on project_costs to authenticated;

-- ─── Tasks（v11 で追加） ─────────────────────────────────────

create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid(),
  project_id   uuid references projects(id) on delete cascade not null,
  customer_id  uuid references customers(id) on delete set null,
  title        text not null,
  description  text,
  status       text not null default 'todo',
  priority     text not null default 'medium',
  due_date     date,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "tasks: user owns" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists tasks_project_id_idx  on tasks(project_id);
create index if not exists tasks_customer_id_idx on tasks(customer_id);
create index if not exists tasks_due_date_idx    on tasks(due_date);
create index if not exists tasks_status_idx      on tasks(status);

grant all on tasks to authenticated;

-- ─── Activities（v10 で追加） ─────────────────────────────────

create table if not exists activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null default auth.uid(),
  project_id  uuid references projects(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  type        text not null,
  title       text not null,
  body        text,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table activities enable row level security;

create policy "activities: user owns" on activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists activities_project_id_idx on activities(project_id);
create index if not exists activities_customer_id_idx on activities(customer_id);
create index if not exists activities_occurred_at_idx on activities(occurred_at desc);

grant all on activities to authenticated;

-- ─── Project Files（v14 で追加） ─────────────────────────────

create table if not exists project_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null default auth.uid(),
  project_id   uuid references projects(id) on delete cascade not null,
  customer_id  uuid references customers(id) on delete set null,
  name         text not null,
  category     text not null default 'other',
  file_type    text,
  file_size    integer,
  storage_path text,
  public_url   text,
  external_url text,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger project_files_updated_at
  before update on project_files
  for each row execute function update_updated_at();

alter table project_files enable row level security;

create policy "project_files: user owns" on project_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists project_files_project_id_idx  on project_files(project_id);
create index if not exists project_files_customer_id_idx on project_files(customer_id);
create index if not exists project_files_created_at_idx  on project_files(created_at desc);

grant all on project_files to authenticated;

-- ────────────────────────────────────────────
-- v16 user_settings カラム追加（設定画面強化）
-- 既存のSupabaseプロジェクトには下記を SQL Editor で実行してください
-- ────────────────────────────────────────────
alter table user_settings add column if not exists issuer_phone          text not null default '';
alter table user_settings add column if not exists issuer_postal_code     text not null default '';
alter table user_settings add column if not exists issuer_address         text not null default '';
alter table user_settings add column if not exists issuer_invoice_number  text not null default '';
alter table user_settings add column if not exists tax_rate               integer not null default 10;
alter table user_settings add column if not exists estimate_valid_days    integer not null default 30;
alter table user_settings add column if not exists invoice_due_days       integer not null default 30;
alter table user_settings add column if not exists document_note          text not null default '';
alter table user_settings add column if not exists neglected_check_days   integer not null default 7;
alter table user_settings add column if not exists neglected_action_days  integer not null default 14;
alter table user_settings add column if not exists profit_rate_threshold  integer not null default 20;
alter table user_settings add column if not exists cost_only_as_check     boolean not null default true;

-- ────────────────────────────────────────────
-- 既存テーブルへの後付け適用用 SQL（Supabase SQL Editor で実行）
--   estimates / estimate_items は v3.1 で新規追加
--   invoices / invoice_items は v4.1 で新規追加
--   contracts は v5.1 で新規追加
--   user_settings は v6 で新規追加
--   invoices.paid_at / paid_amount / payment_note は v7 で追加
--   replace_estimate_items / replace_invoice_items RPC は v9.1 で追加
--   activities は v10 で追加
--   user_settings 拡張カラム群は v16 で追加
--   organizations / organization_members は v1.4.0 で追加（以下）
-- ────────────────────────────────────────────

-- ════════════════════════════════════════════
-- v1.4.0: マルチテナント基盤
--   organizations        — テナント（事業者）単位の組織
--   organization_members — ユーザーと組織の N:M 対応
--
-- NOTE: RLS は v1.4.2 で追加予定。現時点では無効。
-- NOTE: 既存テーブルへの organization_id 付与は v1.4.1 で対応予定。
-- ════════════════════════════════════════════

create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists organization_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null check (role in ('owner', 'admin', 'member')) default 'member',
  created_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- user_id ベースの検索を高速化
create index if not exists organization_members_user_id_idx
  on organization_members (user_id);

-- TODO: v1.4.2 — RLS ポリシーを追加する
--   例:
--   alter table organizations enable row level security;
--   alter table organization_members enable row level security;
--   create policy "members can read own org" on organizations
--     for select using (
--       id in (
--         select organization_id from organization_members
--         where user_id = auth.uid()
--       )
--     );
--   create policy "members can read own memberships" on organization_members
--     for select using (user_id = auth.uid());

-- ════════════════════════════════════════════
-- v1.4.1: 全業務データへ organization_id を付与
--
-- NOTE: organization_id は nullable（既存行は NULL のまま / 新規作成時に自動セット）
-- NOTE: NOT NULL 制約・RLS は v1.4.3 で追加予定
-- NOTE: Supabase SQL Editor でこのブロックをそのまま実行できる
-- ════════════════════════════════════════════

alter table customers     add column if not exists organization_id uuid references organizations(id);
alter table projects      add column if not exists organization_id uuid references organizations(id);
alter table tasks         add column if not exists organization_id uuid references organizations(id);
alter table activities    add column if not exists organization_id uuid references organizations(id);
alter table estimates     add column if not exists organization_id uuid references organizations(id);
alter table invoices      add column if not exists organization_id uuid references organizations(id);
alter table contracts     add column if not exists organization_id uuid references organizations(id);
alter table project_costs add column if not exists organization_id uuid references organizations(id);
alter table project_files add column if not exists organization_id uuid references organizations(id);

-- 検索用インデックス（v1.4.2 でフィルタ追加後に効く）
create index if not exists customers_organization_id_idx     on customers     (organization_id);
create index if not exists projects_organization_id_idx      on projects      (organization_id);
create index if not exists tasks_organization_id_idx         on tasks         (organization_id);
create index if not exists activities_organization_id_idx    on activities    (organization_id);
create index if not exists estimates_organization_id_idx     on estimates     (organization_id);
create index if not exists invoices_organization_id_idx      on invoices      (organization_id);
create index if not exists contracts_organization_id_idx     on contracts     (organization_id);
create index if not exists project_costs_organization_id_idx on project_costs (organization_id);
create index if not exists project_files_organization_id_idx on project_files (organization_id);

-- v1.4.2 完了 — 各 getAll* に .or フィルタ追加済み
-- v1.4.3 完了 — RLS ポリシー追加済み（以下）
-- TODO: v1.4.4 — RLS 動作確認後に organization_id NOT NULL 制約を付与する

-- ════════════════════════════════════════════
-- v1.4.3: RLS — organization_id ベースのテナント分離
--
-- 前提:
--   v1.4.0: organizations / organization_members テーブル追加済み
--   v1.4.1: 全業務テーブルに organization_id カラム追加済み
--   v1.4.2: アプリ側 getAll* に .or フィルタ追加済み
--
-- 実行方法: Supabase SQL Editor でこのブロックをそのまま実行
--
-- 注意: 既存行で organization_id IS NULL のものは RLS 適用後
--       アクセス不可になります。
--       移行が必要な場合は下記 TODO を参照してください。
--
-- service_role は RLS をバイパスするため、
-- /admin 招待 API（service_role 専用）はそのまま動作します。
-- ════════════════════════════════════════════

-- ────────────────────────────────────────────
-- ヘルパー関数: get_my_organization_ids()
--
-- organization_members に RLS が掛かると、ポリシー内から
-- 同テーブルを参照すると無限再帰になる。
-- SECURITY DEFINER で RLS をバイパスして直接参照することで回避。
-- ────────────────────────────────────────────
create or replace function get_my_organization_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id
  from organization_members
  where user_id = auth.uid()
$$;

-- anon からは実行不可。authenticated のみ。
revoke execute on function get_my_organization_ids() from public;
grant  execute on function get_my_organization_ids() to authenticated;

-- ────────────────────────────────────────────
-- organizations / organization_members の RLS 有効化
-- ────────────────────────────────────────────
alter table organizations        enable row level security;
alter table organization_members enable row level security;

-- organizations: 自分が所属する org のみ閲覧可能
-- INSERT / UPDATE / DELETE は service_role のみ（招待 API 経由）
create policy "organizations: members can select"
  on organizations for select
  using (id in (select get_my_organization_ids()));

-- organization_members: 同じ org のメンバー一覧を閲覧可能
-- SECURITY DEFINER ヘルパー経由で再帰回避
create policy "organization_members: view own org"
  on organization_members for select
  using (organization_id in (select get_my_organization_ids()));

-- ────────────────────────────────────────────
-- 既存の user_id ベース RLS ポリシーを削除
-- （organization_id ベースのポリシーに置き換えるため）
-- ────────────────────────────────────────────
drop policy if exists "customers: own data only"            on customers;
drop policy if exists "contacts: own customers only"        on contacts;
drop policy if exists "projects: own data only"             on projects;
drop policy if exists "hearings: own projects only"         on hearings;
drop policy if exists "estimates: own data only"            on estimates;
drop policy if exists "estimate_items: own estimates only"  on estimate_items;
drop policy if exists "invoices: own data only"             on invoices;
drop policy if exists "invoice_items: own invoices only"    on invoice_items;
drop policy if exists "contracts: own data only"            on contracts;
drop policy if exists "project_costs: user owns"            on project_costs;
drop policy if exists "tasks: user owns"                    on tasks;
drop policy if exists "activities: user owns"               on activities;
drop policy if exists "project_files: user owns"            on project_files;

-- ────────────────────────────────────────────
-- 業務データ 9 テーブル: organization_id ベース RLS
--
-- 同一 organization に所属するメンバー全員が
-- SELECT / INSERT / UPDATE / DELETE 可能。
--
-- TODO: v1.4.4 移行作業（RLS 確認後に実行）
--   UPDATE customers     SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE projects      SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE tasks         SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE activities    SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE estimates     SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE invoices      SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE contracts     SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE project_costs SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   UPDATE project_files SET organization_id = '<org_uuid>' WHERE organization_id IS NULL;
--   (移行完了後)
--   ALTER TABLE customers     ALTER COLUMN organization_id SET NOT NULL;
--   ALTER TABLE projects      ALTER COLUMN organization_id SET NOT NULL;
--   ...（全9テーブル）
-- ────────────────────────────────────────────

create policy "customers: org members only"
  on customers for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "projects: org members only"
  on projects for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "tasks: org members only"
  on tasks for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "activities: org members only"
  on activities for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "estimates: org members only"
  on estimates for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "invoices: org members only"
  on invoices for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "contracts: org members only"
  on contracts for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "project_costs: org members only"
  on project_costs for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

create policy "project_files: org members only"
  on project_files for all
  using     (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

-- ────────────────────────────────────────────
-- 子テーブル: organization_id を持たないため親テーブルの RLS に委ねる
-- 親テーブルが org フィルタ済みなので、子も自動的に org 分離される。
-- replace_estimate_items / replace_invoice_items RPC も
-- SECURITY INVOKER のため同じ RLS が適用される。
-- ────────────────────────────────────────────

-- contacts: customers の RLS に委ねる
create policy "contacts: via customers org"
  on contacts for all
  using (
    exists (select 1 from customers where customers.id = contacts.customer_id)
  )
  with check (
    exists (select 1 from customers where customers.id = contacts.customer_id)
  );

-- hearings: projects の RLS に委ねる
create policy "hearings: via projects org"
  on hearings for all
  using (
    exists (select 1 from projects where projects.id = hearings.project_id)
  )
  with check (
    exists (select 1 from projects where projects.id = hearings.project_id)
  );

-- estimate_items: estimates の RLS に委ねる
create policy "estimate_items: via estimates org"
  on estimate_items for all
  using (
    exists (select 1 from estimates where estimates.id = estimate_items.estimate_id)
  )
  with check (
    exists (select 1 from estimates where estimates.id = estimate_items.estimate_id)
  );

-- invoice_items: invoices の RLS に委ねる
create policy "invoice_items: via invoices org"
  on invoice_items for all
  using (
    exists (select 1 from invoices where invoices.id = invoice_items.invoice_id)
  )
  with check (
    exists (select 1 from invoices where invoices.id = invoice_items.invoice_id)
  );
