'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Pencil, Trash2, Plus, X, Check,
  Globe, Mail, Phone, Building2, ChevronRight,
} from 'lucide-react'
import { Customer, Contact, Project, Hearing, Task, Invoice, ProjectCost, ProjectFile } from '@/lib/types'
import {
  getCustomer, updateCustomer, deleteCustomer,
  getContacts, createContact, updateContact, deleteContact,
  getProjectsByCustomer, getHearingsByProjectIds,
  getTasksByCustomer, getInvoices, getProjectCostsByCustomer, getProjectFilesByCustomer,
} from '@/lib/dataSource'
import { isTaskOverdue, formatYMD, formatCurrency } from '@/lib/utils'
import { useCloudMode } from '@/lib/hooks/useCloudMode'
import NewCustomerModal from '@/components/NewCustomerModal'
import ActivityFeed from '@/components/ActivityFeed'
import ActivityModal from '@/components/ActivityModal'

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  const isCloud = useCloudMode()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [allHearings, setAllHearings] = useState<Hearing[]>([])
  const [mounted, setMounted] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)
  const [customerTasks, setCustomerTasks] = useState<Task[]>([])
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([])
  const [customerCosts, setCustomerCosts] = useState<ProjectCost[]>([])
  const [customerFiles, setCustomerFiles] = useState<ProjectFile[]>([])

  // 担当者インライン追加フォーム
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactRole, setNewContactRole] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [addingContact, setAddingContact] = useState(false)

  // 担当者インライン編集
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [editContact, setEditContact] = useState<Partial<Contact>>({})

  const load = useCallback(async () => {
    const [c, cs, ps] = await Promise.all([
      getCustomer(customerId),
      getContacts(customerId),
      getProjectsByCustomer(customerId),
    ])
    if (!c) { router.push('/customers'); return }
    setCustomer(c)
    setContacts(cs)
    setProjects(ps)
    if (ps.length > 0) {
      const hs = await getHearingsByProjectIds(ps.map((p) => p.id))
      setAllHearings(hs)
    }
    getTasksByCustomer(customerId).then(setCustomerTasks)
    getProjectCostsByCustomer(customerId).then(setCustomerCosts)
    getProjectFilesByCustomer(customerId).then(setCustomerFiles)
    if (ps.length > 0) {
      Promise.all(ps.map((p) => getInvoices(p.id)))
        .then((arrays) => setCustomerInvoices(arrays.flat()))
    }
  }, [customerId, router])

  const isDemoCustomer = customerId.startsWith('demo-')

  useEffect(() => {
    if (isCloud === null) return
    if (!isCloud && !isDemoCustomer) { router.push('/projects'); return }
    setMounted(true)
    load()
  }, [isCloud, load, router, isDemoCustomer])

  const handleDelete = async () => {
    if (!window.confirm('この顧客を削除しますか？\n紐づく担当者情報も削除されます。')) return
    await deleteCustomer(customerId)
    router.push('/customers')
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContactName.trim()) return
    setAddingContact(true)
    const c = await createContact({
      customerId,
      name: newContactName.trim(),
      role: newContactRole.trim() || undefined,
      email: newContactEmail.trim() || undefined,
      phone: newContactPhone.trim() || undefined,
    })
    setAddingContact(false)
    if (c) {
      setContacts((prev) => [...prev, c])
      setNewContactName('')
      setNewContactRole('')
      setNewContactEmail('')
      setNewContactPhone('')
      setShowAddContact(false)
    }
  }

  const handleEditContactSave = async (id: string) => {
    const updated = await updateContact(id, {
      name: editContact.name,
      role: editContact.role,
      email: editContact.email,
      phone: editContact.phone,
    })
    if (updated) {
      setContacts((prev) => prev.map((c) => c.id === id ? updated : c))
    }
    setEditingContactId(null)
  }

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('この担当者を削除しますか？')) return
    await deleteContact(id)
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const totalHearings = allHearings.length
  const lastContactDate = allHearings.length > 0
    ? new Date(allHearings[0].date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })
    : null

  if (!mounted || !customer) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={() => router.push('/customers')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            顧客一覧
          </button>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <h1 className="text-lg font-bold text-gray-900 truncate">{customer.name}</h1>
              </div>
              {customer.industry && (
                <p className="text-xs text-gray-500 mt-0.5 pl-5">{customer.industry}</p>
              )}
            </div>
            {!isDemoCustomer && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="顧客を編集"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                  title="顧客を削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* デモバナー */}
        {isDemoCustomer && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
            <span className="text-xs text-blue-500">— クラウドモードで編集・管理できます</span>
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-gray-400 mb-3">基本情報</p>
          {customer.website ? (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <a
                href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 truncate"
              >
                {customer.website}
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">WebサイトURL 未登録</p>
          )}
          {customer.notes && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pt-2 border-t border-gray-100 mt-2">
              {customer.notes}
            </p>
          )}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100 mt-2">
            <div>
              <p className="text-lg font-bold text-gray-900">{projects.length}</p>
              <p className="text-xs text-gray-400">案件数</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{contacts.length}</p>
              <p className="text-xs text-gray-400">担当者</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{totalHearings}</p>
              <p className="text-xs text-gray-400">ヒアリング</p>
            </div>
            {lastContactDate && (
              <div>
                <p className="text-sm font-semibold text-gray-900">{lastContactDate}</p>
                <p className="text-xs text-gray-400">最終接触日</p>
              </div>
            )}
          </div>
        </div>

        {/* 担当者 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">担当者</h2>
            {!isDemoCustomer && (
              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                追加
              </button>
            )}
          </div>

          {showAddContact && (
            <form onSubmit={handleAddContact} className="bg-white border border-blue-200 rounded-xl p-4 mb-2 space-y-3">
              <p className="text-xs font-medium text-gray-700">担当者を追加</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">氏名 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="山田 太郎"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">役職</label>
                  <input
                    type="text"
                    value={newContactRole}
                    onChange={(e) => setNewContactRole(e.target.value)}
                    placeholder="マーケティング部長"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">メール</label>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="example@company.com"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                  <input
                    type="tel"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="03-0000-0000"
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={addingContact || !newContactName.trim()}
                  className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {addingContact ? '追加中...' : '追加する'}
                </button>
              </div>
            </form>
          )}

          {contacts.length === 0 && !showAddContact ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-400">担当者がまだいません</p>
              <button
                onClick={() => setShowAddContact(true)}
                className="mt-1 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                担当者を追加する →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-white border border-gray-200 rounded-xl p-3">
                  {editingContactId === contact.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">氏名</label>
                          <input
                            type="text"
                            value={editContact.name ?? contact.name}
                            onChange={(e) => setEditContact((p) => ({ ...p, name: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">役職</label>
                          <input
                            type="text"
                            value={editContact.role ?? contact.role ?? ''}
                            onChange={(e) => setEditContact((p) => ({ ...p, role: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">メール</label>
                          <input
                            type="email"
                            value={editContact.email ?? contact.email ?? ''}
                            onChange={(e) => setEditContact((p) => ({ ...p, email: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                          <input
                            type="tel"
                            value={editContact.phone ?? contact.phone ?? ''}
                            onChange={(e) => setEditContact((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingContactId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleEditContactSave(contact.id)}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                          {contact.role && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {contact.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                            >
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingContactId(contact.id)
                            setEditContact({
                              name: contact.name,
                              role: contact.role ?? '',
                              email: contact.email ?? '',
                              phone: contact.phone ?? '',
                            })
                          }}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 収益サマリー */}
        {(() => {
          const totalBilled = customerInvoices.filter((inv) => inv.status !== 'canceled').reduce((sum, inv) => sum + inv.total, 0)
          const totalPaid = customerInvoices.reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0)
          const totalCost = customerCosts.reduce((sum, c) => sum + c.amount, 0)
          const revenueBase = totalPaid > 0 ? totalPaid : totalBilled
          const grossProfit = revenueBase - totalCost
          const profitRate = revenueBase > 0 ? Math.round((grossProfit / revenueBase) * 100) : null
          const costOnlyMode = revenueBase === 0 && totalCost > 0
          if (totalBilled === 0 && totalCost === 0) return null
          return (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">収益サマリー</h2>
              <div className="grid grid-cols-2 gap-2">
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
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
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
            </section>
          )
        })()}

        {/* タスク */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">未完了タスク</h2>
          {customerTasks.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400">未完了のタスクはありません</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {customerTasks.slice(0, 10).map((task) => {
                const proj = projects.find((p) => p.id === task.projectId)
                return (
                  <button
                    key={task.id}
                    onClick={() => router.push(`/projects/${task.projectId}`)}
                    className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-600' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                        </span>
                        {task.dueDate && (
                          <span className={`text-xs ${isTaskOverdue(task) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            期限 {formatYMD(task.dueDate)}{isTaskOverdue(task) ? '（超過）' : ''}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${isTaskOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      {proj && <p className="text-xs text-gray-400 mt-0.5">{proj.name}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* 活動履歴 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">活動履歴</h2>
            {!isDemoCustomer && (
              <button
                onClick={() => setShowActivityModal(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                活動を記録
              </button>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <ActivityFeed customerId={customerId} refreshKey={activityRefreshKey} />
          </div>
        </section>

        {/* ファイル */}
        {customerFiles.length > 0 && (() => {
          const projectMap = new Map(projects.map((p) => [p.id, p]))
          return (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">ファイル</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {customerFiles.slice(0, 10).map((f) => {
                  const proj = projectMap.get(f.projectId)
                  const hasLink = !!(f.externalUrl || f.publicUrl || f.storagePath)
                  return (
                    <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {proj && <p className="text-xs text-gray-400 truncate">{proj.name}</p>}
                        <p className="text-sm text-gray-800 truncate">{f.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-600">
                            {({ document: '文書', image: '画像', pdf: 'PDF', design: 'デザイン', delivery: '納品物', other: 'その他' } as Record<string, string>)[f.category] ?? 'その他'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(f.createdAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {hasLink && (
                        <a
                          href={f.externalUrl ?? f.publicUrl ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
                          title="開く"
                          onClick={(e) => {
                            if (!f.externalUrl && !f.publicUrl) e.preventDefault()
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })()}

        {/* 案件履歴 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">案件履歴</h2>
          {projects.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-400">紐づく案件がありません</p>
              <button
                onClick={() => router.push('/projects')}
                className="mt-1 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                案件一覧から紐付ける →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(project.updatedAt).toLocaleDateString('ja-JP', {
                          year: 'numeric', month: 'numeric', day: 'numeric',
                        })}
                        　最終更新
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        project.status === '商談中' ? 'bg-amber-100 text-amber-700' :
                        project.status === '提案済' ? 'bg-blue-100 text-blue-700' :
                        project.status === '受注' ? 'bg-emerald-100 text-emerald-700' :
                        project.status === '進行中' ? 'bg-violet-100 text-violet-700' :
                        project.status === '完了' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {project.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

      </main>

      {showEditModal && (
        <NewCustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onSaved={(c) => {
            setCustomer(c)
            setShowEditModal(false)
          }}
        />
      )}

      {showActivityModal && (
        <ActivityModal
          customerId={customerId}
          onClose={() => setShowActivityModal(false)}
          onSaved={() => { setShowActivityModal(false); setActivityRefreshKey((k) => k + 1) }}
        />
      )}
    </div>
  )
}
