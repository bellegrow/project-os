import type { Customer, Project, Task } from './types'

// ─── date helpers ──────────────────────────────────────────────────────────
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

// ─── Customers ─────────────────────────────────────────────────────────────
export const demoCustomers: Customer[] = [
  { id: 'demo-cust-1', name: '株式会社サンプル',      industry: 'IT・Web',              website: 'sample-corp.example',  createdAt: ago(90), updatedAt: ago(2)  },
  { id: 'demo-cust-2', name: 'BELLE美容室',           industry: '美容・サロン',          website: 'belle-salon.example',  createdAt: ago(60), updatedAt: ago(5)  },
  { id: 'demo-cust-3', name: '田中工務店',             industry: '建設・工務店',                                           createdAt: ago(45), updatedAt: ago(3)  },
  { id: 'demo-cust-4', name: '山田デザイン事務所',     industry: 'デザイン・クリエイティブ',                               createdAt: ago(30), updatedAt: ago(10) },
  { id: 'demo-cust-5', name: 'NOVA Academy',          industry: '教育・スクール',         website: 'nova-academy.example', createdAt: ago(120), updatedAt: ago(1) },
  { id: 'demo-cust-6', name: '株式会社蒼建',           industry: '建設・不動産',                                           createdAt: ago(20), updatedAt: ago(12) },
]

// ─── Projects ──────────────────────────────────────────────────────────────
export const demoProjects: Project[] = [
  {
    id: 'demo-proj-1',
    clientName: '株式会社サンプル',
    name: 'コーポレートサイト制作',
    status: '受注',
    budget: 2800000,
    customerId: 'demo-cust-1',
    createdAt: ago(60),
    updatedAt: ago(2),
  },
  {
    id: 'demo-proj-2',
    clientName: 'BELLE美容室',
    name: 'LP制作',
    status: '提案済',
    budget: 350000,
    customerId: 'demo-cust-2',
    createdAt: ago(20),
    updatedAt: ago(5),
  },
  {
    id: 'demo-proj-3',
    clientName: '田中工務店',
    name: '採用サイト制作',
    status: '進行中',
    budget: 1500000,
    customerId: 'demo-cust-3',
    createdAt: ago(45),
    updatedAt: ago(3),
  },
  {
    id: 'demo-proj-4',
    clientName: '山田デザイン事務所',
    name: 'ポートフォリオサイト制作',
    status: '商談中',
    budget: 480000,
    customerId: 'demo-cust-4',
    createdAt: ago(15),
    updatedAt: ago(10),
  },
  {
    id: 'demo-proj-5',
    clientName: 'NOVA Academy',
    name: 'スクールサイト制作',
    status: '受注',
    budget: 2200000,
    customerId: 'demo-cust-5',
    createdAt: ago(50),
    updatedAt: ago(1),
  },
  {
    id: 'demo-proj-6',
    clientName: '株式会社蒼建',
    name: 'コーポレートサイトリニューアル',
    status: '商談中',
    budget: 1200000,
    customerId: 'demo-cust-6',
    createdAt: ago(12),
    updatedAt: ago(12),
  },
]

// ─── Tasks ─────────────────────────────────────────────────────────────────
export const demoTasks: Task[] = [
  // todo ─ overdue
  {
    id: 'demo-task-1',
    projectId: 'demo-proj-3',
    customerId: 'demo-cust-3',
    title: '提案書作成',
    description: 'ヒアリング内容をもとに提案書を作成する',
    status: 'todo',
    priority: 'high',
    dueDate: fromNow(-4),
    createdAt: ago(10),
    updatedAt: ago(4),
  },
  // todo ─ today
  {
    id: 'demo-task-2',
    projectId: 'demo-proj-2',
    customerId: 'demo-cust-2',
    title: '見積書送付',
    description: 'LP制作の見積書を送付する',
    status: 'todo',
    priority: 'medium',
    dueDate: fromNow(0),
    createdAt: ago(8),
    updatedAt: ago(1),
  },
  // todo ─ upcoming
  {
    id: 'demo-task-3',
    projectId: 'demo-proj-4',
    customerId: 'demo-cust-4',
    title: 'ヒアリング実施',
    description: '要件のヒアリング・ディスカッション',
    status: 'todo',
    priority: 'medium',
    dueDate: fromNow(3),
    createdAt: ago(5),
    updatedAt: ago(2),
  },
  // in_progress
  {
    id: 'demo-task-4',
    projectId: 'demo-proj-2',
    customerId: 'demo-cust-2',
    title: 'LPデザイン制作',
    description: 'ワイヤーフレームもとにデザインを進める',
    status: 'in_progress',
    priority: 'high',
    dueDate: fromNow(7),
    createdAt: ago(15),
    updatedAt: ago(1),
  },
  {
    id: 'demo-task-5',
    projectId: 'demo-proj-5',
    customerId: 'demo-cust-5',
    title: '契約書作成',
    description: 'スクールサイト受注の契約書を作成',
    status: 'in_progress',
    priority: 'medium',
    dueDate: fromNow(2),
    createdAt: ago(7),
    updatedAt: ago(1),
  },
  // done
  {
    id: 'demo-task-6',
    projectId: 'demo-proj-1',
    customerId: 'demo-cust-1',
    title: '初回打ち合わせ',
    status: 'done',
    priority: 'medium',
    completedAt: agoDate(30),
    createdAt: ago(35),
    updatedAt: ago(30),
  },
  {
    id: 'demo-task-7',
    projectId: 'demo-proj-3',
    customerId: 'demo-cust-3',
    title: '要件整理',
    status: 'done',
    priority: 'low',
    completedAt: agoDate(20),
    createdAt: ago(25),
    updatedAt: ago(20),
  },
]

// ─── Activities (dashboard feed) ───────────────────────────────────────────
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
  {
    id: 'demo-act-1',
    colorCls: 'bg-orange-100 text-orange-700',
    label: '請求書発行',
    clientName: 'NOVA Academy',
    projectName: 'スクールサイト制作',
    projectId: 'demo-proj-5',
    date: agoDate(1),
  },
  {
    id: 'demo-act-2',
    colorCls: 'bg-indigo-100 text-indigo-700',
    label: '契約締結',
    clientName: '株式会社サンプル',
    projectName: 'コーポレートサイト制作',
    projectId: 'demo-proj-1',
    date: agoDate(2),
  },
  {
    id: 'demo-act-3',
    colorCls: 'bg-purple-100 text-purple-700',
    label: '打ち合わせ実施',
    clientName: '田中工務店',
    projectName: '採用サイト制作',
    projectId: 'demo-proj-3',
    date: agoDate(3),
  },
  {
    id: 'demo-act-4',
    colorCls: 'bg-blue-100 text-blue-700',
    label: '見積送付',
    clientName: 'BELLE美容室',
    projectName: 'LP制作',
    projectId: 'demo-proj-2',
    date: agoDate(4),
  },
  {
    id: 'demo-act-5',
    colorCls: 'bg-blue-100 text-blue-700',
    label: '提案書送付',
    clientName: '山田デザイン事務所',
    projectName: 'ポートフォリオサイト制作',
    projectId: 'demo-proj-4',
    date: agoDate(6),
  },
]

// ─── KPI (pre-computed) ────────────────────────────────────────────────────
export const DEMO_KPI = {
  customerCount:      6,
  projectCount:       6,
  activeProjectCount: 4,
  thisMonthRevenue:   1250000,
  thisMonthProfit:    870000,
  profitRate:         70,
}

// ─── helpers ───────────────────────────────────────────────────────────────
export const demoProjectMap = new Map(demoProjects.map(p => [p.id, p]))
