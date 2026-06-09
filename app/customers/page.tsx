'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Building2, Globe, ChevronRight } from 'lucide-react'
import { Customer, Project } from '@/lib/types'
import { getCustomers, getProjects } from '@/lib/dataSource'
import { useCloudMode } from '@/lib/hooks/useCloudMode'
import AppShell from '@/components/AppShell'
import NewCustomerModal from '@/components/NewCustomerModal'
import { demoCustomers, demoProjects } from '@/lib/demoData'

export default function CustomersPage() {
  const router  = useRouter()
  const isCloud = useCloudMode()

  const [customers,     setCustomers]     = useState<Customer[]>([])
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({})
  const [searchQuery,   setSearchQuery]   = useState('')
  const [mounted,       setMounted]       = useState(false)
  const [showModal,     setShowModal]     = useState(false)

  const loadData = useCallback(async () => {
    if (isCloud) {
      const [cs, ps] = await Promise.all([getCustomers(), getProjects()])
      setCustomers(cs)
      const counts: Record<string, number> = {}
      ps.forEach((p: Project) => {
        if (p.customerId) counts[p.customerId] = (counts[p.customerId] ?? 0) + 1
      })
      setProjectCounts(counts)
    } else {
      // ローカルモードは顧客機能非対応 → デモデータで表示
      setCustomers([])
    }
  }, [isCloud])

  useEffect(() => {
    if (isCloud === null) return
    setMounted(true)
    loadData()
  }, [isCloud, loadData])

  if (!mounted) return null

  // デモ: 顧客 0件 or ローカルモード
  const isDemo     = customers.length === 0
  const dispCustomers = isDemo ? demoCustomers : customers

  // デモ用案件カウント（demoProjects から集計）
  const demoCounts: Record<string, number> = {}
  demoProjects.forEach(p => {
    if (p.customerId) demoCounts[p.customerId] = (demoCounts[p.customerId] ?? 0) + 1
  })
  const getCount = (id: string) => isDemo ? (demoCounts[id] ?? 0) : (projectCounts[id] ?? 0)

  const filtered = dispCustomers.filter((c) => {
    const q = searchQuery.trim().toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || (c.industry?.toLowerCase().includes(q) ?? false)
  })

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">顧客管理</h2>
          {isCloud && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              顧客を追加
            </button>
          )}
        </div>

        {/* デモ通知バナー */}
        {isDemo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
            <span className="text-xs text-blue-700 font-medium">デモデータを表示中</span>
            <span className="text-xs text-blue-500">— ログインすると顧客を登録・管理できます</span>
          </div>
        )}

        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="顧客名・業種で検索"
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">
              該当する顧客がありません
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => !isDemo && router.push(`/customers/${customer.id}`)}
                  className={`w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all ${isDemo ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {customer.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pl-5 flex-wrap">
                        {customer.industry && (
                          <span className="text-xs text-gray-500">{customer.industry}</span>
                        )}
                        {customer.website && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <Globe className="w-3 h-3" />
                            {customer.website.replace(/^https?:\/\//, '')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {getCount(customer.id)}
                        </p>
                        <p className="text-xs text-gray-400">案件</p>
                      </div>
                      {!isDemo && <ChevronRight className="w-4 h-4 text-gray-300" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      </main>

      {showModal && isCloud && (
        <NewCustomerModal
          onClose={() => setShowModal(false)}
          onSaved={(c) => {
            setCustomers((prev) => [c, ...prev])
            setShowModal(false)
          }}
        />
      )}
    </AppShell>
  )
}
