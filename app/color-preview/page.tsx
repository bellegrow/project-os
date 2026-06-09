'use client'

const COLORS = [
  { label: 'slate-200',  sidebar: 'bg-slate-200',  border: 'border-slate-300', text: 'text-slate-700', active: 'bg-white',        sub: '（現在のお気に入り）青みグレー' },
  { label: 'zinc-200',   sidebar: 'bg-zinc-200',   border: 'border-zinc-300',  text: 'text-zinc-700',  active: 'bg-white',        sub: 'slateより少し暖かめ' },
  { label: 'gray-200',   sidebar: 'bg-gray-200',   border: 'border-gray-300',  text: 'text-gray-700',  active: 'bg-white',        sub: 'ニュートラルなグレー' },
  { label: 'stone-200',  sidebar: 'bg-stone-200',  border: 'border-stone-300', text: 'text-stone-700', active: 'bg-white',        sub: 'ベージュがかった暖色系' },
  { label: 'blue-100',   sidebar: 'bg-blue-100',   border: 'border-blue-200',  text: 'text-blue-800',  active: 'bg-white',        sub: '薄い青・清潔感' },
  { label: 'indigo-100', sidebar: 'bg-indigo-100', border: 'border-indigo-200',text: 'text-indigo-800',active: 'bg-white',        sub: '青紫・モダンSaaS感' },
  { label: 'violet-100', sidebar: 'bg-violet-100', border: 'border-violet-200',text: 'text-violet-800',active: 'bg-white',        sub: '薄い紫・個性的' },
]

const NAV_ITEMS = ['概況', '顧客管理', '案件管理', 'タスク管理', '打ち合わせ', '見積・請求', '契約書']

function MiniSidebar({ color }: { color: typeof COLORS[number] }) {
  return (
    <div className="flex rounded-xl overflow-hidden shadow-md border border-gray-200 h-52">
      {/* サイドバー */}
      <div className={`${color.sidebar} ${color.border} border-r w-28 flex flex-col p-1.5 gap-0.5 shrink-0`}>
        <div className={`${color.border} border-b pb-1.5 mb-1 px-1`}>
          <div className={`text-[9px] font-bold ${color.text}`}>ProjectOS</div>
        </div>
        {NAV_ITEMS.map((item, i) => (
          <div
            key={item}
            className={`text-[8px] px-1.5 py-1 rounded-md ${
              i === 0
                ? `bg-white font-semibold ${color.text} shadow-sm`
                : `${color.text} opacity-70`
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      {/* コンテンツ */}
      <div className="bg-gray-50 flex-1 p-2">
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="grid grid-cols-2 gap-1.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-1.5 shadow-sm">
              <div className="h-1.5 bg-gray-200 rounded w-2/3 mb-1" />
              <div className="h-2 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ColorPreviewPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">サイドバー カラー比較</h1>
      <p className="text-sm text-gray-500 mb-8">気に入った色の名前を伝えてください</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {COLORS.map((color) => (
          <div key={color.label}>
            <MiniSidebar color={color} />
            <div className="mt-2">
              <p className="text-sm font-semibold text-gray-800">{color.label}</p>
              <p className="text-xs text-gray-500">{color.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
