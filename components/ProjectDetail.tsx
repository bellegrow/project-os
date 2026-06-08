'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCloudMode } from '@/lib/hooks/useCloudMode'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Check,
  Receipt,
  CreditCard,
  ScrollText,
  Trash2,
  ChevronDown,
  Pencil,
  Eye,
  FilePlus,
  Banknote,
  Send,
  Undo2,
  Folder,
  ExternalLink,
  Download,
} from 'lucide-react'
import { Project, Hearing, ProjectStatus, Customer, Estimate, Invoice, InvoiceStatus, Contract, Task, ProjectCost, CostCategory, ProjectFile, FileCategory } from '@/lib/types'
import {
  getProject, getHearings,
  deleteHearing, updateProjectStatus, updateProject, deleteProject, updateHearing,
  getCustomer, getEstimates, deleteEstimate, getInvoices, deleteInvoice, recordPayment,
  updateInvoiceStatus, cancelPayment,
  getContracts, deleteContract,
  createActivity,
  getTasks, completeTask, deleteTask,
  getProjectCosts, createProjectCost, updateProjectCost, deleteProjectCost,
  getProjectFiles, deleteProjectFile, uploadProjectFile, createProjectFile, updateProjectFile, getProjectFileUrl,
} from '@/lib/dataSource'
import { formatRelativeDate, formatFullDate, formatCurrency, getHearingPreview, formatEstimateNumber, formatInvoiceNumber, formatContractNumber, isInvoiceOverdue, formatYMD, isTaskOverdue, checkProjectStatus, StatusCheckConfig } from '@/lib/utils'
import { getSettings } from '@/lib/settingsSource'
import EditProjectModal from './EditProjectModal'
import CustomerCard from './CustomerCard'
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

const STATUS_CLS: Record<ProjectStatus, string> = {
  商談中: 'bg-amber-100 text-amber-700',
  提案済: 'bg-blue-100 text-blue-700',
  受注: 'bg-emerald-100 text-emerald-700',
  進行中: 'bg-violet-100 text-violet-700',
  完了: 'bg-gray-100 text-gray-600',
  失注: 'bg-red-100 text-red-600',
}

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
  const estimatesSectionRef = useRef<HTMLElement>(null)
  const invoicesSectionRef = useRef<HTMLElement>(null)
  const contractsSectionRef = useRef<HTMLElement>(null)
  const filesSectionRef = useRef<HTMLElement>(null)
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
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleTaskSaved = (saved: Task) => {
    const isNew = !tasks.some((t) => t.id === saved.id)
    setTasks((prev) =>
      isNew ? [saved, ...prev] : prev.map((t) => t.id === saved.id ? saved : t)
    )
    setShowTaskModal(false)
    setEditingTask(null)
    if (isNew) {
      createActivity({ projectId, customerId: project?.customerId, type: 'task_created', title: `タスク作成：${saved.title}` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    }
  }

  const handleCompleteTask = async (task: Task) => {
    setTaskError('')
    try {
      const updated = await completeTask(task.id)
      if (!updated) { setTaskError('タスクの更新に失敗しました'); return }
      setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t))
      createActivity({ projectId, customerId: project?.customerId, type: 'task_completed', title: `タスク完了：${task.title}` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
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

  const CATEGORY_LABELS: Record<CostCategory, string> = {
    outsourcing: '外注費', material: '材料費', tool: 'ツール費', ad: '広告費', other: 'その他',
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
      projectId,
      customerId: project?.customerId,
      type: actType,
      title: actTitle,
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
        projectId,
        customerId: project?.customerId,
        type: 'cost_deleted',
        title: `原価削除：${cost.title}`,
        body: `カテゴリ：${CATEGORY_LABELS[cost.category]}　金額：${cost.amount.toLocaleString()}円`,
      }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    } catch {
      setCostError('原価の削除に失敗しました')
    }
  }

  const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
    document: '文書', image: '画像', pdf: 'PDF', design: 'デザイン', delivery: '納品物', other: 'その他',
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
      projectId,
      customerId: project?.customerId,
      type: actType,
      title: actTitle,
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
        projectId,
        customerId: project?.customerId,
        type: 'file_deleted',
        title: `ファイル削除：${file.name}`,
        body: `種別：${FILE_CATEGORY_LABELS[file.category]}`,
      }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    } catch {
      setFileError('ファイルの削除に失敗しました')
    }
  }

  const handleOpenFile = async (file: ProjectFile) => {
    if (file.externalUrl) {
      window.open(file.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (file.publicUrl) {
      window.open(file.publicUrl, '_blank', 'noopener,noreferrer')
      return
    }
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
    createActivity({ projectId, customerId: project?.customerId, type: 'status_changed', title: `ステータス変更：${prevStatus} → ${newStatus}` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
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
    setEstimates((prev) =>
      isNew ? [saved, ...prev] : prev.map((e) => e.id === saved.id ? saved : e)
    )
    setShowEstimateModal(false)
    setEditingEstimate(null)
    createActivity({ projectId, customerId: project?.customerId, type: isNew ? 'estimate_created' : 'estimate_updated', title: `${isNew ? '見積書作成' : '見積書更新'}：${saved.title}`, body: `合計：${saved.total.toLocaleString()}円` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('この請求書を削除しますか？')) return
    await deleteInvoice(id)
    setInvoices((prev) => prev.filter((i) => i.id !== id))
  }

  const handleInvoiceSaved = (saved: Invoice) => {
    const isNew = !invoices.some((i) => i.id === saved.id)
    setInvoices((prev) =>
      isNew ? [saved, ...prev] : prev.map((i) => i.id === saved.id ? saved : i)
    )
    setShowInvoiceModal(false)
    setEditingInvoice(null)
    setCreatingFromEstimate(null)
    if (isNew) {
      createActivity({ projectId, customerId: project?.customerId, type: 'invoice_created', title: `請求書作成：${saved.title}`, body: `合計：${saved.total.toLocaleString()}円` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    }
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
    setContracts((prev) =>
      isNew ? [saved, ...prev] : prev.map((c) => c.id === saved.id ? saved : c)
    )
    setShowContractModal(false)
    setEditingContract(null)
    const type = wasSigned ? 'contract_signed' : isNew ? 'contract_created' : null
    if (type) {
      createActivity({ projectId, customerId: project?.customerId, type, title: `${type === 'contract_signed' ? '契約締結' : '契約書作成'}：${saved.title}` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
    }
  }

  const handlePaymentSaved = (saved: Invoice) => {
    const prev = invoices.find((i) => i.id === saved.id)
    const isEdit = !!prev?.paidAt
    setInvoices((prev) => prev.map((i) => i.id === saved.id ? saved : i))
    setShowPaymentModal(false)
    setPaymentTargetInvoice(null)
    createActivity({ projectId, customerId: project?.customerId, type: isEdit ? 'payment_updated' : 'payment_received', title: `${isEdit ? '入金修正' : '入金記録'}：${saved.title}`, body: `金額：${(saved.paidAmount ?? 0).toLocaleString()}円` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
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
        createActivity({ projectId, customerId: project?.customerId, type: 'invoice_sent', title: `請求書送付：${inv.title}`, body: `合計：${inv.total.toLocaleString()}円` }).then(() => setActivityRefreshKey((k) => k + 1)).catch(() => {})
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '送付済みへの変更に失敗しました')
    }
  }

  if (!mounted || !project) return null

  const visibleHearings = showAllHearings ? hearings : hearings.slice(0, 2)
  const hasOverdueInvoice = invoices.some((inv) => isInvoiceOverdue(inv))
  const hasSignedContract = contracts.some((c) => c.status === 'signed' || c.status === 'completed')

  // 利益計算
  const totalBilled = invoices.filter((inv) => inv.status !== 'canceled').reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0)
  const totalCost = costs.reduce((sum, c) => sum + c.amount, 0)
  const revenueBase = totalPaid > 0 ? totalPaid : totalBilled
  const grossProfit = revenueBase - totalCost
  const profitRate = revenueBase > 0 ? Math.round((grossProfit / revenueBase) * 100) : null
  // 売上未発生（請求・入金ゼロ）で原価だけ先行している状態
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="py-3">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              案件一覧
            </button>
          </div>
          <div className="pb-4">
            {project.customerId ? (
              <Link
                href={`/customers/${project.customerId}`}
                className="text-xs text-blue-600 hover:underline mb-0.5 inline-block"
              >
                {project.clientName}
              </Link>
            ) : (
              <p className="text-xs text-gray-500 mb-0.5">{project.clientName}</p>
            )}
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{project.name}</h1>
              <div className="flex items-center gap-1 sm:gap-0.5 shrink-0 mt-0.5">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2.5 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="案件を編集"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="p-2.5 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                  title="案件を削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
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
              {project.budget && (
                <span className="text-sm text-gray-500">{formatCurrency(project.budget)}</span>
              )}
              <span className="text-xs text-gray-400">
                最終更新 {formatRelativeDate(project.updatedAt)}
              </span>
              {(() => {
                const overdue = tasks.filter(isTaskOverdue)
                const sc = checkProjectStatus(project, invoices, overdue, costs, statusConfig)
                return sc.level !== 'ok' ? <ProjectStatusBadge check={sc} showReasons /> : null
              })()}
            </div>
          </div>
        </div>
      </header>


      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Project summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-400 mb-3">案件サマリー</p>
          {hearings.length === 0 ? (
            <p className="text-sm text-gray-400">まだヒアリング記録がありません</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  第{hearings.length}回ヒアリング
                </span>
                <span className="text-xs text-gray-400">{formatFullDate(hearings[0].date)}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                {getHearingPreview(hearings[0].memo)}
              </p>
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                {hearings.length}件のヒアリング記録 · 最終ヒアリング：{formatRelativeDate(hearings[0].date)}
              </p>
            </div>
          )}
        </div>

        {/* 顧客カード */}
        {customer && <CustomerCard customer={customer} />}

        {/* Next action */}
        {hearings.length === 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-600 mb-1">次のアクション</p>
            <p className="text-sm text-blue-800 mb-3">
              ヒアリング記録を追加して、案件の文脈を蓄積しましょう。
            </p>
            <button
              onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              ヒアリングを記録する
            </button>
          </div>
        )}

        {/* 見積書 */}
        <section ref={estimatesSectionRef}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">見積書</h2>
            <button
              onClick={() => { setEditingEstimate(null); setShowEstimateModal(true) }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              作成
            </button>
          </div>

          {estimates.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">まだ見積書がありません</p>
              <button
                onClick={() => { setEditingEstimate(null); setShowEstimateModal(true) }}
                className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                最初の見積書を作成する →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {estimates.map((est) => (
                <div key={est.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <EstimateStatusBadge status={est.status} />
                        <span className="text-xs text-gray-400">
                          {new Date(est.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric', month: 'numeric', day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{formatEstimateNumber(est.id, est.createdAt)}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{est.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        合計 <span className="font-medium text-gray-700">{formatCurrency(est.total)}</span>（税込）
                        　小計 {formatCurrency(est.subtotal)} + 税 {formatCurrency(est.tax)}
                      </p>
                      {est.items.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          明細 {est.items.length}行
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-0.5 shrink-0 mt-0.5">
                      <button
                        onClick={() => {
                          const alreadyInvoiced = invoices.some((i) => i.estimateId === est.id)
                          if (alreadyInvoiced) {
                            if (!window.confirm('この見積書から作成済みの請求書があります。追加で請求書を作成しますか？')) return
                          }
                          setCreatingFromEstimate(est)
                          setEditingInvoice(null)
                          setShowInvoiceModal(true)
                        }}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                        title="請求書を作成"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/projects/${projectId}/estimates/${est.id}/preview`}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title="プレビュー"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => { setEditingEstimate(est); setShowEstimateModal(true) }}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="見積書を編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEstimate(est.id)}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                        title="見積書を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 請求書 */}
        <section ref={invoicesSectionRef}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">請求書</h2>
            <button
              onClick={() => { setEditingInvoice(null); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              作成
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">まだ請求書がありません</p>
              <button
                onClick={() => { setEditingInvoice(null); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
                className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                最初の請求書を作成する →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <InvoiceStatusBadge status={isInvoiceOverdue(inv) ? 'overdue' : inv.status} />
                        <span className="text-xs text-gray-400">
                          {new Date(inv.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric', month: 'numeric', day: 'numeric',
                          })}
                        </span>
                        {inv.dueDate && (() => {
                          const [, m, d] = inv.dueDate.split('-').map(Number)
                          return (
                            <span className={`text-xs ${isInvoiceOverdue(inv) ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                              支払期限 {m}/{d}
                            </span>
                          )
                        })()}
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{formatInvoiceNumber(inv.id, inv.createdAt)}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{inv.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        合計 <span className="font-medium text-gray-700">{formatCurrency(inv.total)}</span>（税込）
                        　小計 {formatCurrency(inv.subtotal)} + 税 {formatCurrency(inv.tax)}
                      </p>
                      {inv.estimateId && (() => {
                        const relEst = estimates.find(e => e.id === inv.estimateId)
                        return (
                          <p className="text-xs text-gray-400 mt-1">
                            {relEst
                              ? `${formatEstimateNumber(relEst.id, relEst.createdAt)} より作成`
                              : '見積書より作成'}
                          </p>
                        )
                      })()}
                      {inv.paidAt && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs flex-wrap">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <Banknote className="w-3 h-3" />
                            入金済
                          </span>
                          <span className="text-gray-500">{formatYMD(inv.paidAt)}</span>
                          {inv.paidAmount != null && (
                            <span className="text-gray-700 font-medium">{formatCurrency(inv.paidAmount)}</span>
                          )}
                          {inv.paidAmount != null && inv.paidAmount !== inv.total && (
                            <span className={`font-medium ${inv.paidAmount < inv.total ? 'text-red-500' : 'text-amber-500'}`}>
                              ({inv.paidAmount < inv.total
                                ? `−${formatCurrency(inv.total - inv.paidAmount)} 不足`
                                : `+${formatCurrency(inv.paidAmount - inv.total)} 超過`})
                            </span>
                          )}
                          {inv.paymentNote && (
                            <span className="text-gray-400">{inv.paymentNote}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-0.5 shrink-0 mt-0.5">
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => handleMarkAsSent(inv.id)}
                          className="p-2.5 sm:p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="送付済みにする"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {inv.status === 'paid' && (
                        <button
                          onClick={() => handleCancelPayment(inv)}
                          className="p-2.5 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                          title="入金を取り消す"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {inv.status !== 'canceled' && (
                        <button
                          onClick={() => { setPaymentTargetInvoice(inv); setShowPaymentModal(true) }}
                          className="p-2.5 sm:p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                          title={inv.status === 'paid' ? '入金を修正' : '入金を記録'}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Link
                        href={`/projects/${projectId}/invoices/${inv.id}/preview`}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title="プレビュー"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => { setEditingInvoice(inv); setCreatingFromEstimate(null); setShowInvoiceModal(true) }}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="請求書を編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                        title="請求書を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 契約 */}
        <section ref={contractsSectionRef}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">契約</h2>
            <button
              onClick={() => { setEditingContract(null); setShowContractModal(true) }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              作成
            </button>
          </div>

          {contracts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
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
                          <span className="text-xs text-gray-400">
                            契約日 {formatYMD(con.contractDate)}
                          </span>
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
                          期間：
                          {con.startDate ? formatYMD(con.startDate) : '未定'}
                          　〜
                          {con.endDate ? formatYMD(con.endDate) : '未定'}
                        </p>
                      )}
                      {(con.estimateId || con.invoiceId) && (() => {
                        const relEst = con.estimateId ? estimates.find(e => e.id === con.estimateId) : undefined
                        const relInv = con.invoiceId ? invoices.find(i => i.id === con.invoiceId) : undefined
                        return (
                          <p className="text-xs text-gray-400 mt-1">
                            {relEst && formatEstimateNumber(relEst.id, relEst.createdAt)}
                            {relEst && relInv && '　・　'}
                            {relInv && formatInvoiceNumber(relInv.id, relInv.createdAt)}
                          </p>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-0.5 shrink-0 mt-0.5">
                      <Link
                        href={`/projects/${projectId}/contracts/${con.id}/preview`}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="契約書プレビュー"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => { setEditingContract(con); setShowContractModal(true) }}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="契約情報を編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContract(con.id)}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                        title="契約情報を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 利益管理 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">利益管理</h2>
            <button
              onClick={() => { setEditingCost(null); setShowCostModal(true) }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              原価を追加
            </button>
          </div>
          {costError && <p className="text-sm text-red-500 mb-2">{costError}</p>}

          {/* KPI サマリ */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-0.5">請求合計</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalBilled)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-0.5">入金合計</p>
              <p className={`text-sm font-semibold ${totalPaid > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-0.5">原価合計</p>
              <p className={`text-sm font-semibold ${totalCost > 0 ? 'text-rose-600' : 'text-gray-300'}`}>{formatCurrency(totalCost)}</p>
            </div>
            <div className={`bg-white border rounded-xl px-3 py-2.5 ${costOnlyMode ? 'border-gray-200' : grossProfit >= 0 ? 'border-gray-200' : 'border-red-200'}`}>
              <p className="text-xs text-gray-400 mb-0.5">
                粗利
                {!costOnlyMode && profitRate !== null && (
                  <span className={`ml-1.5 font-medium ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {profitRate}%
                  </span>
                )}
              </p>
              {costOnlyMode ? (
                <p className="text-sm font-medium text-amber-600">原価先行</p>
              ) : (
                <p className={`text-sm font-semibold ${grossProfit > 0 ? 'text-emerald-600' : grossProfit < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                  {formatCurrency(grossProfit)}
                </p>
              )}
            </div>
          </div>

          {/* 原価一覧 */}
          {costs.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">原価がありません</p>
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
                  <div className="flex items-center gap-1 sm:gap-0.5 shrink-0">
                    <button
                      onClick={() => { setEditingCost(cost); setShowCostModal(true) }}
                      className="p-2.5 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      title="編集"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCost(cost)}
                      className="p-2.5 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ファイル管理 */}
        <section ref={filesSectionRef}>
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
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4 text-center">
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
                    <div className="flex items-center gap-1 sm:gap-0.5 shrink-0">
                      {hasLink && (
                        <button
                          onClick={() => handleOpenFile(f)}
                          disabled={openingFileId === f.id}
                          className="p-2.5 sm:p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                          title="開く"
                        >
                          {f.storagePath && !f.externalUrl && !f.publicUrl
                            ? <Download className="w-3.5 h-3.5" />
                            : <ExternalLink className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingFile(f); setShowFileModal(true) }}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(f)}
                        className="p-2.5 sm:p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
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
        </section>

        {/* Timeline */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">ヒアリング記録</h2>
            <button
              onClick={() => router.push(`/projects/${projectId}/hearings/new`)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              追加
            </button>
          </div>

          {hearings.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
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
                <div
                  key={h.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
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
            {hearings.length > 2 && (
              <button
                onClick={() => setShowAllHearings(!showAllHearings)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors mt-2"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllHearings ? 'rotate-180' : ''}`} />
                {showAllHearings ? '折りたたむ' : `過去のヒアリングを見る（${hearings.length - 2}件）`}
              </button>
            )}
            </>
          )}

          <div className="flex items-center gap-2.5 mt-3 px-1">
            <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
            <p className="text-xs text-gray-400">
              案件登録 · {formatFullDate(project.createdAt)}
            </p>
          </div>
        </section>

        {/* タスク */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">タスク</h2>
            <button
              onClick={() => { setEditingTask(null); setShowTaskModal(true) }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              タスクを追加
            </button>
          </div>
          {taskError && (
            <p className="text-sm text-red-500 mb-2">{taskError}</p>
          )}
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
                    <div className="flex items-center gap-1 sm:gap-0.5 shrink-0">
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
        </section>

        {/* Activity feed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">活動履歴</h2>
            <button
              onClick={() => setShowActivityModal(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              活動を記録
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <ActivityFeed projectId={projectId} refreshKey={activityRefreshKey} />
          </div>
        </section>

        {/* Document shelf */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">ドキュメント</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 見積書 */}
            <div
              className={`bg-white border rounded-xl p-3 text-center transition-all cursor-pointer ${
                estimates.length > 0
                  ? 'border-blue-200 hover:border-blue-300 hover:shadow-sm'
                  : 'border-dashed border-gray-200 hover:opacity-80'
              }`}
              onClick={() => estimatesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Receipt className={`w-5 h-5 mx-auto mb-1.5 ${estimates.length > 0 ? 'text-blue-500' : 'text-gray-300'}`} />
              <p className="text-xs font-medium text-gray-700">見積書</p>
              <p className={`text-xs mt-0.5 ${estimates.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                {estimates.length > 0 ? `${estimates.length}件` : '未作成'}
              </p>
            </div>

            {/* 請求書 */}
            <div
              className={`bg-white border rounded-xl p-3 text-center transition-all cursor-pointer relative ${
                hasOverdueInvoice
                  ? 'border-red-200 hover:border-red-300 hover:shadow-sm'
                  : invoices.length > 0
                  ? 'border-blue-200 hover:border-blue-300 hover:shadow-sm'
                  : 'border-dashed border-gray-200 hover:opacity-80'
              }`}
              onClick={() => invoicesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              {hasOverdueInvoice && (
                <span className="absolute -top-1.5 -right-1.5 text-xs font-medium text-white bg-red-500 rounded-full px-1.5 py-0.5 leading-none">
                  超過
                </span>
              )}
              <CreditCard className={`w-5 h-5 mx-auto mb-1.5 ${hasOverdueInvoice ? 'text-red-500' : invoices.length > 0 ? 'text-blue-500' : 'text-gray-300'}`} />
              <p className="text-xs font-medium text-gray-700">請求書</p>
              <p className={`text-xs mt-0.5 ${hasOverdueInvoice ? 'text-red-500' : invoices.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                {invoices.length > 0 ? `${invoices.length}件` : '未作成'}
              </p>
            </div>

            {/* 契約書 */}
            <div
              className={`bg-white border rounded-xl p-3 text-center transition-all cursor-pointer ${
                contracts.length > 0
                  ? 'border-blue-200 hover:border-blue-300 hover:shadow-sm'
                  : 'border-dashed border-gray-200 hover:opacity-80'
              }`}
              onClick={() => contractsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ScrollText className={`w-5 h-5 mx-auto mb-1.5 ${contracts.length > 0 ? 'text-blue-500' : 'text-gray-300'}`} />
              <p className="text-xs font-medium text-gray-700">契約書</p>
              <p className={`text-xs mt-0.5 ${hasSignedContract ? 'text-violet-600' : contracts.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                {contracts.length === 0 ? '未登録' : hasSignedContract ? '締結済み' : `${contracts.length}件`}
              </p>
            </div>

            {/* ファイル */}
            <div
              className={`bg-white border rounded-xl p-3 text-center transition-all cursor-pointer col-span-2 ${
                files.length > 0
                  ? 'border-sky-200 hover:border-sky-300 hover:shadow-sm'
                  : 'border-dashed border-gray-200 hover:opacity-80'
              }`}
              onClick={() => filesSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Folder className={`w-5 h-5 mx-auto mb-1.5 ${files.length > 0 ? 'text-sky-500' : 'text-gray-300'}`} />
              <p className="text-xs font-medium text-gray-700">ファイル</p>
              <p className={`text-xs mt-0.5 ${files.length > 0 ? 'text-sky-500' : 'text-gray-400'}`}>
                {files.length > 0 ? `${files.length}件` : '未登録'}
              </p>
            </div>
          </div>
        </section>
      </main>

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
