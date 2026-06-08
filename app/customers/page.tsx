'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Building2, Globe, ChevronRight } from 'lucide-react'
import { Customer, Project } from '@/lib/types'
import { getCustomers, getProjects } from '@/lib/dataSource'
import { useCloudMode } from '@/lib/hooks/useCloudMode'
import StorageModeBadge from '@/components/StorageModeBadge'
import AppNavTabs from '@/components/AppNavTabs'
import NewCustomerModal from '@/components/NewCustomerModal'

export default function CustomersPage() {
  const router = useRouter()
  const isCloud = useCloudMode()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const loadData = useCallback(async () => {
    const [cs, ps] = await Promise.all([getCustomers(), getProjects()])
    setCustomers(cs)
    const counts: Record<string, number> = {}
    ps.forEach((p: Project) => {
      if (p.customerId) counts[p.customerId] = (counts[p.customerId] ?? 0) + 1
    })
    setProjectCounts(counts)
  }, [])

  useEffect(() => {
    if (isCloud === null) return
    if (!isCloud) { router.push('/projects'); return }
    setMounted(true)
    loadData()
  }, [isCloud, loadData, router])

  const filtered = customers.filter((c) => {
    const q = searchQuery.trim().toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || (c.industry?.toLowerCase().includes(q) ?? false)
  })

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">ProjectOS</h1>
            <p className="text-xs text-gray-400">情報を探す時間は、仕事じゃない。</p>
          </div>
          <div className="flex items-center gap-2">
            <StorageModeBadge />
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              顧客を追加
            </button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4">
          <AppNavTabs current="customers" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {customers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-4">🏢</p>
            <h2 className="text-base font-semibold text-gray-700 mb-2">顧客がまだありません</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              顧客を追加して案件と紐付けることで、顧客ごとの取引履歴を管理できます。
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              最初の顧客を追加する
            </button>
          </div>
        ) : (
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
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all"
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
                            {projectCounts[customer.id] ?? 0}
                          </p>
                          <p className="text-xs text-gray-400">案件</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showModal && (
        <NewCustomerModal
          onClose={() => setShowModal(false)}
          onSaved={(c) => {
            setCustomers((prev) => [c, ...prev])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
