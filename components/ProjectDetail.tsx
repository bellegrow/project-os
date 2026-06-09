'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCloudMode } from '@/lib/hooks/useCloudMode'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  Pencil,
  Eye,
  FilePlus,
  Banknote,
  Send,
  Undo2,
  ExternalLink,
  Download,
  Building2,
  MessageSquare,
  FileText,
  CreditCard,
  ScrollText,
  TrendingUp,
  Activity,
  ListTodo,
} from 'lucide-react'
import {
  Project, Hearing, ProjectStatus, Customer, Contact, Estimate, Invoice, InvoiceStatus,
  Contract, Task, ProjectCost, CostCategory, ProjectFile, FileCategory,
} from '@/lib/types'
import {
  getProject, getHearings, deleteHearing, updateProjectStatus, deleteProject, updateHearing,
  getCustomer, getContacts, getEstimates, deleteEstimate, getInvoices, deleteInvoice,
  updateInvoiceStatus, cancelPayment,
  getContracts, deleteContract,
  createActivity,
  getTasks, completeTask, deleteTask,
  getProjectCosts, deleteProjectCost,
  getProjectFiles, deleteProjectFile, getProjectFileUrl,
} from '@/lib/dataSource'
import {
  formatRelativeDate, formatFullDate, formatCurrency, getHearingPreview,
  formatEstimateNumber, formatInvoiceNumber, formatContractNumber,
  isInvoiceOverdue, formatYMD, isTaskOverdue, checkProjectStatus, StatusCheckConfig,
} from '@/lib/utils'
import { getSettings } from '@/lib/settingsSource'
import EditProjectModal from './EditProjectModal'
import EstimateStatusBadge from './EstimateStatusBadge'
import EstimateModal from './EstimateModal'
import InvoiceStatusBadge from './InvoiceStatusBadge'
import InvoiceModal from './InvoiceModal'
import ContractStatusBadge from './ContractStatusBadge'
import ContractModal from './ContractModal'
import PaymentModal from './PaymentModal'
import ActivityModal from './ActivityModal'
import ActivityFeed from './ActivityFeed'
import TaskModal from './TaskModal'
import ProjectCostModal from './ProjectCostModal'
import ProjectFileModal from './ProjectFileModal'
import ProjectStatusBadge from './ProjectStatusBadge'
import EstimateToInvoiceModal from './EstimateToInvoiceModal'

type Tab = 'overview' | 'tasks' | 'meetings' | 'billing' | 'contracts' | 'files' | 'profit'

const STATUS_CLS: Record<ProjectStatus, string> = {
  商談中: 'bg-amber-100 text-amber-700',
  提案済: 'bg-blue-100 text-blue-700',
  受注: 'bg-emerald-100 text-emerald-700',
  進行中: 'bg-violet-100 text-violet-700',
  完了: 'bg-gray-100 text-gray-600',
  失注: 'bg-red-100 text-red-600',
}

const CATEGORY_LABELS: Record<CostCategory, string> = {
  outsourcing: '外注費', material: '材料費', tool: 'ツール費', ad: '広告費', other: 'その他',
}

const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  document: '文書', image: '画像', pdf: 'PDF', design: 'デザイン', delivery: '納品物', other: 'その他',
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: '概要' },
  { id: 'tasks',      label: 'タスク' },
  { id: 'meetings',   label: '打ち合わせ' },
  { id: 'billing',    label: '見積・請求' },
  { id: 'contracts',  label: '契約書' },
  { id: 'files',      label: 'ファイル' },
  { id: 'profit',     label: '利益' },
]

export default function ProjectDetail() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingHearingId, setEditingHearingId] = useState<string | null>(null)
  const [editingMemo, setEditingMemo] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [showAllHearings, setShowAllHearings] = useState(false)
  const [showEstimateModal, setShowEstimateModal] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [creatingFromEstimate, setCreatingFromEstimate] = useState<Estimate | null>(null)
  const [estimateToInvoiceTarget, setEstimateToInvoiceTarget] = useState<{
    estimate: Estimate; initialPct?: '100' | '50-deposit' | '50-final' | 'custom'; initialCustomPct?: number
  } | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [showContractModal, setShowContractModal] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showDoneTasks, setShowDoneTasks] = useState(false)
  const [taskError, setTaskError] = useState('')
  const [costs, setCosts] = useState<ProjectCost[]>([])
  const [showCostModal, setShowCostModal] = useState(false)
  const [editingCost, setEditingCost] = useState<ProjectCost | null>(null)
  const [costError, setCostError] = useState('')
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [showFileModal, setShowFileModal] = useState(false)
  const [editingFile, setEditingFile] = useState<ProjectFile | null>(null)
  const [fileError, setFileError] = useState('')
  const [openingFileId, setOpeningFileId] = useState<string | null>(null)
  const [statusConfig, setStatusConfig] = useState<Partial<StatusCheckConfig>>({})
  const [docTaxRate, setDocTaxRate] = useState(10)
  const [docInvoiceDueDays, setDocInvoiceDueDays] = useState(30)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const isCloud = useCloudMode()

  const load = useCallback(async () => {
    const p = await getProject(projectId)
    if (!p) { router.push('/projects'); return }
    setProject(p)
    const [h, es, inv, cons, ts, cs, fs, settings] = await Promise.all([
      getHearings(projectId),
      getEstimates(projectId),
      getInvoices(projectId),
      getContracts(projectId),
      getTasks(projectId),
      getProjectCosts(projectId),
      getProjectFiles(projectId),
      getSettings(),
    ])
    setHearings(h)
    if (h.length > 0) setExpanded(new Set([h[0].id]))
    setEstimates(es)
    setInvoices(inv)
    setContracts(cons)
    setTasks(ts)
    setCosts(cs)
    setFiles(fs)
    setStatusConfig({
      neglectedCheckDays: settings.neglectedCheckDays,
      neglectedActionDays: settings.neglectedActionDays,
      profitRateThreshold: settings.profitRateThreshold,
      costOnlyAsCheck: settings.costOnlyAsCheck,
    })
    setDocTaxRate(settings.taxRate)
    setDocInvoiceDueDays(settings.invoiceDueDays)
    if (p.customerId) {
      getCustomer(p.customerId).then((c) => setCustomer(c ?? null))
      getContacts(p.customerId).then((cs) => setContacts(cs))
    }
  }, [projectId, router])

  useEffect(() => {
    setMounted(true)
    load()
  }, [load])

  const toggleHearing = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDeleteHearing = async (id: string) => {
    if (!window.confirm('このヒアリング記録を削除しますか？')) return
    await deleteHearing(id)
    setHearings((prev) => prev.filter((h) => h.id !== id))
    setExpanded((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  const handleTaskSaved = (saved: Task) => {
    const isNew = !tasks.some((t) => t.id === saved.id)
    setTasks((prev) => isNew ? [saved, ...prev] : prev.map((t) => t.id === saved.id ? saved : t))
    setShowTaskModal(false)
    setEditingTask(null)
    if (isNew) {
      createActivity({ projectId, customerId: project?.customerId, type: 'task_created', title: `タスク作成：${saved.title}` })
        .then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    }
  }

  const handleCompleteTask = async (task: Task) => {
    setTaskError('')
    try {
      const updated = await completeTask(task.id)
      if (!updated) { setTaskError('タスクの更新に失敗しました'); return }
      setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t))
      createActivity({ projectId, customerId: project?.customerId, type: 'task_completed', title: `タスク完了：${task.title}` })
        .then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    } catch {
      setTaskError('タスクの更新に失敗しました')
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('このタスクを削除しますか？')) return
    setTaskError('')
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setTaskError('タスクの削除に失敗しました')
    }
  }

  const handleCostSaved = (saved: ProjectCost) => {
    const isNew = !costs.some((c) => c.id === saved.id)
    setCosts((prev) => isNew ? [saved, ...prev] : prev.map((c) => c.id === saved.id ? saved : c))
    setShowCostModal(false)
    setEditingCost(null)
    setCostError('')
    const actType = isNew ? 'cost_added' : 'cost_updated'
    const actTitle = isNew ? `原価追加：${saved.title}` : `原価更新：${saved.title}`
    createActivity({
      projectId, customerId: project?.customerId, type: actType, title: actTitle,
      body: `カテゴリ：${CATEGORY_LABELS[saved.category]}　金額：${saved.amount.toLocaleString()}円`,
    }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
  }

  const handleDeleteCost = async (cost: ProjectCost) => {
    if (!window.confirm('この原価を削除しますか？')) return
    setCostError('')
    try {
      await deleteProjectCost(cost.id)
      setCosts((prev) => prev.filter((c) => c.id !== cost.id))
      createActivity({
        projectId, customerId: project?.customerId, type: 'cost_deleted', title: `原価削除：${cost.title}`,
        body: `カテゴリ：${CATEGORY_LABELS[cost.category]}　金額：${cost.amount.toLocaleString()}円`,
      }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    } catch {
      setCostError('原価の削除に失敗しました')
    }
  }

  const handleFileSaved = (saved: ProjectFile) => {
    const isNew = !files.some((f) => f.id === saved.id)
    setFiles((prev) => isNew ? [saved, ...prev] : prev.map((f) => f.id === saved.id ? saved : f))
    setShowFileModal(false)
    setEditingFile(null)
    setFileError('')
    const actType = isNew ? 'file_added' : 'file_updated'
    const actTitle = isNew ? `ファイル追加：${saved.name}` : `ファイル更新：${saved.name}`
    createActivity({
      projectId, customerId: project?.customerId, type: actType, title: actTitle,
      body: `種別：${FILE_CATEGORY_LABELS[saved.category]}${saved.externalUrl ? `　URL：${saved.externalUrl}` : ''}`,
    }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
  }

  const handleDeleteFile = async (file: ProjectFile) => {
    if (!window.confirm('このファイルを削除しますか？')) return
    setFileError('')
    try {
      await deleteProjectFile(file.id, file.storagePath)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      createActivity({
        projectId, customerId: project?.customerId, type: 'file_deleted', title: `ファイル削除：${file.name}`,
        body: `種別：${FILE_CATEGORY_LABELS[file.category]}`,
      }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    } catch {
      setFileError('ファイルの削除に失敗しました')
    }
  }

  const handleOpenFile = async (file: ProjectFile) => {
    if (file.externalUrl) { window.open(file.externalUrl, '_blank', 'noopener,noreferrer'); return }
    if (file.publicUrl) { window.open(file.publicUrl, '_blank', 'noopener,noreferrer'); return }
    if (file.storagePath) {
      setOpeningFileId(file.id)
      try {
        const url = await getProjectFileUrl(file.storagePath)
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
        else setFileError('ファイルURLの取得に失敗しました')
      } catch {
        setFileError('ファイルURLの取得に失敗しました')
      } finally {
        setOpeningFileId(null)
      }
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatus
    const prevStatus = project?.status
    await updateProjectStatus(projectId, newStatus)
    setProject((prev) => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : prev)
    createActivity({ projectId, customerId: project?.customerId, type: 'status_changed', title: `ステータス変更：${prevStatus} → ${newStatus}` })
      .then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
  }

  const handleSaveEdit = (updated: Project) => {
    setProject(updated)
    setShowEditModal(false)
  }

  const handleDeleteProject = async () => {
    if (!window.confirm('この案件を削除しますか？\nヒアリング記録・見積書・請求書・契約書もすべて削除されます。')) return
    await deleteProject(projectId)
    router.push('/projects')
  }

  const handleSaveHearing = async (id: string) => {
    if (!editingMemo.trim() || !editingDate) return
    await updateHearing(id, editingMemo.trim(), editingDate)
    setHearings((prev) =>
      prev
        .map((h) => h.id === id ? { ...h, memo: editingMemo.trim(), date: editingDate } : h)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
    setEditingHearingId(null)
  }

  const handleDeleteEstimate = async (id: string) => {
    if (!window.confirm('この見積書を削除しますか？')) return
    await deleteEstimate(id)
    setEstimates((prev) => prev.filter((e) => e.id !== id))
  }

  const handleEstimateSaved = (saved: Estimate) => {
    const isNew = !estimates.some((e) => e.id === saved.id)
    setEstimates((prev) => isNew ? [saved, ...prev] : prev.map((e) => e.id === saved.id ? saved : e))
    setShowEstimateModal(false)
    setEditingEstimate(null)
    createActivity({
      projectId, customerId: project?.customerId,
      type: isNew ? 'estimate_created' : 'estimate_updated',
      title: `${isNew ? '見積書作成' : '見積書更新'}：${saved.title}`,
      body: `合計：${saved.total.toLocaleString()}円`,
    }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('この請求書を削除しますか？')) return
    await deleteInvoice(id)
    setInvoices((prev) => prev.filter((i) => i.id !== id))
  }

  const handleInvoiceSaved = (saved: Invoice) => {
    const isNew = !invoices.some((i) => i.id === saved.id)
    setInvoices((prev) => isNew ? [saved, ...prev] : prev.map((i) => i.id === saved.id ? saved : i))
    setShowInvoiceModal(false)
    setEditingInvoice(null)
    setCreatingFromEstimate(null)
    if (isNew) {
      createActivity({ projectId, customerId: project?.customerId, type: 'invoice_created', title: `請求書作成：${saved.title}`, body: `合計：${saved.total.toLocaleString()}円` })
        .then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    }
  }

  const handleEstimateToInvoiceSaved = (saved: Invoice) => {
    setInvoices((prev) => [saved, ...prev])
    setEstimateToInvoiceTarget(null)
  }

  const handleDeleteContract = async (id: string) => {
    if (!window.confirm('この契約情報を削除しますか？')) return
    await deleteContract(id)
    setContracts((prev) => prev.filter((c) => c.id !== id))
  }

  const handleContractSaved = (saved: Contract) => {
    const existing = contracts.find((c) => c.id === saved.id)
    const isNew = !existing
    const wasSigned = !isNew && existing?.status !== 'signed' && saved.status === 'signed'
    setContracts((prev) => isNew ? [saved, ...prev] : prev.map((c) => c.id === saved.id ? saved : c))
    setShowContractModal(false)
    setEditingContract(null)
    const type = wasSigned ? 'contract_signed' : isNew ? 'contract_created' : null
    if (type) {
      createActivity({ projectId, customerId: project?.customerId, type, title: `${type === 'contract_signed' ? '契約締結' : '契約書作成'}：${saved.title}` })
        .then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    }
  }

  const handlePaymentSaved = (saved: Invoice) => {
    const prev = invoices.find((i) => i.id === saved.id)
    const isEdit = !!prev?.paidAt
    setInvoices((prev) => prev.map((i) => i.id === saved.id ? saved : i))
    setShowPaymentModal(false)
    setPaymentTargetInvoice(null)
    createActivity({
      projectId, customerId: project?.customerId,
      type: isEdit ? 'payment_updated' : 'payment_received',
      title: `${isEdit ? '入金修正' : '入金記録'}：${saved.title}`,
      body: `金額：${(saved.paidAmount ?? 0).toLocaleString()}円`,
    }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
  }

  const handleCancelPayment = async (inv: Invoice) => {
    if (!window.confirm('入金記録を取り消しますか？\nステータスが「送付済み」または「期限超過」に戻ります。')) return
    try {
      const saved = await cancelPayment(inv.id)
      if (!saved) throw new Error('取り消しに失敗しました')
      setInvoices((prev) => prev.map((i) => i.id === saved.id ? saved : i))
    } catch (err) {
      alert(err instanceof Error ? err.message : '入金取り消しに失敗しました')
    }
  }

  const handleMarkAsSent = async (id: string) => {
    try {
      await updateInvoiceStatus(id, 'sent' as InvoiceStatus)
      const inv = invoices.find((i) => i.id === id)
      setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: 'sent' as InvoiceStatus } : i))
      if (inv) {
        createActivity({ projectId, customerId: project?.customerId, type: 'invoice_sent', title: `請求書送付：${inv.title}`, body: `合計：${inv.total.toLocaleString()}円` })
          .then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '送付済みへの変更に失敗しました')
    }
  }

  if (!mounted || !project) return null

  const visibleHearings = showAllHearings ? hearings : hearings.slice(0, 3)
  const hasOverdueInvoice = invoices.some((inv) => isInvoiceOverdue(inv))
  const hasSignedContract = contracts.some((c) => c.status === 'signed' || c.status === 'completed')

  const totalBilled = invoices.filter((inv) => inv.status !== 'canceled').reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0)
  const totalCost = costs.reduce((sum, c) => sum + c.amount, 0)
  const totalOutsourcing = costs.filter(c => c.category === 'outsourcing').reduce((sum, c) => sum + c.amount, 0)
  const revenueBase = totalPaid > 0 ? totalPaid : totalBilled
  const grossProfit = revenueBase - totalCost
  const profitRate = revenueBase > 0 ? Math.round((grossProfit / revenueBase) * 100) : null
  const costOnlyMode = revenueBase === 0 && totalCost > 0

  const pendingTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const aOv = isTaskOverdue(a), bOv = isTaskOverdue(b)
      if (aOv && !bOv) return -1
      if (!aOv && bOv) return 1
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
      const p: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })
  const doneTasks = tasks.filter((t) => t.status === 'done')

  const overdueTaskList = tasks.filter(isTaskOverdue)
  const statusCheck = checkProjectStatus(project, invoices, overdueTaskList, costs, statusConfig)

  const tabCount: Partial<Record<Tab, number>> = {
    tasks: pendingTasks.length || undefined,
    meetings: hearings.length || undefined,
    billing: (estimates.length + invoices.length) || undefined,
    contracts: contracts.length || undefined,
    files: files.length || undefined,
  }

  // ── 請求進捗サマリー計算 ──
  const totalEstimated = estimates
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.total, 0)
  const unbilledAmount  = Math.max(0, totalEstimated - totalBilled)
  const unpaidAmount    = Math.max(0, totalBilled - totalPaid)
  const billingProgressPct = totalEstimated > 0
    ? Math.min(100, Math.round((totalBilled / totalEstimated) * 100))
    : 0

  // ── 利益タブ用：売上予定ベース計算 ──
  const revenueForProfit  = totalEstimated > 0 ? totalEstimated : revenueBase
  const grossProfitEst    = revenueForProfit - totalCost
  const profitRateEst     = revenueForProfit > 0
    ? Math.round((grossProfitEst / revenueForProfit) * 100)
    : null
  const costOnlyModeEst   = revenueForProfit === 0 && totalCost > 0
  // 進捗バー用パーセンテージ（売上予定を基準 100%）
  const billedPct  = revenueForProfit > 0 ? Math.min(100, Math.round((totalBilled  / revenueForProfit) * 100)) : 0
  const paidPct    = revenueForProfit > 0 ? Math.min(100, Math.round((totalPaid    / revenueForProfit) * 100)) : 0
  const costPct    = revenueForProfit > 0 ? Math.min(100, Math.round((totalCost    / revenueForProfit) * 100)) : 0

  // 請求フロー：現在到達しているステップ番号（0=未着手）
  const billingStep = (() => {
    if (invoices.some(i => i.status === 'paid')) return 6
    if (invoices.some(i => i.status === 'sent')) return 5
    if (invoices.length > 0) return 4
    if (estimates.some(e => e.status === 'approved')) return 3
    if (estimates.some(e => e.status === 'sent')) return 2
    if (estimates.length > 0) return 1
    return 0
  })()

  // フロービューで中心に表示する見積書・請求書
  const primaryEstimate = estimates.find(e => e.status === 'approved') ?? estimates[0] ?? null
  const primaryInvoice = primaryEstimate
    ? (invoices.find(i => i.estimateId === primaryEstimate.id) ?? null)
    : invoices[0] ?? null
  const primaryAlreadyInvoiced = primaryEstimate
    ? invoices.some(i => i.estimateId === primaryEstimate.id)
    : false

  // 見積書ごとの請求済み小計と残り割合を返す
  const getInvoicedSubtotal = (est: Estimate) =>
    invoices.filter(i => i.estimateId === est.id).reduce((s, i) => s + i.subtotal, 0)
  const getRemainingPct = (est: Estimate): number => {
    if (est.subtotal <= 0) return 0
    return Math.max(0, Math.round(((est.subtotal - getInvoicedSubtotal(est)) / est.subtotal) * 100))
  }
  const getRemainingPctOption = (pct: number): { pct: '50-final' | 'custom'; customPct: number } =>
    pct === 50 ? { pct: '50-final', customPct: 50 } : { pct: 'custom', customPct: pct }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== HEADER ========== */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* top bar: back + actions */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              案件一覧
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="案件を編集"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteProject}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                title="案件を削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* project name + status */}
          <div className="flex items-center gap-3 flex-wrap pb-2">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
            <div className="relative inline-flex items-center">
              <select
                value={project.status}
                onChange={handleStatusChange}
                className={`text-xs font-medium pl-2.5 pr-6 py-0.5 rounded-full border-0 cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-blue-400 ${STATUS_CLS[project.status]}`}
              >
                <option value="商談中">商談中</option>
                <option value="提案済">提案済</option>
                <option value="受注">受注</option>
                <option value="進行中">進行中</option>
                <option value="完了">完了</option>
                <option value="失注">失注</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
            </div>
            {statusCheck.level !== 'ok' && <ProjectStatusBadge check={statusCheck} showReasons />}
          </div>

          {/* metadata row */}
          <div className="flex items-center gap-x-4 gap-y-1 pb-3 text-xs text-gray-500 flex-wrap">
            {customer ? (
              <Link href={`/customers/${customer.id}`} className="hover:text-blue-600 hover:underline font-medium">
                {customer.name}
              </Link>
            ) : project.clientName ? (
              <span className="font-medium">{project.clientName}</span>
            ) : null}
            {customer?.industry && <span className="text-gray-400">{customer.industry}</span>}
            <span>作成 {new Date(project.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
            {project.budget && <span>予算 {formatCurrency(project.budget)}</span>}
            <span className="text-gray-400">最終更新 {formatRelativeDate(project.updatedAt)}</span>
          </div>
        </div>

        {/* tab bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-gray-100">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => {
              const count = tabCount[tab.id]
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ========== MAIN ========== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ===== 概要タブ ===== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* 顧客情報 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">顧客情報</span>
                </div>
                {customer && (
                  <Link href={`/customers/${customer.id}`} className="text-xs text-blue-600 hover:underline">
                    詳細 →
                  </Link>
                )}
              </div>
              {customer ? (
                <div className="space-y-1.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                    {customer.industry && <p className="text-xs text-gray-400 mt-0.5">{customer.industry}</p>}
                  </div>
                  {contacts[0] && (
                    <div className="pt-1.5 border-t border-gray-100 space-y-1">
                      <p className="text-xs font-medium text-gray-700">
                        {contacts[0].name}
                        {contacts[0].role && <span className="font-normal text-gray-400 ml-1">/ {contacts[0].role}</span>}
                      </p>
                      {contacts[0].email && (
                        <p className="text-xs text-gray-400 truncate">{contacts[0].email}</p>
                      )}
                      {contacts[0].phone && (
                        <p className="text-xs text-gray-400">{contacts[0].phone}</p>
                      )}
                    </div>
                  )}
                  {customer.notes && (
                    <p className="text-xs text-gray-400 pt-1.5 border-t border-gray-100 line-clamp-2">{customer.notes}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 font-medium">{project.clientName}</p>
                  <p className="text-xs text-gray-400 mt-1">顧客マスタ未登録</p>
                </div>
              )}
            </div>

            {/* 打ち合わせメモ */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">打ち合わせ</span>
                </div>
                <div className="flex items-center gap-2">
                  {hearings.length > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{hearings.length}件</span>
                  )}
                  <button
                    onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
                    className="text-blue-600 hover:text-blue-700"
                    title="ヒアリングを追加"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {hearings.length === 0 ? (
                <div>
                  <p className="text-sm text-gray-400">まだ記録がありません</p>
                  <button
                    onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    記録を追加 →
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {hearings.slice(0, 3).map((h, i) => (
                    <div key={h.id} className={i > 0 ? 'pt-2.5 border-t border-gray-100' : ''}>
                      <p className="text-xs text-gray-400 mb-0.5">{formatYMD(h.date)}</p>
                      <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                        {getHearingPreview(h.memo)}
                      </p>
                    </div>
                  ))}
                  {hearings.length > 3 && (
                    <button
                      onClick={() => setActiveTab('meetings')}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      他 {hearings.length - 3}件を見る →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 見積書 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">見積書</span>
                </div>
                <div className="flex items-center gap-2">
                  {estimates.length > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{estimates.length}件</span>
                  )}
                  <button
                    onClick={() => { setEditingEstimate(null); setShowEstimateModal(true) }}
                    className="text-blue-600 hover:text-blue-700"
                    title="見積書を作成"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {estimates.length === 0 ? (
                <div>
                  <p className="text-sm text-gray-400">まだ作成されていません</p>
                  <button
                    onClick={() => { setEditingEstimate(null); setShowEstimateModal(true) }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    作成する →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {estimates.slice(0, 2).map((est, i) => (
                    <div key={est.id} className={i > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs text-gray-400 font-mono">{formatEstimateNumber(est.id, est.createdAt)}</p>
                        <Link
                          href={`/projects/${projectId}/estimates/${est.id}/preview`}
                          className="p-0.5 text-gray-300 hover:text-blue-600 transition-colors shrink-0"
                          title="プレビュー"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <EstimateStatusBadge status={est.status} />
                      </div>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(est.total)}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{est.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        作成 {formatYMD(est.createdAt.slice(0, 10))}
                      </p>
                      {(() => {
                        const alreadyInvoiced = invoices.some((i) => i.estimateId === est.id)
                        if (est.status === 'approved') {
                          return alreadyInvoiced ? (
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <Check className="w-3 h-3" />
                              請求書作成済み
                            </div>
                          ) : (
                            <button
                              onClick={() => setEstimateToInvoiceTarget({ estimate: est })}
                              className="mt-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                              <FilePlus className="w-3 h-3" />
                              請求書を作成 →
                            </button>
                          )
                        }
                        return null
                      })()}
                    </div>
                  ))}
                  {estimates.length > 2 && (
                    <button
                      onClick={() => setActiveTab('billing')}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      他 {estimates.length - 2}件 →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 請求書 */}
            <div className={`bg-white border rounded-xl p-4 ${hasOverdueInvoice ? 'border-red-200' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">請求書</span>
                </div>
                <div className="flex items-center gap-2">
                  {invoices.length > 0 && (
                    <span className={`text-xs rounded-full px-2 py-0.5 ${hasOverdueInvoice ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {invoices.length}件{hasOverdueInvoice ? ' · 超過あり' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => { setEditingInvoice(null); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
                    className="text-blue-600 hover:text-blue-700"
                    title="請求書を作成"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {invoices.length === 0 ? (
                <div>
                  <p className="text-sm text-gray-400">まだ作成されていません</p>
                  <button
                    onClick={() => { setEditingInvoice(null); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    作成する →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.slice(0, 2).map((inv, i) => (
                    <div key={inv.id} className={i > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs text-gray-400 font-mono">{formatInvoiceNumber(inv.id, inv.createdAt)}</p>
                        <Link
                          href={`/projects/${projectId}/invoices/${inv.id}/preview`}
                          className="p-0.5 text-gray-300 hover:text-blue-600 transition-colors shrink-0"
                          title="プレビュー"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <InvoiceStatusBadge status={isInvoiceOverdue(inv) ? 'overdue' : inv.status} />
                      </div>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(inv.total)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        請求日 {formatYMD(inv.createdAt.slice(0, 10))}
                      </p>
                      {inv.estimateId && (() => {
                        const relEst = estimates.find((e) => e.id === inv.estimateId)
                        return (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100">元見積</span>
                            <span className="text-xs text-gray-400 font-mono">
                              {relEst ? formatEstimateNumber(relEst.id, relEst.createdAt) : '—'}
                            </span>
                          </div>
                        )
                      })()}
                      {inv.paidAt && (
                        <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                          入金 {formatYMD(inv.paidAt)}
                        </p>
                      )}
                      {inv.dueDate && inv.status !== 'paid' && (
                        <p className={`text-xs mt-0.5 ${isInvoiceOverdue(inv) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          支払期限 {formatYMD(inv.dueDate)}
                        </p>
                      )}
                    </div>
                  ))}
                  {invoices.length > 2 && (
                    <button onClick={() => setActiveTab('billing')} className="text-xs text-gray-400 hover:text-gray-600">
                      他 {invoices.length - 2}件 →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 契約書 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <ScrollText className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">契約書</span>
                </div>
                <div className="flex items-center gap-2">
                  {contracts.length > 0 && (
                    <span className={`text-xs rounded-full px-2 py-0.5 ${hasSignedContract ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-600'}`}>
                      {hasSignedContract ? '締結済' : `${contracts.length}件`}
                    </span>
                  )}
                  <button
                    onClick={() => { setEditingContract(null); setShowContractModal(true) }}
                    className="text-blue-600 hover:text-blue-700"
                    title="契約書を作成"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {contracts.length === 0 ? (
                <div>
                  <p className="text-sm text-gray-400">まだ登録されていません</p>
                  <button
                    onClick={() => { setEditingContract(null); setShowContractModal(true) }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    登録する →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.slice(0, 2).map((con, i) => (
                    <div key={con.id} className={i > 0 ? 'pt-3 border-t border-gray-100' : ''}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <ContractStatusBadge status={con.status} />
                        <Link
                          href={`/projects/${projectId}/contracts/${con.id}/preview`}
                          className="p-0.5 text-gray-300 hover:text-blue-600 transition-colors shrink-0"
                          title="プレビュー"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <p className="text-xs text-gray-700 truncate font-medium">{con.title}</p>
                      {con.amount != null && (
                        <p className="text-base font-bold text-gray-900 mt-0.5">{formatCurrency(con.amount)}</p>
                      )}
                      {con.contractDate && (
                        <p className="text-xs text-gray-400 mt-0.5">契約日 {formatYMD(con.contractDate)}</p>
                      )}
                      {(con.startDate || con.endDate) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {con.startDate ? formatYMD(con.startDate) : '未定'} 〜 {con.endDate ? formatYMD(con.endDate) : '未定'}
                        </p>
                      )}
                    </div>
                  ))}
                  {contracts.length > 2 && (
                    <button onClick={() => setActiveTab('contracts')} className="text-xs text-gray-400 hover:text-gray-600">
                      他 {contracts.length - 2}件 →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 利益情報 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">利益情報</span>
                </div>
                <button onClick={() => setActiveTab('profit')} className="text-xs text-gray-400 hover:text-gray-600">
                  詳細 →
                </button>
              </div>
              <div className="space-y-1.5">
                {totalEstimated > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">売上予定</span>
                    <span className="font-medium text-blue-600">{formatCurrency(totalEstimated)}</span>
                  </div>
                )}
                {totalBilled > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">請求済額</span>
                    <span className="font-medium text-violet-600">{formatCurrency(totalBilled)}</span>
                  </div>
                )}
                {totalPaid > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">入金済額</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(totalPaid)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">原価</span>
                  <span className={`font-medium ${totalCost > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{formatCurrency(totalCost)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">粗利</span>
                    {costOnlyModeEst ? (
                      <span className="text-xs font-medium text-amber-600">原価先行</span>
                    ) : (
                      <span className={`text-sm font-bold ${grossProfitEst > 0 ? 'text-emerald-600' : grossProfitEst < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                        {formatCurrency(grossProfitEst)}
                      </span>
                    )}
                  </div>
                  {profitRateEst !== null && !costOnlyModeEst && (
                    <>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${grossProfitEst >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(Math.max(profitRateEst, 0), 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">利益率 <span className={`font-semibold ${grossProfitEst >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{profitRateEst}%</span></p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 請求進捗 */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">請求進捗</span>
                </div>
                <button onClick={() => setActiveTab('billing')} className="text-xs text-gray-400 hover:text-gray-600">
                  詳細 →
                </button>
              </div>
              {totalEstimated === 0 && totalBilled === 0 ? (
                <p className="text-sm text-gray-400">見積書・請求書がありません</p>
              ) : (
                <div className="space-y-2">
                  {/* プログレスバー */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">請求進捗率</span>
                      <span className={`text-xs font-bold ${
                        billingProgressPct === 100 ? 'text-emerald-600' :
                        billingProgressPct > 0 ? 'text-blue-600' : 'text-gray-400'
                      }`}>{billingProgressPct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          billingProgressPct === 100 ? 'bg-emerald-400' :
                          billingProgressPct > 0 ? 'bg-blue-400' : 'bg-gray-200'
                        }`}
                        style={{ width: `${billingProgressPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-1 space-y-1.5">
                    {totalEstimated > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">総見積額</span>
                        <span className="font-medium text-gray-700">{formatCurrency(totalEstimated)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">請求済額</span>
                      <span className="font-medium text-gray-700">{formatCurrency(totalBilled)}</span>
                    </div>
                    {unbilledAmount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-orange-500">未請求額</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(unbilledAmount)}</span>
                      </div>
                    )}
                    {totalPaid > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">入金済額</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(totalPaid)}</span>
                      </div>
                    )}
                    {unpaidAmount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-500">未入金額</span>
                        <span className="font-semibold text-red-600">{formatCurrency(unpaidAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* アクティビティ (col-span-2) */}
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-sky-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">活動履歴</span>
                </div>
                <button
                  onClick={() => setShowActivityModal(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  記録
                </button>
              </div>
              <ActivityFeed projectId={projectId} refreshKey={activityRefreshKey} />
            </div>

            {/* 関連タスク */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                    <ListTodo className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">タスク</span>
                </div>
                <div className="flex items-center gap-2">
                  {pendingTasks.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">{pendingTasks.length}</span>
                  )}
                  <button
                    onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
                    className="text-blue-600 hover:text-blue-700"
                    title="タスクを追加"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {pendingTasks.length === 0 ? (
                <div>
                  <p className="text-sm text-gray-400">未完了のタスクはありません</p>
                  <button
                    onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    追加する →
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-start gap-2">
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="mt-1 flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors"
                        title="完了にする"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap mb-0.5">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            task.priority === 'high'   ? 'bg-red-100 text-red-600' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                         'bg-gray-100 text-gray-500'
                          }`}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </span>
                          {task.status === 'in_progress' && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">進行中</span>
                          )}
                        </div>
                        <p className={`text-xs leading-snug ${isTaskOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className={`text-xs mt-0.5 ${isTaskOverdue(task) ? 'text-red-400' : 'text-gray-400'}`}>
                            {formatYMD(task.dueDate)}{isTaskOverdue(task) ? '（超過）' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length > 3 && (
                    <button onClick={() => setActiveTab('tasks')} className="text-xs text-gray-400 hover:text-gray-600">
                      他 {pendingTasks.length - 3}件 →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== タスクタブ ===== */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">タスク</h2>
              <button
                onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                タスクを追加
              </button>
            </div>
            {taskError && <p className="text-sm text-red-500 mb-3">{taskError}</p>}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {pendingTasks.length === 0 && doneTasks.length === 0 ? (
                <p className="text-sm text-gray-400 p-4">タスクがありません</p>
              ) : (
                <>
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="px-4 py-3 flex items-start gap-3">
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors"
                        title="完了にする"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            task.priority === 'high' ? 'bg-red-100 text-red-600' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </span>
                          {task.status === 'in_progress' && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">進行中</span>
                          )}
                          {task.dueDate && (
                            <span className={`text-xs ${isTaskOverdue(task) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              期限 {formatYMD(task.dueDate)}{isTaskOverdue(task) ? '（超過）' : ''}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-0.5 ${isTaskOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-800'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditingTask(task); setShowTaskModal(true) }}
                          className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                          title="編集"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {doneTasks.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowDoneTasks(!showDoneTasks)}
                        className="w-full flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-4 py-2.5 transition-colors"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDoneTasks ? 'rotate-180' : ''}`} />
                        完了済み（{doneTasks.length}件）
                      </button>
                      {showDoneTasks && doneTasks.map((task) => (
                        <div key={task.id} className="px-4 py-2.5 flex items-center gap-3 bg-gray-50">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <p className="text-sm text-gray-400 line-through flex-1 truncate">{task.title}</p>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== 打ち合わせタブ ===== */}
        {activeTab === 'meetings' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">ヒアリング記録</h2>
              <button
                onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                追加
              </button>
            </div>

            {hearings.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-400">まだヒアリング記録がありません</p>
                <button
                  onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
                  className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  最初のヒアリングを記録する →
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {visibleHearings.map((h, i) => (
                    <div key={h.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleHearing(h.id)}
                        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-gray-500">
                              第{hearings.length - i}回ヒアリング
                            </span>
                            <span className="text-xs text-gray-400">{formatFullDate(h.date)}</span>
                          </div>
                          {!expanded.has(h.id) && (
                            <p className="text-sm text-gray-600 line-clamp-1">{getHearingPreview(h.memo)}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {expanded.has(h.id) ? '閉じる' : '開く'}
                        </span>
                      </button>
                      {expanded.has(h.id) && (
                        <div className="px-4 pb-4 pl-9">
                          {editingHearingId === h.id ? (
                            <>
                              <div className="mb-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">ヒアリング日</label>
                                <input
                                  type="date"
                                  value={editingDate}
                                  onChange={(e) => setEditingDate(e.target.value)}
                                  required
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <textarea
                                value={editingMemo}
                                onChange={(e) => setEditingMemo(e.target.value)}
                                rows={8}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
                                autoFocus
                              />
                              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                  onClick={() => setEditingHearingId(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  キャンセル
                                </button>
                                <button
                                  onClick={() => handleSaveHearing(h.id)}
                                  disabled={!editingMemo.trim() || !editingDate}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-40"
                                >
                                  保存
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                {h.memo}
                              </pre>
                              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                  onClick={() => { setEditingHearingId(h.id); setEditingMemo(h.memo); setEditingDate(h.date) }}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  編集
                                </button>
                                <button
                                  onClick={() => handleDeleteHearing(h.id)}
                                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  削除
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {hearings.length > 3 && (
                  <button
                    onClick={() => setShowAllHearings(!showAllHearings)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors mt-2"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllHearings ? 'rotate-180' : ''}`} />
                    {showAllHearings ? '折りたたむ' : `過去のヒアリングを見る（${hearings.length - 3}件）`}
                  </button>
                )}
                <div className="flex items-center gap-2.5 mt-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                  <p className="text-xs text-gray-400">案件登録 · {formatFullDate(project.createdAt)}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== 見積・請求タブ（変換フロービュー） ===== */}
        {activeTab === 'billing' && (
          <div className="space-y-5">

            {/* ── ⓪ 請求進捗サマリーカード ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">請求進捗サマリー</h3>
                {totalEstimated > 0 && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    billingProgressPct === 100
                      ? 'bg-emerald-100 text-emerald-700'
                      : billingProgressPct > 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {billingProgressPct}%
                  </span>
                )}
              </div>

              {/* プログレスバー */}
              {totalEstimated > 0 && (
                <div className="mb-4">
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        billingProgressPct === 100
                          ? 'bg-emerald-400'
                          : billingProgressPct > 0
                          ? 'bg-blue-400'
                          : 'bg-gray-200'
                      }`}
                      style={{ width: `${billingProgressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">0%</span>
                    <span className="text-[10px] text-gray-400">請求完了 100%</span>
                  </div>
                </div>
              )}

              {/* 6指標グリッド */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400">総見積額</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    {totalEstimated > 0 ? formatCurrency(totalEstimated) : <span className="text-gray-300">—</span>}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400">請求済額</p>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    {totalBilled > 0 ? formatCurrency(totalBilled) : <span className="text-gray-300">—</span>}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className={`text-[10px] ${unbilledAmount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>未請求額</p>
                  <p className={`text-sm font-bold tabular-nums ${unbilledAmount > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                    {totalEstimated > 0 ? formatCurrency(unbilledAmount) : '—'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400">入金済額</p>
                  <p className={`text-sm font-bold tabular-nums ${totalPaid > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                    {totalBilled > 0 ? formatCurrency(totalPaid) : '—'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className={`text-[10px] ${unpaidAmount > 0 ? 'text-red-500' : 'text-gray-400'}`}>未入金額</p>
                  <p className={`text-sm font-bold tabular-nums ${unpaidAmount > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                    {totalBilled > 0 ? formatCurrency(unpaidAmount) : '—'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400">進捗率</p>
                  <p className={`text-sm font-bold tabular-nums ${
                    billingProgressPct === 100 ? 'text-emerald-600' :
                    billingProgressPct > 0 ? 'text-blue-600' : 'text-gray-300'
                  }`}>
                    {totalEstimated > 0 ? `${billingProgressPct}%` : '—'}
                  </p>
                </div>
              </div>

              {/* 警告バッジ行 */}
              {(unbilledAmount > 0 || unpaidAmount > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {unbilledAmount > 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                      未請求 {formatCurrency(unbilledAmount)} あり
                    </span>
                  )}
                  {unpaidAmount > 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                      未入金 {formatCurrency(unpaidAmount)} あり
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── ① ステップインジケーター ── */}
            {(() => {
              const steps = [
                { n: 1, label: '見積作成' },
                { n: 2, label: '承認待ち' },
                { n: 3, label: '承認済' },
                { n: 4, label: '請求書作成' },
                { n: 5, label: '送付済' },
                { n: 6, label: '入金確認' },
              ]
              const progressPct = billingStep > 0 ? ((billingStep - 1) / 5) * 100 : 0
              return (
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <div className="relative flex items-start justify-between">
                    {/* コネクターライン（背景） */}
                    <div className="absolute top-3.5 left-[14px] right-[14px] h-0.5 bg-gray-200" />
                    {/* コネクターライン（進捗） */}
                    <div
                      className="absolute top-3.5 left-[14px] h-0.5 bg-emerald-400 transition-all duration-500"
                      style={{ width: `calc(${progressPct}% * (100% - 28px) / 100)` }}
                    />
                    {steps.map((step) => (
                      <div key={step.n} className="relative z-10 flex flex-col items-center" style={{ width: '16.666%' }}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
                          step.n < billingStep
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : step.n === billingStep
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                            : step.n === billingStep + 1
                            ? 'bg-white border-emerald-300 text-emerald-500'
                            : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          {step.n < billingStep ? <Check className="w-3 h-3" /> : step.n}
                        </div>
                        <span className={`mt-1.5 text-[9px] font-medium text-center leading-tight ${
                          step.n <= billingStep ? 'text-emerald-600' : step.n === billingStep + 1 ? 'text-gray-500' : 'text-gray-300'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── ② メイン変換フロービュー ── */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_72px_1fr] items-start gap-3 md:gap-0">

              {/* ═══ 左：見積書ドキュメントカード ═══ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center">
                      <FileText className="w-3 h-3 text-orange-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">見積書</span>
                    {estimates.length > 1 && (
                      <span className="text-[10px] text-gray-400">{estimates.length}件</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setEditingEstimate(null); setShowEstimateModal(true) }}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3 h-3" />
                    新規作成
                  </button>
                </div>

                {!primaryEstimate ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center px-6 py-10">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-orange-200" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">見積書がありません</p>
                    <p className="text-xs text-gray-400 mb-4">最初の見積書を作成してください</p>
                    <button
                      onClick={() => { setEditingEstimate(null); setShowEstimateModal(true) }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      見積書を作成
                    </button>
                  </div>
                ) : (
                  <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${
                    primaryEstimate.status === 'approved' && !primaryAlreadyInvoiced
                      ? 'border-emerald-200'
                      : 'border-gray-200'
                  }`}>
                    {/* カードヘッダー */}
                    <div className="bg-orange-50 border-b border-orange-100 px-4 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <EstimateStatusBadge status={primaryEstimate.status} />
                        <span className="text-[10px] text-orange-400 font-mono truncate">
                          {formatEstimateNumber(primaryEstimate.id, primaryEstimate.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Link
                          href={`/projects/${projectId}/estimates/${primaryEstimate.id}/preview`}
                          className="p-1 rounded hover:bg-orange-100 text-orange-300 hover:text-orange-600 transition-colors"
                          title="プレビュー"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setEditingEstimate(primaryEstimate); setShowEstimateModal(true) }}
                          className="p-1 rounded hover:bg-orange-100 text-orange-300 hover:text-orange-600 transition-colors"
                          title="編集"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEstimate(primaryEstimate.id)}
                          className="p-1 rounded hover:bg-red-50 text-orange-300 hover:text-red-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* カードボディ */}
                    <div className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{primaryEstimate.title}</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(primaryEstimate.total)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        小計 {formatCurrency(primaryEstimate.subtotal)}　+　消費税 {formatCurrency(primaryEstimate.tax)}
                      </p>
                      {/* 明細テーブル */}
                      {primaryEstimate.items.length > 0 && (
                        <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 px-3 py-1.5 flex items-center justify-between border-b border-gray-100">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">品目</span>
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">金額</span>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {primaryEstimate.items.slice(0, 5).map((item, idx) => (
                              <div key={idx} className="px-3 py-2 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-700 truncate">{item.name}</span>
                                <span className="text-xs text-gray-600 font-medium shrink-0 tabular-nums">
                                  {formatCurrency(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                            {primaryEstimate.items.length > 5 && (
                              <div className="px-3 py-1.5 text-[10px] text-gray-400">
                                … 他 {primaryEstimate.items.length - 5}行
                              </div>
                            )}
                          </div>
                          <div className="border-t border-gray-200 bg-gray-50 divide-y divide-gray-100">
                            <div className="px-3 py-1.5 flex justify-between">
                              <span className="text-[10px] text-gray-500">小計</span>
                              <span className="text-[10px] text-gray-600 tabular-nums">{formatCurrency(primaryEstimate.subtotal)}</span>
                            </div>
                            <div className="px-3 py-1.5 flex justify-between">
                              <span className="text-[10px] text-gray-500">消費税</span>
                              <span className="text-[10px] text-gray-600 tabular-nums">{formatCurrency(primaryEstimate.tax)}</span>
                            </div>
                            <div className="px-3 py-2.5 flex justify-between bg-white">
                              <span className="text-xs font-bold text-gray-800">合計（税込）</span>
                              <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(primaryEstimate.total)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-2">
                        作成日 {formatYMD(primaryEstimate.createdAt.slice(0, 10))}
                      </p>
                    </div>
                    {/* CTA */}
                    {primaryEstimate.status === 'approved' && (
                      <div className="px-4 pb-4">
                        {(() => {
                          const remPct = getRemainingPct(primaryEstimate)
                          if (!primaryAlreadyInvoiced) {
                            return (
                              <button
                                onClick={() => setEstimateToInvoiceTarget({ estimate: primaryEstimate })}
                                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-200"
                              >
                                <FilePlus className="w-4 h-4" />
                                この見積から請求書を作成
                              </button>
                            )
                          }
                          if (remPct > 0) {
                            const { pct, customPct } = getRemainingPctOption(remPct)
                            return (
                              <button
                                onClick={() => setEstimateToInvoiceTarget({ estimate: primaryEstimate, initialPct: pct, initialCustomPct: customPct })}
                                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm shadow-violet-200"
                              >
                                <FilePlus className="w-4 h-4" />
                                残り{remPct}%の請求書を作成
                              </button>
                            )
                          }
                          return (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 py-1">
                              <Check className="w-3.5 h-3.5" />
                              全額請求済み
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* 他の見積書 */}
                {estimates.length > 1 && (
                  <div className="mt-2 space-y-1">
                    {estimates.slice(1).map((est) => {
                      const remPct = getRemainingPct(est)
                      return (
                        <div key={est.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                          <EstimateStatusBadge status={est.status} />
                          <span className="text-xs text-gray-600 truncate flex-1">{est.title}</span>
                          <span className="text-xs font-medium text-gray-700 shrink-0 tabular-nums">{formatCurrency(est.total)}</span>
                          {est.status === 'approved' && remPct > 0 && (
                            <button
                              onClick={() => {
                                const hasAny = invoices.some(i => i.estimateId === est.id)
                                if (hasAny) {
                                  const { pct, customPct } = getRemainingPctOption(remPct)
                                  setEstimateToInvoiceTarget({ estimate: est, initialPct: pct, initialCustomPct: customPct })
                                } else {
                                  setEstimateToInvoiceTarget({ estimate: est })
                                }
                              }}
                              className="p-1 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                              title={invoices.some(i => i.estimateId === est.id) ? `残り${remPct}%の請求書を作成` : '請求書を作成'}
                            >
                              <FilePlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link
                            href={`/projects/${projectId}/estimates/${est.id}/preview`}
                            className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="プレビュー"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => { setEditingEstimate(est); setShowEstimateModal(true) }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="編集"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEstimate(est.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ═══ 中央：変換アロー ═══ */}
              <div className="flex md:flex-col items-center justify-center py-3 md:py-0 md:pt-16">
                {primaryEstimate?.status === 'approved' && primaryEstimate && (() => {
                  const remPct = getRemainingPct(primaryEstimate)
                  if (remPct === 0) return (
                    <div className="flex md:flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-white rotate-90 md:rotate-0" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium ml-2 md:ml-0 md:mt-2 text-center leading-tight">
                        全額済み
                      </span>
                    </div>
                  )
                  const isResidual = primaryAlreadyInvoiced
                  const { pct, customPct } = isResidual ? getRemainingPctOption(remPct) : { pct: undefined, customPct: undefined }
                  return (
                    <button
                      onClick={() => setEstimateToInvoiceTarget(
                        isResidual
                          ? { estimate: primaryEstimate, initialPct: pct, initialCustomPct: customPct }
                          : { estimate: primaryEstimate }
                      )}
                      className="group flex flex-col items-center gap-1"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all ${isResidual ? 'bg-violet-500 shadow-violet-200 group-hover:bg-violet-600' : 'bg-emerald-500 shadow-emerald-200 group-hover:bg-emerald-600'}`}>
                        <ArrowRight className="w-5 h-5 text-white rotate-90 md:rotate-0" />
                      </div>
                      <span className={`text-[10px] font-semibold ml-2 md:ml-0 text-center leading-tight ${isResidual ? 'text-violet-500 group-hover:text-violet-600' : 'text-emerald-500 group-hover:text-emerald-600'}`}>
                        <span className="md:hidden">変換</span>
                        <span className="hidden md:block">{isResidual ? `残り${remPct}%` : '1クリック'}<br/>で変換</span>
                      </span>
                    </button>
                  )
                })()}
                {(!primaryEstimate || primaryEstimate.status !== 'approved') && (
                  <div className="flex md:flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-white rotate-90 md:rotate-0" />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium ml-2 md:ml-0 md:mt-2 text-center leading-tight">
                      <span className="md:hidden">変換</span>
                      <span className="hidden md:block">1クリック<br/>で変換</span>
                    </span>
                  </div>
                )}
              </div>

              {/* ═══ 右：請求書ドキュメントカード ═══ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">請求書</span>
                    {invoices.length > 1 && (
                      <span className="text-[10px] text-gray-400">{invoices.length}件</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setEditingInvoice(null); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3 h-3" />
                    新規作成
                  </button>
                </div>

                {!primaryInvoice ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center px-6 py-10">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                      <CreditCard className="w-6 h-6 text-emerald-200" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">請求書がありません</p>
                    {primaryEstimate?.status === 'approved' ? (
                      <>
                        <p className="text-xs text-gray-400 mb-4">承認済みの見積書から作成できます</p>
                        <button
                          onClick={() => setEstimateToInvoiceTarget({ estimate: primaryEstimate })}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                          <FilePlus className="w-3.5 h-3.5" />
                          請求書を作成
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">見積書を承認済みにすると<br/>請求書を作成できます</p>
                    )}
                  </div>
                ) : (
                  <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${
                    primaryInvoice.estimateId ? 'border-emerald-200' : 'border-gray-200'
                  }`}>
                    {/* 元見積バナー */}
                    {primaryInvoice.estimateId && (() => {
                      const relEst = estimates.find(e => e.id === primaryInvoice.estimateId)
                      return (
                        <div className="bg-gradient-to-r from-orange-50 to-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center gap-2">
                          <FileText className="w-3 h-3 text-orange-500 shrink-0" />
                          <span className="text-[10px] font-bold text-orange-600">元見積</span>
                          <span className="text-[10px] text-gray-500 font-mono truncate">
                            {relEst ? formatEstimateNumber(relEst.id, relEst.createdAt) : '—'} より作成
                          </span>
                          <ArrowRight className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />
                        </div>
                      )
                    })()}
                    {/* カードヘッダー */}
                    <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <InvoiceStatusBadge status={isInvoiceOverdue(primaryInvoice) ? 'overdue' : primaryInvoice.status} />
                        <span className="text-[10px] text-emerald-400 font-mono truncate">
                          {formatInvoiceNumber(primaryInvoice.id, primaryInvoice.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {primaryInvoice.status === 'draft' && (
                          <button
                            onClick={() => handleMarkAsSent(primaryInvoice.id)}
                            className="p-1 rounded hover:bg-emerald-100 text-emerald-300 hover:text-emerald-600 transition-colors"
                            title="送付済みにする"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {primaryInvoice.status === 'paid' && (
                          <button
                            onClick={() => handleCancelPayment(primaryInvoice)}
                            className="p-1 rounded hover:bg-red-50 text-emerald-300 hover:text-red-400 transition-colors"
                            title="入金を取り消す"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {primaryInvoice.status !== 'canceled' && (
                          <button
                            onClick={() => { setPaymentTargetInvoice(primaryInvoice); setShowPaymentModal(true) }}
                            className="p-1 rounded hover:bg-emerald-100 text-emerald-300 hover:text-emerald-600 transition-colors"
                            title={primaryInvoice.status === 'paid' ? '入金を修正' : '入金を記録'}
                          >
                            <Banknote className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/projects/${projectId}/invoices/${primaryInvoice.id}/preview`}
                          className="p-1 rounded hover:bg-emerald-100 text-emerald-300 hover:text-emerald-600 transition-colors"
                          title="プレビュー"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setEditingInvoice(primaryInvoice); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
                          className="p-1 rounded hover:bg-emerald-100 text-emerald-300 hover:text-emerald-600 transition-colors"
                          title="編集"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(primaryInvoice.id)}
                          className="p-1 rounded hover:bg-red-50 text-emerald-300 hover:text-red-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* カードボディ */}
                    <div className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{primaryInvoice.title}</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(primaryInvoice.total)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        小計 {formatCurrency(primaryInvoice.subtotal)}　+　消費税 {formatCurrency(primaryInvoice.tax)}
                      </p>
                      {/* 明細テーブル */}
                      {primaryInvoice.items.length > 0 && (
                        <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 px-3 py-1.5 flex items-center justify-between border-b border-gray-100">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">品目</span>
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">金額</span>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {primaryInvoice.items.slice(0, 5).map((item, idx) => (
                              <div key={idx} className="px-3 py-2 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-700 truncate">{item.name}</span>
                                <span className="text-xs text-gray-600 font-medium shrink-0 tabular-nums">
                                  {formatCurrency(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                            {primaryInvoice.items.length > 5 && (
                              <div className="px-3 py-1.5 text-[10px] text-gray-400">
                                … 他 {primaryInvoice.items.length - 5}行
                              </div>
                            )}
                          </div>
                          <div className="border-t border-gray-200 bg-gray-50 divide-y divide-gray-100">
                            <div className="px-3 py-1.5 flex justify-between">
                              <span className="text-[10px] text-gray-500">小計</span>
                              <span className="text-[10px] text-gray-600 tabular-nums">{formatCurrency(primaryInvoice.subtotal)}</span>
                            </div>
                            <div className="px-3 py-1.5 flex justify-between">
                              <span className="text-[10px] text-gray-500">消費税</span>
                              <span className="text-[10px] text-gray-600 tabular-nums">{formatCurrency(primaryInvoice.tax)}</span>
                            </div>
                            <div className="px-3 py-2.5 flex justify-between bg-white">
                              <span className="text-xs font-bold text-gray-800">合計（税込）</span>
                              <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(primaryInvoice.total)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 支払い情報 */}
                      {primaryInvoice.paidAt ? (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <Banknote className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-emerald-700">入金済</p>
                            <p className="text-[10px] text-emerald-500">
                              {formatYMD(primaryInvoice.paidAt)}
                              {primaryInvoice.paidAmount != null && ` · ${formatCurrency(primaryInvoice.paidAmount)}`}
                            </p>
                          </div>
                        </div>
                      ) : primaryInvoice.dueDate && primaryInvoice.status !== 'paid' ? (
                        <p className={`text-xs mt-2 ${isInvoiceOverdue(primaryInvoice) ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                          支払期限 {formatYMD(primaryInvoice.dueDate)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* 他の請求書 */}
                {invoices.length > 1 && (
                  <div className="mt-2 space-y-1">
                    {invoices.filter(inv => inv.id !== primaryInvoice?.id).map((inv) => (
                      <div key={inv.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                        <InvoiceStatusBadge status={isInvoiceOverdue(inv) ? 'overdue' : inv.status} />
                        <span className="text-xs text-gray-600 truncate flex-1">{inv.title}</span>
                        <span className="text-xs font-medium text-gray-700 shrink-0 tabular-nums">{formatCurrency(inv.total)}</span>
                        {inv.status === 'draft' && (
                          <button
                            onClick={() => handleMarkAsSent(inv.id)}
                            className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="送付済みにする"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {inv.status !== 'canceled' && (
                          <button
                            onClick={() => { setPaymentTargetInvoice(inv); setShowPaymentModal(true) }}
                            className="p-1 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                            title="入金を記録"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/projects/${projectId}/invoices/${inv.id}/preview`}
                          className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="プレビュー"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setEditingInvoice(inv); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="編集"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ===== 契約書タブ ===== */}
        {activeTab === 'contracts' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">契約</h2>
              <button
                onClick={() => { setEditingContract(null); setShowContractModal(true) }}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                作成
              </button>
            </div>
            {contracts.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-400">まだ契約情報がありません</p>
                <button
                  onClick={() => { setEditingContract(null); setShowContractModal(true) }}
                  className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  最初の契約情報を登録する →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map((con) => (
                  <div key={con.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <ContractStatusBadge status={con.status} />
                          {con.contractDate && (
                            <span className="text-xs text-gray-400">契約日 {formatYMD(con.contractDate)}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{con.title}</p>
                        {con.amount != null && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            契約金額 <span className="font-medium text-gray-700">{formatCurrency(con.amount)}</span>（税込）
                          </p>
                        )}
                        {(con.startDate || con.endDate) && (
                          <p className="text-xs text-gray-400 mt-1">
                            期間：{con.startDate ? formatYMD(con.startDate) : '未定'}　〜　{con.endDate ? formatYMD(con.endDate) : '未定'}
                          </p>
                        )}
                        {(con.estimateId || con.invoiceId) && (() => {
                          const relEst = con.estimateId ? estimates.find((e) => e.id === con.estimateId) : undefined
                          const relInv = con.invoiceId ? invoices.find((i) => i.id === con.invoiceId) : undefined
                          return (
                            <p className="text-xs text-gray-400 mt-1">
                              {relEst && formatEstimateNumber(relEst.id, relEst.createdAt)}
                              {relEst && relInv && '　・　'}
                              {relInv && formatInvoiceNumber(relInv.id, relInv.createdAt)}
                            </p>
                          )
                        })()}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <Link
                          href={`/projects/${projectId}/contracts/${con.id}/preview`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="契約書プレビュー"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => { setEditingContract(con); setShowContractModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="編集"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContract(con.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ファイルタブ ===== */}
        {activeTab === 'files' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">ファイル</h2>
              <button
                onClick={() => { setEditingFile(null); setShowFileModal(true) }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                追加
              </button>
            </div>
            {fileError && <p className="text-sm text-red-500 mb-2">{fileError}</p>}
            {files.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-400">ファイルがありません</p>
                {!isCloud && (
                  <p className="text-xs text-gray-400 mt-1">外部URLでGoogle Drive・Dropboxのリンクを登録できます</p>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {files.map((f) => {
                  const hasLink = !!(f.externalUrl || f.storagePath || f.publicUrl)
                  return (
                    <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-600">
                            {FILE_CATEGORY_LABELS[f.category]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(f.createdAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                          </span>
                          {f.fileSize && (
                            <span className="text-xs text-gray-400">{(f.fileSize / 1024).toFixed(0)} KB</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mt-0.5 truncate">{f.name}</p>
                        {f.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{f.note}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {hasLink && (
                          <button
                            onClick={() => handleOpenFile(f)}
                            disabled={openingFileId === f.id}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                            title="開く"
                          >
                            {f.storagePath && !f.externalUrl && !f.publicUrl
                              ? <Download className="w-3.5 h-3.5" />
                              : <ExternalLink className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingFile(f); setShowFileModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="編集"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(f)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== 利益タブ ===== */}
        {activeTab === 'profit' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">利益管理</h2>
              <button
                onClick={() => { setEditingCost(null); setShowCostModal(true) }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                原価を追加
              </button>
            </div>
            {costError && <p className="text-sm text-red-500 mb-3">{costError}</p>}

            {/* ── 利益進捗サマリーカード ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">利益進捗サマリー</h3>
                {profitRateEst !== null && !costOnlyModeEst && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    profitRateEst >= 30
                      ? 'bg-emerald-100 text-emerald-700'
                      : profitRateEst >= 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    利益率 {profitRateEst}%
                  </span>
                )}
                {costOnlyModeEst && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">原価先行</span>
                )}
              </div>

              {/* 進捗バー */}
              {revenueForProfit > 0 && (
                <div className="space-y-2 mb-5">
                  {/* 売上予定（ベース） */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-14 shrink-0">売上予定</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-blue-300 rounded-full" />
                    </div>
                    <span className="text-[10px] text-blue-600 font-medium w-24 text-right shrink-0 tabular-nums">{formatCurrency(revenueForProfit)}</span>
                  </div>
                  {/* 請求済 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-14 shrink-0">請求済</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${billedPct}%` }} />
                    </div>
                    <span className="text-[10px] text-violet-600 font-medium w-24 text-right shrink-0 tabular-nums">{formatCurrency(totalBilled)}</span>
                  </div>
                  {/* 入金済 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-14 shrink-0">入金済</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium w-24 text-right shrink-0 tabular-nums">{formatCurrency(totalPaid)}</span>
                  </div>
                  {/* 原価 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-14 shrink-0">原価</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${costPct}%` }} />
                    </div>
                    <span className="text-[10px] text-orange-600 font-medium w-24 text-right shrink-0 tabular-nums">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              )}

              {/* 7指標グリッド */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div className="bg-blue-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-blue-500 mb-0.5">売上予定</p>
                  <p className="text-sm font-bold text-blue-700 tabular-nums">
                    {revenueForProfit > 0 ? formatCurrency(revenueForProfit) : <span className="text-gray-300">—</span>}
                  </p>
                </div>
                <div className="bg-violet-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-violet-500 mb-0.5">請求済額</p>
                  <p className={`text-sm font-bold tabular-nums ${totalBilled > 0 ? 'text-violet-700' : 'text-gray-300'}`}>
                    {formatCurrency(totalBilled)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-emerald-500 mb-0.5">入金済額</p>
                  <p className={`text-sm font-bold tabular-nums ${totalPaid > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-orange-500 mb-0.5">原価</p>
                  <p className={`text-sm font-bold tabular-nums ${totalCost > 0 ? 'text-orange-700' : 'text-gray-300'}`}>
                    {formatCurrency(totalCost)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-orange-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-orange-500 mb-0.5">外注費</p>
                  <p className={`text-sm font-bold tabular-nums ${totalOutsourcing > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                    {formatCurrency(totalOutsourcing)}
                  </p>
                </div>
                <div className={`rounded-xl px-3 py-2.5 ${!costOnlyModeEst && grossProfitEst < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className={`text-[10px] mb-0.5 ${!costOnlyModeEst && grossProfitEst < 0 ? 'text-red-400' : 'text-emerald-500'}`}>粗利</p>
                  {costOnlyModeEst ? (
                    <p className="text-sm font-bold text-amber-600">原価先行</p>
                  ) : (
                    <p className={`text-sm font-bold tabular-nums ${grossProfitEst > 0 ? 'text-emerald-700' : grossProfitEst < 0 ? 'text-red-600' : 'text-gray-300'}`}>
                      {formatCurrency(grossProfitEst)}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-blue-500 mb-0.5">利益率</p>
                  {profitRateEst !== null && !costOnlyModeEst ? (
                    <p className={`text-sm font-bold tabular-nums ${profitRateEst >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                      {profitRateEst}%
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-300">—</p>
                  )}
                </div>
              </div>
            </div>

            {costs.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">原価がありません</p>
                <button
                  onClick={() => { setEditingCost(null); setShowCostModal(true) }}
                  className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  原価を追加する →
                </button>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {costs.map((cost) => (
                  <div key={cost.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">
                          {CATEGORY_LABELS[cost.category]}
                        </span>
                        <span className="text-xs text-gray-400">{formatYMD(cost.costDate)}</span>
                      </div>
                      <p className="text-sm text-gray-800 mt-0.5">{cost.title}</p>
                      {cost.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{cost.note}</p>}
                    </div>
                    <p className="text-sm font-semibold text-rose-600 shrink-0">{formatCurrency(cost.amount)}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingCost(cost); setShowCostModal(true) }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCost(cost)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========== MODALS ========== */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSaved={handleSaveEdit}
        />
      )}

      {showEstimateModal && (
        <EstimateModal
          projectId={projectId}
          customerId={project.customerId}
          estimate={editingEstimate ?? undefined}
          taxRate={docTaxRate}
          onClose={() => { setShowEstimateModal(false); setEditingEstimate(null) }}
          onSaved={handleEstimateSaved}
        />
      )}

      {showInvoiceModal && (
        <InvoiceModal
          projectId={projectId}
          customerId={project.customerId}
          invoice={editingInvoice ?? undefined}
          taxRate={docTaxRate}
          invoiceDueDays={docInvoiceDueDays}
          fromEstimate={creatingFromEstimate ? {
            estimateId: creatingFromEstimate.id,
            title: `${creatingFromEstimate.title} 請求書`,
            items: creatingFromEstimate.items.map((item) => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              sortOrder: item.sortOrder,
            })),
            note: creatingFromEstimate.note,
          } : undefined}
          onClose={() => { setShowInvoiceModal(false); setEditingInvoice(null); setCreatingFromEstimate(null) }}
          onSaved={handleInvoiceSaved}
        />
      )}

      {estimateToInvoiceTarget && (
        <EstimateToInvoiceModal
          estimate={estimateToInvoiceTarget.estimate}
          projectId={projectId}
          customerId={project.customerId}
          taxRate={docTaxRate}
          invoiceDueDays={docInvoiceDueDays}
          initialPct={estimateToInvoiceTarget.initialPct}
          initialCustomPct={estimateToInvoiceTarget.initialCustomPct}
          onClose={() => setEstimateToInvoiceTarget(null)}
          onSaved={handleEstimateToInvoiceSaved}
          onActivityCreated={() => setActivityRefreshKey((k) => k + 1)}
        />
      )}

      {showContractModal && (
        <ContractModal
          projectId={projectId}
          customerId={project.customerId}
          contract={editingContract ?? undefined}
          estimates={estimates}
          invoices={invoices}
          onClose={() => { setShowContractModal(false); setEditingContract(null) }}
          onSaved={handleContractSaved}
        />
      )}

      {showPaymentModal && paymentTargetInvoice && (
        <PaymentModal
          invoice={paymentTargetInvoice}
          onClose={() => { setShowPaymentModal(false); setPaymentTargetInvoice(null) }}
          onSaved={handlePaymentSaved}
        />
      )}

      {showActivityModal && (
        <ActivityModal
          projectId={projectId}
          customerId={project.customerId}
          onClose={() => setShowActivityModal(false)}
          onSaved={() => { setShowActivityModal(false); setActivityRefreshKey((k) => k + 1) }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask ?? undefined}
          projectId={projectId}
          customerId={project.customerId}
          onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
          onSaved={handleTaskSaved}
        />
      )}

      {showCostModal && (
        <ProjectCostModal
          cost={editingCost ?? undefined}
          projectId={projectId}
          customerId={project.customerId}
          onClose={() => { setShowCostModal(false); setEditingCost(null) }}
          onSaved={handleCostSaved}
        />
      )}

      {showFileModal && (
        <ProjectFileModal
          file={editingFile ?? undefined}
          projectId={projectId}
          customerId={project.customerId}
          isCloud={isCloud === true}
          onClose={() => { setShowFileModal(false); setEditingFile(null) }}
          onSaved={handleFileSaved}
        />
      )}
    </div>
  )
}
