export type ProjectStatus = '商談中' | '提案済' | '受注' | '進行中' | '完了' | '失注'

export interface Project {
  id: string
  clientName: string
  name: string
  status: ProjectStatus
  budget?: number
  createdAt: string
  updatedAt: string
}

export interface Hearing {
  id: string
  projectId: string
  date: string
  memo: string
  createdAt: string
}

export interface ProposalDraft {
  id: string
  projectId: string
  content: string
  createdAt: string
}
