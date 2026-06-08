'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import AppShell from '@/components/AppShell'

type MeetingStatus = 'completed' | 'action_required' | 'in_progress'

interface Meeting {
  id: string
  client: string
  project: string
  projectId: string
  date: string
  attendees: string
  summary: string
  nextAction: string
  status: MeetingStatus
}

const DEMO_MEETINGS: Meeting[] = [
  {
    id: '1',
    client: '田中工務店',
    project: '採用サイト制作',
    projectId: 'demo',
    date: '2026-06-07',
    attendees: '田中社長（先方）、渡辺（担当）',
    summary: '採用ターゲット（20代〜30代の施工職）の確認。競合他社サイトのリサーチ結果を共有。見積額について要相談。',
    nextAction: '見積書の送付（6/8まで）',
    status: 'action_required',
  },
  {
    id: '2',
    client: '山田デザイン事務所',
    project: 'LP制作',
    projectId: 'demo',
    date: '2026-06-06',
    attendees: '山田様（先方）、佐藤（担当）',
    summary: 'ファーストビューのコピーについて3案から1案に絞り込み。CTAボタンの配色変更を要望。',
    nextAction: '修正稿の提出（6/10まで）',
    status: 'action_required',
  },
  {
    id: '3',
    client: '山田建設株式会社',
    project: 'コーポレートサイト大規模リニューアル',
    projectId: 'demo',
    date: '2026-06-05',
    attendees: '人事部・田中様（先方）、山田（担当）',
    summary: 'ブランドカラーとロゴ使用ガイドラインの確認。CMSの選定についてはWordPressで合意。ワイヤーフレームv2の確認を実施。',
    nextAction: 'コーディング着手 → 6/20までにβ版提出',
    status: 'in_progress',
  },
  {
    id: '4',
    client: 'BELLE美容室',
    project: 'ホームページ制作',
    projectId: 'demo',
    date: '2026-05-28',
    attendees: '代表 松本様（先方）、佐藤（担当）',
    summary: '初回ヒアリング。ターゲットは近隣30代女性。予約システム（RESERVE）との連携要望あり。競合3社のデザイン分析共有。',
    nextAction: 'ヒアリングシート送付済 → 企画書作成中',
    status: 'in_progress',
  },
  {
    id: '5',
    client: 'さくら整体院',
    project: 'ホームページリニューアル',
    projectId: 'demo',
    date: '2026-05-15',
    attendees: '院長 鈴木様（先方）、渡辺（担当）',
    summary: 'デザイン最終確認。スマホ表示・予約フォームのテスト実施。軽微な修正指示あり（電話番号サイズ変更）。',
    nextAction: '修正対応完了・最終納品済み',
    status: 'completed',
  },
  {
    id: '6',
    client: '株式会社サンプル',
    project: '採用特設サイト制作',
    projectId: 'demo',
    date: '2026-05-10',
    attendees: '採用担当・中村様（先方）、山田（担当）',
    summary: '採用フロー・エントリーフォームの仕様確認。写真素材は先方から支給予定。公開日は7月初旬で合意。',
    nextAction: '最終納品・先方確認済み',
    status: 'completed',
  },
]

const STATUS_CONFIG: Record<MeetingStatus, { label: string; icon: React.ElementType; cls: string; iconCls: string }> = {
  action_required: { label: '要アクション', icon: AlertCircle,   cls: 'bg-red-50 text-red-700 border-red-200',     iconCls: 'text-red-500' },
  in_progress:     { label: '進行中',       icon: Clock,         cls: 'bg-amber-50 text-amber-700 border-amber-200', iconCls: 'text-amber-500' },
  completed:       { label: '完了',         icon: CheckCircle2,  cls: 'bg-gray-50 text-gray-500 border-gray-200',    iconCls: 'text-gray-400' },
}

const FILTERS: { key: MeetingStatus | 'all'; label: string }[] = [
  { key: 'all',             label: 'すべて' },
  { key: 'action_required', label: '要アクション' },
  { key: 'in_progress',     label: '進行中' },
  { key: 'completed',       label: '完了' },
]

function formatDate(d: string) {
  const dt = new Date(d)
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`
}

export default function MeetingsPage() {
  const [filter, setFilter] = useState<MeetingStatus | 'all'>('all')

  const filtered = filter === 'all' ? DEMO_MEETINGS : DEMO_MEETINGS.filter(m => m.status === filter)
  const actionCount = DEMO_MEETINGS.filter(m => m.status === 'action_required').length

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-8">

        {/* ページタイトル */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-700" />
              打ち合わせ記録
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              全{DEMO_MEETINGS.length}件
              {actionCount > 0 && (
                <span className="ml-2 text-red-500 font-medium">
                  要アクション {actionCount}件
                </span>
              )}
            </p>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex bg-white border border-gray-200 rounded-xl mb-4 p-1 gap-1 max-w-sm">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors ${
                filter === f.key ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 一覧 */}
        <div className="space-y-3">
          {filtered.map(meeting => {
            const st = STATUS_CONFIG[meeting.status]
            return (
              <div key={meeting.id} className={`bg-white rounded-xl border p-4 ${
                meeting.status === 'action_required' ? 'border-red-200' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">{formatDate(meeting.date)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {meeting.client} / {meeting.project}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">参加者：{meeting.attendees}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">{meeting.summary}</p>

                {/* 次回アクション */}
                <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                  meeting.status === 'action_required'
                    ? 'bg-red-50 text-red-700'
                    : meeting.status === 'in_progress'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-gray-50 text-gray-500'
                }`}>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="font-medium">{meeting.nextAction}</span>
                </div>
              </div>
            )
          })}
        </div>

      </main>
    </AppShell>
  )
}
