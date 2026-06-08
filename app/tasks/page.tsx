'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ListTodo, Pencil, Trash2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Task, Project, TaskStatus } from '@/lib/types'
import { getAllTasks, getProjects, updateTask, deleteTask } from '@/lib/dataSource'
import { formatYMD } from '@/lib/utils'
import AppShell from '@/components/AppShell'
import TaskModal from '@/components/TaskModal'

// ── 定数 ────────────────────────────────────────────────────────────────────

const COLUMNS: { key: TaskStatus; label: string; headerCls: string }[] = [
  { key: 'todo',        label: '未対応', headerCls: 'text-gray-700'  },
  { key: 'in_progress', label: '進行中', headerCls: 'text-blue-600'  },
  { key: 'done',        label: '完了',   headerCls: 'text-green-600' },
]

const PRIORITY_LABEL: Record<Task['priority'], string> = { high: '高', medium: '中', low: '低' }

function priorityCls(p: Task['priority']): string {
  return p === 'high'
    ? 'bg-red-100 text-red-700'
    : p === 'medium'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-500'
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo:        'in_progress',
  in_progress: 'done',
  done:        'todo',
}

const STATUS_ACTION: Record<TaskStatus, { label: string; cls: string }> = {
  todo:        { label: '→ 進行中', cls: 'text-blue-600 border-blue-200 hover:bg-blue-50'  },
  in_progress: { label: '✓ 完了',  cls: 'text-green-600 border-green-200 hover:bg-green-50' },
  done:        { label: '↩ 未対応', cls: 'text-gray-500 border-gray-200 hover:bg-gray-50'  },
}

function sortTasks(tasks: Task[], today: string): Task[] {
  return [...tasks].sort((a, b) => {
    const aOver = a.dueDate && a.dueDate < today ? 1 : 0
    const bOver = b.dueDate && b.dueDate < today ? 1 : 0
    if (aOver !== bOver) return bOver - aOver
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    const pOrder: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 }
    return pOrder[a.priority] - pOrder[b.priority]
  })
}

// ── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({
  task, project, today, onStatus, onEdit, onDelete,
}: {
  task:     Task
  project:  Project | undefined
  today:    string
  onStatus: (task: Task, next: TaskStatus) => void
  onEdit:   (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const overdue = task.status !== 'done' && !!task.dueDate && task.dueDate < today
  const isToday = task.status !== 'done' && task.dueDate === today
  const isDone  = task.status === 'done'
  const action  = STATUS_ACTION[task.status]

  return (
    <div className={`bg-white rounded-xl border p-3 space-y-2 ${
      isDone   ? 'border-gray-100 opacity-60' :
      overdue  ? 'border-red-200 bg-red-50/30' :
                 'border-gray-200'
    }`}>

      {/* タイトル + 優先度 */}
      <div className="flex items-start gap-2">
        <p className={`flex-1 text-sm font-medium leading-snug min-w-0 ${
          isDone  ? 'line-through text-gray-400' :
          overdue ? 'text-red-700' :
                    'text-gray-900'
        }`}>
          {task.title}
        </p>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${priorityCls(task.priority)}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      {/* 案件リンク */}
      {project && (
        <Link
          href={`/projects/${project.id}`}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors w-fit max-w-full"
        >
          <ArrowRight className="w-3 h-3 shrink-0" />
          <span className="truncate">{project.clientName} / {project.name}</span>
        </Link>
      )}

      {/* 期限 */}
      {task.dueDate && (
        <p className={`text-xs flex items-center gap-1 ${
          overdue ? 'text-red-500 font-medium' :
          isToday ? 'text-amber-600 font-medium' :
                    'text-gray-400'
        }`}>
          {overdue && <AlertTriangle className="w-3 h-3 shrink-0" />}
          期限：{formatYMD(task.dueDate)}
          {overdue && '（超過）'}
          {isToday && '（今日）'}
        </p>
      )}

      {/* 説明 */}
      {task.description && (
        <p className="text-xs text-gray-400 truncate">{task.description}</p>
      )}

      {/* 操作行 */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
        <button
          onClick={() => onStatus(task, NEXT_STATUS[task.status])}
          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${action.cls}`}
        >
          {action.label}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onEdit(task)}
            className="p-2 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="編集"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-2 sm:p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="削除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks,        setTasks]        = useState<Task[]>([])
  const [projects,     setProjects]     = useState<Project[]>([])
  const [mounted,      setMounted]      = useState(false)
  const [activeTab,    setActiveTab]    = useState<TaskStatus>('todo')
  const [editingTask,  setEditingTask]  = useState<Task | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    setMounted(true)
    Promise.all([getAllTasks(), getProjects()]).then(([t, p]) => {
      setTasks(t)
      setProjects(p)
    })
  }, [])

  const projectMap = useMemo(
    () => new Map(projects.map(p => [p.id, p])),
    [projects],
  )

  const byStatus = useMemo(() => ({
    todo:        sortTasks(tasks.filter(t => t.status === 'todo'),        today),
    in_progress: sortTasks(tasks.filter(t => t.status === 'in_progress'), today),
    done:        sortTasks(tasks.filter(t => t.status === 'done'),        today),
  }), [tasks, today])

  const overdueCount = useMemo(
    () => tasks.filter(t => t.status !== 'done' && !!t.dueDate && t.dueDate < today).length,
    [tasks, today],
  )

  async function handleStatus(task: Task, next: TaskStatus) {
    const updated = await updateTask(task.id, { status: next })
    if (updated) setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`「${task.title}」を削除しますか？`)) return
    await deleteTask(task.id)
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  function handleSaved(saved: Task) {
    setTasks(prev => prev.map(t => t.id === saved.id ? saved : t))
    setEditingTask(null)
  }

  if (!mounted) return null

  const totalActive = byStatus.todo.length + byStatus.in_progress.length

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-6 lg:max-w-7xl lg:px-8">

        {/* ページタイトル */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-gray-700" />
              タスク
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              対応中 {totalActive} 件
              {overdueCount > 0 && (
                <span className="ml-2 text-red-500 font-medium inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  期限超過 {overdueCount} 件
                </span>
              )}
            </p>
          </div>
        </div>

        {/* PC：3カラム */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
          {COLUMNS.map(col => (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className={`text-sm font-bold ${col.headerCls}`}>{col.label}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                  {byStatus[col.key].length}
                </span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {byStatus[col.key].length === 0 ? (
                  <div className="text-xs text-gray-300 text-center py-10 border border-dashed border-gray-200 rounded-xl bg-white">
                    タスクなし
                  </div>
                ) : (
                  byStatus[col.key].map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={projectMap.get(task.projectId)}
                      today={today}
                      onStatus={handleStatus}
                      onEdit={setEditingTask}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* スマホ：タブ切り替え */}
        <div className="lg:hidden">
          <div className="flex bg-white border border-gray-200 rounded-xl mb-4 p-1 gap-1">
            {COLUMNS.map(col => (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className={`flex-1 py-2 px-1 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === col.key
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {col.label}
                <span className={`ml-1 ${activeTab === col.key ? 'text-gray-600' : 'text-gray-300'}`}>
                  ({byStatus[col.key].length})
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {byStatus[activeTab].length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">タスクなし</p>
            ) : (
              byStatus[activeTab].map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={projectMap.get(task.projectId)}
                  today={today}
                  onStatus={handleStatus}
                  onEdit={setEditingTask}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {editingTask && (
        <TaskModal
          task={editingTask}
          projectId={editingTask.projectId}
          customerId={editingTask.customerId}
          onClose={() => setEditingTask(null)}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  )
}
