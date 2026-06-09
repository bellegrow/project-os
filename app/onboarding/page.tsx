'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Landmark, Users, Briefcase, ChevronRight, ChevronLeft } from 'lucide-react'
import { getSettings, saveSettings } from '@/lib/settingsSource'
import { createCustomer, createProject, createContact, createTask } from '@/lib/dataSource'
import type { ProjectStatus } from '@/lib/types'

const TOTAL_STEPS = 4

const STEP_META = [
  { icon: Building2, label: '会社情報' },
  { icon: Landmark,  label: '振込先情報' },
  { icon: Users,     label: '最初の顧客' },
  { icon: Briefcase, label: '最初の案件' },
] as const

const PROJECT_STATUSES: ProjectStatus[] = ['商談中', '提案済', '受注', '進行中']

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${props.className ?? ''}`}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props
  return (
    <select
      {...rest}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {children}
    </select>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1: Company
  const [issuerName, setIssuerName]                             = useState('')
  const [issuerRepresentativeName, setIssuerRepresentativeName] = useState('')
  const [issuerEmail, setIssuerEmail]                           = useState('')
  const [issuerPhone, setIssuerPhone]                           = useState('')
  const [issuerAddress, setIssuerAddress]                       = useState('')

  // Step 2: Bank
  const [bankName, setBankName]               = useState('')
  const [bankBranch, setBankBranch]           = useState('')
  const [bankAccountType, setBankAccountType] = useState('普通')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountHolder, setBankAccountHolder] = useState('')

  // Step 3: Customer
  const [customerName, setCustomerName]       = useState('')
  const [customerIndustry, setCustomerIndustry] = useState('')
  const [contactName, setContactName]         = useState('')
  const [contactEmail, setContactEmail]       = useState('')

  // Step 4: Project
  const [projectName, setProjectName]         = useState('')
  const [projectStatus, setProjectStatus]     = useState<ProjectStatus>('商談中')
  const [projectBudget, setProjectBudget]     = useState('')
  const [nextAction, setNextAction]           = useState('')

  const canNext = step === 1 ? issuerName.trim() !== '' : true

  const skip = async () => {
    setSaving(true)
    try {
      const current = await getSettings()
      await saveSettings({ ...current, onboardingCompleted: true })
    } catch {}
    router.replace('/dashboard')
  }

  const complete = async () => {
    setSaving(true)
    try {
      const current = await getSettings()
      await saveSettings({
        ...current,
        issuerName:                issuerName.trim(),
        issuerRepresentativeName:  issuerRepresentativeName.trim(),
        issuerEmail:               issuerEmail.trim(),
        issuerPhone:               issuerPhone.trim(),
        issuerAddress:             issuerAddress.trim(),
        bankName:                  bankName.trim(),
        bankBranch:                bankBranch.trim(),
        bankAccountType,
        bankAccountNumber:         bankAccountNumber.trim(),
        bankAccountHolder:         bankAccountHolder.trim(),
        onboardingCompleted: true,
      })

      let createdCustomerId: string | undefined

      if (customerName.trim()) {
        const customer = await createCustomer({
          name:     customerName.trim(),
          industry: customerIndustry.trim() || undefined,
        })
        if (customer) {
          createdCustomerId = customer.id
          if (contactName.trim()) {
            await createContact({
              customerId: customer.id,
              name:       contactName.trim(),
              email:      contactEmail.trim() || undefined,
            })
          }
        }
      }

      if (projectName.trim()) {
        const project = await createProject({
          name:       projectName.trim(),
          clientName: customerName.trim() || projectName.trim(),
          status:     projectStatus,
          budget:     projectBudget ? Number(projectBudget) : undefined,
          customerId: createdCustomerId,
        })
        if (project && nextAction.trim()) {
          await createTask({
            projectId:  project.id,
            customerId: createdCustomerId,
            title:      nextAction.trim(),
            status:     'todo',
            priority:   'medium',
          })
        }
      }
    } catch (err) {
      console.error('Onboarding error:', err)
    }
    router.replace('/dashboard')
  }

  const StepIcon = STEP_META[step - 1].icon

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-gray-900 tracking-tight">ProjectOS</div>
          <div className="text-sm text-gray-500 mt-1">セットアップウィザード</div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEP_META.map((meta, i) => {
            const n = i + 1
            const done    = n < step
            const current = n === step
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done    ? 'bg-blue-600 text-white' :
                  current ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                            'bg-gray-200 text-gray-400'
                }`}>
                  {done ? '✓' : n}
                </div>
                {i < STEP_META.length - 1 && (
                  <div className={`h-0.5 w-8 ${n < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">ステップ {step} / {TOTAL_STEPS}</div>
              <div className="text-base font-semibold text-gray-900">{STEP_META[step - 1].label}</div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 py-6 space-y-4">

            {step === 1 && (
              <>
                <div>
                  <Label required>会社名 / 屋号</Label>
                  <Input
                    value={issuerName}
                    onChange={e => setIssuerName(e.target.value)}
                    placeholder="例）株式会社サンプル"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>代表者名</Label>
                  <Input
                    value={issuerRepresentativeName}
                    onChange={e => setIssuerRepresentativeName(e.target.value)}
                    placeholder="例）山田 太郎"
                  />
                </div>
                <div>
                  <Label>メールアドレス</Label>
                  <Input
                    type="email"
                    value={issuerEmail}
                    onChange={e => setIssuerEmail(e.target.value)}
                    placeholder="例）info@example.com"
                  />
                </div>
                <div>
                  <Label>電話番号</Label>
                  <Input
                    value={issuerPhone}
                    onChange={e => setIssuerPhone(e.target.value)}
                    placeholder="例）03-1234-5678"
                  />
                </div>
                <div>
                  <Label>住所</Label>
                  <Input
                    value={issuerAddress}
                    onChange={e => setIssuerAddress(e.target.value)}
                    placeholder="例）東京都渋谷区..."
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>銀行名</Label>
                  <Input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="例）三菱UFJ銀行"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>支店名</Label>
                  <Input
                    value={bankBranch}
                    onChange={e => setBankBranch(e.target.value)}
                    placeholder="例）渋谷支店"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>口座種別</Label>
                    <Select value={bankAccountType} onChange={e => setBankAccountType(e.target.value)}>
                      <option value="普通">普通</option>
                      <option value="当座">当座</option>
                    </Select>
                  </div>
                  <div>
                    <Label>口座番号</Label>
                    <Input
                      value={bankAccountNumber}
                      onChange={e => setBankAccountNumber(e.target.value)}
                      placeholder="例）1234567"
                    />
                  </div>
                </div>
                <div>
                  <Label>口座名義</Label>
                  <Input
                    value={bankAccountHolder}
                    onChange={e => setBankAccountHolder(e.target.value)}
                    placeholder="例）カブシキガイシャサンプル"
                  />
                </div>
                <p className="text-xs text-gray-400">振込先情報はあとで設定画面から変更できます。</p>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm text-gray-500">最初の顧客を登録しましょう。あとからでも追加できます。</p>
                <div>
                  <Label>顧客名</Label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="例）株式会社ABC"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>業種</Label>
                  <Input
                    value={customerIndustry}
                    onChange={e => setCustomerIndustry(e.target.value)}
                    placeholder="例）IT・ソフトウェア"
                  />
                </div>
                <div>
                  <Label>担当者名</Label>
                  <Input
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="例）田中 花子"
                  />
                </div>
                <div>
                  <Label>担当者メール</Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="例）tanaka@example.com"
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <p className="text-sm text-gray-500">最初の案件を登録しましょう。あとからでも追加できます。</p>
                <div>
                  <Label>案件名</Label>
                  <Input
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="例）Webサイトリニューアル"
                    autoFocus
                  />
                </div>
                {customerName.trim() && (
                  <div>
                    <Label>顧客</Label>
                    <Input value={customerName} readOnly className="bg-gray-50 text-gray-500 cursor-default" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>ステータス</Label>
                    <Select value={projectStatus} onChange={e => setProjectStatus(e.target.value as ProjectStatus)}>
                      {PROJECT_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>予算（円）</Label>
                    <Input
                      type="number"
                      value={projectBudget}
                      onChange={e => setProjectBudget(e.target.value)}
                      placeholder="例）500000"
                    />
                  </div>
                </div>
                <div>
                  <Label>次のアクション</Label>
                  <Input
                    value={nextAction}
                    onChange={e => setNextAction(e.target.value)}
                    placeholder="例）提案書を送付する"
                  />
                </div>
              </>
            )}
          </div>

          {/* Card footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  戻る
                </button>
              )}
              <button
                onClick={skip}
                disabled={saving}
                className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                スキップ
              </button>
            </div>

            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext || saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={complete}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? '保存中...' : '始める'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          設定はあとから「設定」画面で変更できます。
        </p>
      </div>
    </div>
  )
}
