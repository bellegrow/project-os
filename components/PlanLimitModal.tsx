'use client'

import { ArrowUpCircle } from 'lucide-react'

interface Props {
  activeCount: number
  limit: number
  onClose: () => void
}

export default function PlanLimitModal({ activeCount, limit, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowUpCircle className="w-6 h-6 text-amber-500" />
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-2">
          ベーシックプランの上限に達しました
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          進行中案件は <span className="font-semibold text-gray-800">{limit}件</span> まで作成できます。<br />
          現在 <span className="font-semibold text-amber-600">{activeCount}件</span> が進行中です。
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1.5">スタンダードプラン</p>
            <ul className="space-y-1">
              {['進行中案件 無制限', '月額 ¥2,980', '30日間無料トライアル'].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-5">
          プランのアップグレードについては管理者にお問い合わせください。
        </p>

        <button
          onClick={onClose}
          className="w-full border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
