import type {
  Customer, Project, Task, Contact, Hearing,
  Estimate, Invoice, Contract, ProjectCost, ProjectFile, SearchResult,
} from './types'

// ─── date helpers ───────────────────────────────────────────────────────────
function ago(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}
function fromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function agoDate(days: number): string {
  return ago(days).slice(0, 10)
}

// ─── organizationId helper ──────────────────────────────────────────────────
// デモデータは localStorage モード相当なので organizationId: 'local' を付与する
function withOrg<T extends object>(items: Omit<T, 'organizationId'>[]): T[] {
  return items.map(item => ({ ...item, organizationId: 'local' })) as unknown as T[]
}

// ─── groupBy helper ─────────────────────────────────────────────────────────
function groupBy<T>(arr: T[], getKey: (item: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const item of arr) {
    const k = getKey(item)
    const existing = m.get(k) ?? []
    existing.push(item)
    m.set(k, existing)
  }
  return m
}

// ─── Customers ──────────────────────────────────────────────────────────────
export const demoCustomers: Customer[] = withOrg<Customer>([
  { id: 'demo-cust-1', name: '株式会社サンプル',    industry: 'IT・Web',                   website: 'sample-corp.example',  createdAt: ago(90),  updatedAt: ago(2)  },
  { id: 'demo-cust-2', name: 'BELLE美容室',         industry: '美容・サロン',               website: 'belle-salon.example',  createdAt: ago(60),  updatedAt: ago(5)  },
  { id: 'demo-cust-3', name: '田中工務店',           industry: '建設・工務店',                                                createdAt: ago(45),  updatedAt: ago(3)  },
  { id: 'demo-cust-4', name: '山田デザイン事務所',   industry: 'デザイン・クリエイティブ',                                    createdAt: ago(30),  updatedAt: ago(10) },
  { id: 'demo-cust-5', name: 'NOVA Academy',        industry: '教育・スクール',              website: 'nova-academy.example', createdAt: ago(120), updatedAt: ago(1)  },
  { id: 'demo-cust-6', name: '株式会社蒼建',         industry: '建設・不動産',                                                createdAt: ago(20),  updatedAt: ago(12) },
])

// ─── Projects ───────────────────────────────────────────────────────────────
export const demoProjects: Project[] = withOrg<Project>([
  { id: 'demo-proj-1', clientName: '株式会社サンプル',    name: 'コーポレートサイト制作',         status: '受注',   budget: 2800000, customerId: 'demo-cust-1', createdAt: ago(60), updatedAt: ago(2)  },
  { id: 'demo-proj-2', clientName: 'BELLE美容室',         name: 'LP制作',                        status: '提案済', budget: 350000,  customerId: 'demo-cust-2', createdAt: ago(20), updatedAt: ago(5)  },
  { id: 'demo-proj-3', clientName: '田中工務店',           name: '採用サイト制作',                status: '進行中', budget: 1500000, customerId: 'demo-cust-3', createdAt: ago(45), updatedAt: ago(3)  },
  { id: 'demo-proj-4', clientName: '山田デザイン事務所',   name: 'ポートフォリオサイト制作',      status: '商談中', budget: 480000,  customerId: 'demo-cust-4', createdAt: ago(15), updatedAt: ago(10) },
  { id: 'demo-proj-5', clientName: 'NOVA Academy',        name: 'スクールサイト制作',            status: '受注',   budget: 2200000, customerId: 'demo-cust-5', createdAt: ago(50), updatedAt: ago(1)  },
  { id: 'demo-proj-6', clientName: '株式会社蒼建',         name: 'コーポレートサイトリニューアル', status: '商談中', budget: 1200000, customerId: 'demo-cust-6', createdAt: ago(12), updatedAt: ago(12) },
])

// ─── Contacts ───────────────────────────────────────────────────────────────
export const demoContacts: Contact[] = [
  { id: 'demo-contact-1', customerId: 'demo-cust-1', name: '田中 誠',   role: '代表取締役',        email: 'tanaka@sample-corp.example',    createdAt: ago(88) },
  { id: 'demo-contact-2', customerId: 'demo-cust-1', name: '佐藤 花子', role: 'マーケティング部長', email: 'sato@sample-corp.example',      createdAt: ago(85) },
  { id: 'demo-contact-3', customerId: 'demo-cust-2', name: '高橋 あや', role: 'オーナー',           email: 'takahashi@belle-salon.example', phone: '03-2345-6789', createdAt: ago(58) },
  { id: 'demo-contact-4', customerId: 'demo-cust-3', name: '田中 健太', role: '代表',               phone: '03-1234-5678',                   createdAt: ago(43) },
  { id: 'demo-contact-5', customerId: 'demo-cust-3', name: '山本 由美', role: '総務担当',            email: 'yamamoto@tanaka-kouji.example', createdAt: ago(42) },
  { id: 'demo-contact-6', customerId: 'demo-cust-5', name: '野田 航',   role: '校長',               email: 'noda@nova-academy.example',     createdAt: ago(118) },
]

// ─── Hearings ───────────────────────────────────────────────────────────────
export const demoHearings: Hearing[] = [
  {
    id: 'demo-hear-1', projectId: 'demo-proj-1', date: agoDate(50),
    memo: 'コーポレートサイトのリニューアルについてヒアリングを実施。現状サイトはWordPressで5年前に制作。スマホ対応が不十分で離脱率が高い状況。目的は「信頼感の向上」と「採用強化」。ターゲットは30〜40代のIT系企業担当者。現状のページ数は約20ページ。',
    createdAt: ago(50),
  },
  {
    id: 'demo-hear-2', projectId: 'demo-proj-1', date: agoDate(30),
    memo: 'デザイン方向性のすり合わせ。シンプル・モダン・プロフェッショナルなイメージで合意。競合他社サイト3社を参考に提示。採用ページは独立させてコンテンツを強化したい意向。CMS移行（WordPress→microCMS）も検討中。',
    createdAt: ago(30),
  },
  {
    id: 'demo-hear-3', projectId: 'demo-proj-1', date: agoDate(10),
    memo: 'ワイヤーフレームレビュー実施。トップ・会社概要・サービス・採用の4ページ構成で承認。採用ページにスタッフインタビュー動画を掲載したい。納期は2ヶ月後を目標に設定。写真素材は先方で用意予定。',
    createdAt: ago(10),
  },
  {
    id: 'demo-hear-4', projectId: 'demo-proj-2', date: agoDate(18),
    memo: 'LP制作のヒアリング。新メニュー「頭皮ケアトリートメント」の集客LP。ターゲットは35〜50代女性。InstagramとGoogle広告からの流入を想定。競合との差別化はスタッフの専門性とアフターケアの充実。予算は30〜40万程度で検討中。',
    createdAt: ago(18),
  },
  {
    id: 'demo-hear-5', projectId: 'demo-proj-2', date: agoDate(5),
    memo: '参考サイト・デザインイメージの共有。温かみのある女性向けトーンで合意。ファーストビューは施術中の写真を大きく使いたい。予約ボタンはスクロールしても固定表示。電話番号も目立つ位置に配置。',
    createdAt: ago(5),
  },
  {
    id: 'demo-hear-6', projectId: 'demo-proj-3', date: agoDate(40),
    memo: '採用サイト制作のヒアリング。現在採用は求人サイトのみで自社サイトなし。年間採用目標は大工・職人5名。20代後半〜30代前半の若い人材を獲得したい。社風・現場の雰囲気を伝えることが最優先。',
    createdAt: ago(40),
  },
  {
    id: 'demo-hear-7', projectId: 'demo-proj-3', date: agoDate(20),
    memo: 'コンテンツ設計の確認。「スタッフインタビュー」「1日の流れ」「先輩社員のQ&A」の3コンテンツを中核に構成。現場写真の撮影は外注カメラマンに依頼予定（別途見積）。採用エントリーフォームはWordPressプラグインで対応。',
    createdAt: ago(20),
  },
  {
    id: 'demo-hear-8', projectId: 'demo-proj-5', date: agoDate(45),
    memo: 'スクールサイトのヒアリング。英語・プログラミング・音楽の3コースを展開中。生徒募集がメイン目的。保護者向けの安心感と講師の専門性をアピールしたい。既存サイトは静的HTMLのみで更新が困難。CMS導入が必須。',
    createdAt: ago(45),
  },
]

// ─── Estimates ──────────────────────────────────────────────────────────────
export const demoEstimates: Estimate[] = withOrg<Estimate>([
  {
    id: 'demo-est-1', projectId: 'demo-proj-1', customerId: 'demo-cust-1',
    title: 'コーポレートサイト制作 見積書（本体）',
    status: 'approved', subtotal: 2100000, tax: 210000, total: 2310000,
    note: '分割払い対応可（着手金50%・完成時50%）。',
    items: [
      { id: 'demo-est-1-i1', estimateId: 'demo-est-1', name: 'デザイン制作',      quantity: 1, unitPrice: 900000, amount: 900000,  sortOrder: 1 },
      { id: 'demo-est-1-i2', estimateId: 'demo-est-1', name: 'コーディング',       quantity: 1, unitPrice: 700000, amount: 700000,  sortOrder: 2 },
      { id: 'demo-est-1-i3', estimateId: 'demo-est-1', name: 'CMS構築・設定',      quantity: 1, unitPrice: 350000, amount: 350000,  sortOrder: 3 },
      { id: 'demo-est-1-i4', estimateId: 'demo-est-1', name: 'ライティング（4P）', quantity: 4, unitPrice: 37500,  amount: 150000,  sortOrder: 4 },
    ],
    createdAt: ago(55), updatedAt: ago(55),
  },
  {
    id: 'demo-est-2', projectId: 'demo-proj-1', customerId: 'demo-cust-1',
    title: 'コーポレートサイト制作 見積書（追加オプション）',
    status: 'approved', subtotal: 420000, tax: 42000, total: 462000,
    items: [
      { id: 'demo-est-2-i1', estimateId: 'demo-est-2', name: '動画撮影・編集',     quantity: 1, unitPrice: 280000, amount: 280000, sortOrder: 1 },
      { id: 'demo-est-2-i2', estimateId: 'demo-est-2', name: 'アニメーション実装', quantity: 1, unitPrice: 140000, amount: 140000, sortOrder: 2 },
    ],
    createdAt: ago(50), updatedAt: ago(50),
  },
  {
    id: 'demo-est-3', projectId: 'demo-proj-2', customerId: 'demo-cust-2',
    title: 'LP制作 見積書',
    status: 'sent', subtotal: 300000, tax: 30000, total: 330000,
    items: [
      { id: 'demo-est-3-i1', estimateId: 'demo-est-3', name: 'LPデザイン',   quantity: 1, unitPrice: 180000, amount: 180000, sortOrder: 1 },
      { id: 'demo-est-3-i2', estimateId: 'demo-est-3', name: 'コーディング', quantity: 1, unitPrice: 100000, amount: 100000, sortOrder: 2 },
      { id: 'demo-est-3-i3', estimateId: 'demo-est-3', name: '写真素材費',   quantity: 1, unitPrice: 20000,  amount: 20000,  sortOrder: 3 },
    ],
    createdAt: ago(15), updatedAt: ago(15),
  },
  {
    id: 'demo-est-4', projectId: 'demo-proj-3', customerId: 'demo-cust-3',
    title: '採用サイト制作 見積書',
    status: 'approved', subtotal: 1380000, tax: 138000, total: 1518000,
    items: [
      { id: 'demo-est-4-i1', estimateId: 'demo-est-4', name: 'サイト設計・IA',     quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 1 },
      { id: 'demo-est-4-i2', estimateId: 'demo-est-4', name: 'デザイン制作',       quantity: 1, unitPrice: 450000, amount: 450000, sortOrder: 2 },
      { id: 'demo-est-4-i3', estimateId: 'demo-est-4', name: 'コーディング',       quantity: 1, unitPrice: 380000, amount: 380000, sortOrder: 3 },
      { id: 'demo-est-4-i4', estimateId: 'demo-est-4', name: '撮影費用（外注）',   quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 4 },
      { id: 'demo-est-4-i5', estimateId: 'demo-est-4', name: 'ライティング（8P）', quantity: 8, unitPrice: 18750,  amount: 150000, sortOrder: 5 },
    ],
    createdAt: ago(38), updatedAt: ago(38),
  },
  {
    id: 'demo-est-5', projectId: 'demo-proj-5', customerId: 'demo-cust-5',
    title: 'スクールサイト制作 見積書',
    status: 'approved', subtotal: 1980000, tax: 198000, total: 2178000,
    items: [
      { id: 'demo-est-5-i1', estimateId: 'demo-est-5', name: 'サイト設計・IA',       quantity: 1, unitPrice: 250000, amount: 250000, sortOrder: 1 },
      { id: 'demo-est-5-i2', estimateId: 'demo-est-5', name: 'デザイン制作',         quantity: 1, unitPrice: 600000, amount: 600000, sortOrder: 2 },
      { id: 'demo-est-5-i3', estimateId: 'demo-est-5', name: 'コーディング',         quantity: 1, unitPrice: 500000, amount: 500000, sortOrder: 3 },
      { id: 'demo-est-5-i4', estimateId: 'demo-est-5', name: 'CMS構築・設定',        quantity: 1, unitPrice: 400000, amount: 400000, sortOrder: 4 },
      { id: 'demo-est-5-i5', estimateId: 'demo-est-5', name: 'コース別LP（3コース）', quantity: 1, unitPrice: 230000, amount: 230000, sortOrder: 5 },
    ],
    createdAt: ago(48), updatedAt: ago(48),
  },
])

// ─── Invoices ───────────────────────────────────────────────────────────────
export const demoInvoices: Invoice[] = withOrg<Invoice>([
  {
    id: 'demo-inv-1', projectId: 'demo-proj-1', customerId: 'demo-cust-1', estimateId: 'demo-est-1',
    title: 'コーポレートサイト制作 請求書（着手金）',
    status: 'paid', subtotal: 1050000, tax: 105000, total: 1155000,
    paidAt: agoDate(45), paidAmount: 1155000,
    items: [
      { id: 'demo-inv-1-i1', invoiceId: 'demo-inv-1', name: '着手金（契約金額の50%）', quantity: 1, unitPrice: 1050000, amount: 1050000, sortOrder: 1 },
    ],
    createdAt: ago(52), updatedAt: ago(45),
  },
  {
    id: 'demo-inv-2', projectId: 'demo-proj-5', customerId: 'demo-cust-5', estimateId: 'demo-est-5',
    title: 'スクールサイト制作 請求書（着手金）',
    status: 'sent', subtotal: 990000, tax: 99000, total: 1089000,
    dueDate: fromNow(14),
    items: [
      { id: 'demo-inv-2-i1', invoiceId: 'demo-inv-2', name: '着手金（契約金額の50%）', quantity: 1, unitPrice: 990000, amount: 990000, sortOrder: 1 },
    ],
    createdAt: ago(3), updatedAt: ago(3),
  },
  {
    id: 'demo-inv-3', projectId: 'demo-proj-3', customerId: 'demo-cust-3', estimateId: 'demo-est-4',
    title: '採用サイト制作 請求書（着手金）',
    status: 'draft', subtotal: 690000, tax: 69000, total: 759000,
    items: [
      { id: 'demo-inv-3-i1', invoiceId: 'demo-inv-3', name: '着手金（契約金額の50%）', quantity: 1, unitPrice: 690000, amount: 690000, sortOrder: 1 },
    ],
    createdAt: ago(8), updatedAt: ago(8),
  },
])

// ─── Contracts ──────────────────────────────────────────────────────────────
export const demoContracts: Contract[] = withOrg<Contract>([
  {
    id: 'demo-cont-1', projectId: 'demo-proj-1', customerId: 'demo-cust-1', estimateId: 'demo-est-1',
    title: 'コーポレートサイト制作 業務委託契約書',
    status: 'signed', contractDate: agoDate(55), startDate: agoDate(50), endDate: fromNow(30), amount: 2772000,
    createdAt: ago(56), updatedAt: ago(55),
  },
  {
    id: 'demo-cont-2', projectId: 'demo-proj-3', customerId: 'demo-cust-3', estimateId: 'demo-est-4',
    title: '採用サイト制作 業務委託契約書',
    status: 'sent', contractDate: agoDate(35), startDate: agoDate(30), endDate: fromNow(60), amount: 1518000,
    createdAt: ago(36), updatedAt: ago(35),
  },
  {
    id: 'demo-cont-3', projectId: 'demo-proj-5', customerId: 'demo-cust-5', estimateId: 'demo-est-5',
    title: 'スクールサイト制作 業務委託契約書',
    status: 'signed', contractDate: agoDate(48), startDate: agoDate(45), endDate: fromNow(45), amount: 2178000,
    createdAt: ago(49), updatedAt: ago(48),
  },
  {
    id: 'demo-cont-4', projectId: 'demo-proj-2', customerId: 'demo-cust-2',
    title: 'LP制作 業務委託契約書（案）',
    status: 'draft', amount: 330000,
    createdAt: ago(12), updatedAt: ago(12),
  },
])

// ─── Project Costs ──────────────────────────────────────────────────────────
export const demoProjectCosts: ProjectCost[] = withOrg<ProjectCost>([
  { id: 'demo-cost-1', projectId: 'demo-proj-1', customerId: 'demo-cust-1', title: '外注デザイナー費用',          category: 'outsourcing', amount: 350000, costDate: agoDate(35), createdAt: ago(35), updatedAt: ago(35) },
  { id: 'demo-cost-2', projectId: 'demo-proj-1', customerId: 'demo-cust-1', title: 'Adobe Stock 素材費',          category: 'material',    amount: 22000,  costDate: agoDate(25), createdAt: ago(25), updatedAt: ago(25) },
  { id: 'demo-cost-3', projectId: 'demo-proj-1', customerId: 'demo-cust-1', title: 'サーバー移行作業費（外注）',  category: 'outsourcing', amount: 80000,  costDate: agoDate(15), createdAt: ago(15), updatedAt: ago(15) },
  { id: 'demo-cost-4', projectId: 'demo-proj-3', customerId: 'demo-cust-3', title: '現場撮影 外注カメラマン',     category: 'outsourcing', amount: 180000, costDate: agoDate(22), createdAt: ago(22), updatedAt: ago(22) },
  { id: 'demo-cost-5', projectId: 'demo-proj-3', customerId: 'demo-cust-3', title: 'Figma プレミアム（3ヶ月）',  category: 'tool',        amount: 9000,   costDate: agoDate(30), createdAt: ago(30), updatedAt: ago(30) },
  { id: 'demo-cost-6', projectId: 'demo-proj-5', customerId: 'demo-cust-5', title: '外注コーダー費用',            category: 'outsourcing', amount: 240000, costDate: agoDate(30), createdAt: ago(30), updatedAt: ago(30) },
  { id: 'demo-cost-7', projectId: 'demo-proj-5', customerId: 'demo-cust-5', title: 'フォントライセンス',           category: 'tool',        amount: 15000,  costDate: agoDate(20), createdAt: ago(20), updatedAt: ago(20) },
])

// ─── Project Files ──────────────────────────────────────────────────────────
export const demoProjectFiles: ProjectFile[] = withOrg<ProjectFile>([
  { id: 'demo-file-1', projectId: 'demo-proj-1', customerId: 'demo-cust-1', name: 'コーポレートサイト ワイヤーフレーム.fig', category: 'design',   fileType: 'figma', externalUrl: 'https://figma.com/file/demo-wireframe', createdAt: ago(45), updatedAt: ago(45) },
  { id: 'demo-file-2', projectId: 'demo-proj-1', customerId: 'demo-cust-1', name: '契約書_株式会社サンプル_署名済.pdf',      category: 'pdf',      fileType: 'pdf',   createdAt: ago(55), updatedAt: ago(55) },
  { id: 'demo-file-3', projectId: 'demo-proj-1', customerId: 'demo-cust-1', name: 'ヒアリングシート.docx',                   category: 'document', fileType: 'docx',  createdAt: ago(50), updatedAt: ago(50) },
  { id: 'demo-file-4', projectId: 'demo-proj-3', customerId: 'demo-cust-3', name: '採用サイト デザインカンプ v2.fig',        category: 'design',   fileType: 'figma', externalUrl: 'https://figma.com/file/demo-design', createdAt: ago(18), updatedAt: ago(18) },
  { id: 'demo-file-5', projectId: 'demo-proj-3', customerId: 'demo-cust-3', name: '現場写真素材一式.zip',                    category: 'other',    fileType: 'zip',   createdAt: ago(15), updatedAt: ago(15) },
  { id: 'demo-file-6', projectId: 'demo-proj-5', customerId: 'demo-cust-5', name: 'スクールサイト サイトマップ.pdf',         category: 'pdf',      fileType: 'pdf',   createdAt: ago(44), updatedAt: ago(44) },
])

// ─── Tasks ──────────────────────────────────────────────────────────────────
export const demoTasks: Task[] = withOrg<Task>([
  { id: 'demo-task-1', projectId: 'demo-proj-3', customerId: 'demo-cust-3', title: '提案書作成',     description: 'ヒアリング内容をもとに提案書を作成する', status: 'todo',        priority: 'high',   dueDate: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),  createdAt: ago(10), updatedAt: ago(4)  },
  { id: 'demo-task-2', projectId: 'demo-proj-2', customerId: 'demo-cust-2', title: '見積書送付',     description: 'LP制作の見積書を送付する',               status: 'todo',        priority: 'medium', dueDate: new Date().toISOString().slice(0, 10),                           createdAt: ago(8),  updatedAt: ago(1)  },
  { id: 'demo-task-3', projectId: 'demo-proj-4', customerId: 'demo-cust-4', title: 'ヒアリング実施', description: '要件のヒアリング・ディスカッション',      status: 'todo',        priority: 'medium', dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), createdAt: ago(5),  updatedAt: ago(2)  },
  { id: 'demo-task-4', projectId: 'demo-proj-2', customerId: 'demo-cust-2', title: 'LPデザイン制作', description: 'ワイヤーフレームをもとにデザインを進める', status: 'in_progress', priority: 'high',   dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), createdAt: ago(15), updatedAt: ago(1)  },
  { id: 'demo-task-5', projectId: 'demo-proj-5', customerId: 'demo-cust-5', title: '契約書作成',     description: 'スクールサイト受注の契約書を作成',         status: 'in_progress', priority: 'medium', dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), createdAt: ago(7),  updatedAt: ago(1)  },
  { id: 'demo-task-6', projectId: 'demo-proj-1', customerId: 'demo-cust-1', title: '初回打ち合わせ', status: 'done', priority: 'medium', completedAt: ago(30).slice(0, 10), createdAt: ago(35), updatedAt: ago(30) },
  { id: 'demo-task-7', projectId: 'demo-proj-3', customerId: 'demo-cust-3', title: '要件整理',       status: 'done', priority: 'low',    completedAt: ago(20).slice(0, 10), createdAt: ago(25), updatedAt: ago(20) },
])

// ─── Activities (dashboard feed) ────────────────────────────────────────────
export type DemoActivity = {
  id: string
  colorCls: string
  label: string
  clientName: string
  projectName: string
  projectId: string
  date: string
}

export const demoActivities: DemoActivity[] = [
  { id: 'demo-act-1', colorCls: 'bg-orange-100 text-orange-700', label: '請求書発行',  clientName: 'NOVA Academy',    projectName: 'スクールサイト制作',        projectId: 'demo-proj-5', date: ago(1).slice(0, 10) },
  { id: 'demo-act-2', colorCls: 'bg-indigo-100 text-indigo-700', label: '契約締結',    clientName: '株式会社サンプル', projectName: 'コーポレートサイト制作',    projectId: 'demo-proj-1', date: ago(2).slice(0, 10) },
  { id: 'demo-act-3', colorCls: 'bg-purple-100 text-purple-700', label: '打ち合わせ',  clientName: '田中工務店',        projectName: '採用サイト制作',           projectId: 'demo-proj-3', date: ago(3).slice(0, 10) },
  { id: 'demo-act-4', colorCls: 'bg-blue-100 text-blue-700',     label: '見積送付',    clientName: 'BELLE美容室',       projectName: 'LP制作',                   projectId: 'demo-proj-2', date: ago(4).slice(0, 10) },
  { id: 'demo-act-5', colorCls: 'bg-blue-100 text-blue-700',     label: '提案書送付',  clientName: '山田デザイン事務所', projectName: 'ポートフォリオサイト制作', projectId: 'demo-proj-4', date: ago(6).slice(0, 10) },
]

// ─── KPI (pre-computed) ─────────────────────────────────────────────────────
export const DEMO_KPI = {
  customerCount:      6,
  projectCount:       6,
  activeProjectCount: 4,
  thisMonthRevenue:   1250000,
  thisMonthProfit:    870000,
  profitRate:         70,
}

// ─── Lookup Maps ────────────────────────────────────────────────────────────
export const demoProjectMap          = new Map(demoProjects.map(p => [p.id, p]))
export const demoHearingsByProject   = groupBy(demoHearings,     h   => h.projectId)
export const demoEstimatesByProject  = groupBy(demoEstimates,    e   => e.projectId)
export const demoInvoicesByProject   = groupBy(demoInvoices,     inv => inv.projectId)
export const demoContractsByProject  = groupBy(demoContracts,    c   => c.projectId)
export const demoCostsByProject      = groupBy(demoProjectCosts, c   => c.projectId)
export const demoFilesByProject      = groupBy(demoProjectFiles, f   => f.projectId)
export const demoContactsByCustomer  = groupBy(demoContacts,     c   => c.customerId)
export const demoTasksByProject      = groupBy(demoTasks,        t   => t.projectId)

// ─── Demo search ─────────────────────────────────────────────────────────────
function dmMatches(q: string, ...fields: (string | undefined | null)[]): boolean {
  return fields.some(f => f?.toLowerCase().includes(q))
}

export function searchDemoData(query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results: SearchResult[] = []
  const projMap = new Map(demoProjects.map(p => [p.id, p.name]))

  for (const p of demoProjects) {
    if (dmMatches(q, p.name, p.clientName)) {
      results.push({ id: p.id, type: 'project', title: p.name, subtitle: p.clientName, href: `/projects/${p.id}`, createdAt: p.createdAt })
    }
  }

  for (const c of demoCustomers) {
    if (dmMatches(q, c.name, c.industry)) {
      results.push({ id: c.id, type: 'customer', title: c.name, subtitle: c.industry, href: `/customers/${c.id}`, createdAt: c.createdAt, customerId: c.id })
    }
  }

  for (const h of demoHearings) {
    if (dmMatches(q, h.memo)) {
      const i = h.memo.toLowerCase().indexOf(q)
      const start = Math.max(0, i - 20)
      const snippet = (start > 0 ? '…' : '') + h.memo.slice(start, start + q.length + 60) + '…'
      results.push({ id: h.id, type: 'hearing', title: `${h.date} の打ち合わせメモ`, subtitle: projMap.get(h.projectId), snippet, href: `/projects/${h.projectId}`, createdAt: h.createdAt, projectId: h.projectId })
    }
  }

  for (const e of demoEstimates) {
    const itemMatch = e.items.some(item => dmMatches(q, item.name, item.description))
    if (dmMatches(q, e.title, e.note) || itemMatch) {
      const projName = projMap.get(e.projectId)
      results.push({ id: e.id, type: 'estimate', title: e.title, subtitle: [projName, `¥${e.total.toLocaleString('ja-JP')}`].filter(Boolean).join(' · '), href: `/projects/${e.projectId}`, createdAt: e.createdAt, projectId: e.projectId, customerId: e.customerId })
    }
  }

  for (const inv of demoInvoices) {
    const itemMatch = inv.items.some(item => dmMatches(q, item.name))
    if (dmMatches(q, inv.title) || itemMatch) {
      const projName = projMap.get(inv.projectId)
      results.push({ id: inv.id, type: 'invoice', title: inv.title, subtitle: [projName, `¥${inv.total.toLocaleString('ja-JP')}`].filter(Boolean).join(' · '), href: `/projects/${inv.projectId}`, createdAt: inv.createdAt, projectId: inv.projectId, customerId: inv.customerId })
    }
  }

  for (const con of demoContracts) {
    if (dmMatches(q, con.title, con.note)) {
      results.push({ id: con.id, type: 'contract', title: con.title, subtitle: projMap.get(con.projectId), href: `/projects/${con.projectId}`, createdAt: con.createdAt, projectId: con.projectId })
    }
  }

  for (const t of demoTasks) {
    if (dmMatches(q, t.title, t.description)) {
      results.push({ id: t.id, type: 'task', title: t.title, subtitle: projMap.get(t.projectId), snippet: t.description, href: `/projects/${t.projectId}`, createdAt: t.createdAt, projectId: t.projectId })
    }
  }

  return results
}
