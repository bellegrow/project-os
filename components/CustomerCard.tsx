'use client'

import { Building2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Customer } from '@/lib/types'

interface Props {
  customer: Customer
}

export default function CustomerCard({ customer }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-400 mb-3">顧客</p>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-900 truncate">
              {customer.name}
            </span>
          </div>
          {customer.industry && (
            <p className="text-xs text-gray-500 pl-5">{customer.industry}</p>
          )}
          {customer.website && (
            <a
              href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 pl-5 mt-0.5 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {customer.website}
            </a>
          )}
        </div>
        <Link
          href={`/customers/${customer.id}`}
          className="shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          詳細 →
        </Link>
      </div>
    </div>
  )
}
