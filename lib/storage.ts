import { Project, Hearing, ProposalDraft } from './types'

const KEYS = {
  PROJECTS: 'pos_projects',
  HEARINGS: 'pos_hearings',
  DRAFTS: 'pos_drafts',
}

function getAll<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(items))
}

// Projects
export function getProjects(): Project[] {
  return getAll<Project>(KEYS.PROJECTS).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getProject(id: string): Project | undefined {
  return getAll<Project>(KEYS.PROJECTS).find((p) => p.id === id)
}

export function createProject(
  data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Project {
  const now = new Date().toISOString()
  const project: Project = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  saveAll(KEYS.PROJECTS, [...getAll<Project>(KEYS.PROJECTS), project])
  return project
}

export function updateProjectStatus(id: string, status: Project['status']): void {
  saveAll(
    KEYS.PROJECTS,
    getAll<Project>(KEYS.PROJECTS).map((p) =>
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
    )
  )
}

export function updateProject(
  id: string,
  data: Partial<Pick<Project, 'clientName' | 'name' | 'budget' | 'status'>>
): Project | undefined {
  const now = new Date().toISOString()
  const all = getAll<Project>(KEYS.PROJECTS).map((p) =>
    p.id === id ? { ...p, ...data, updatedAt: now } : p
  )
  saveAll(KEYS.PROJECTS, all)
  return all.find((p) => p.id === id)
}

export function deleteProject(id: string): void {
  saveAll(KEYS.PROJECTS, getAll<Project>(KEYS.PROJECTS).filter((p) => p.id !== id))
  saveAll(KEYS.HEARINGS, getAll<Hearing>(KEYS.HEARINGS).filter((h) => h.projectId !== id))
  saveAll(KEYS.DRAFTS, getAll<ProposalDraft>(KEYS.DRAFTS).filter((d) => d.projectId !== id))
}

export function updateHearing(id: string, memo: string): void {
  saveAll(
    KEYS.HEARINGS,
    getAll<Hearing>(KEYS.HEARINGS).map((h) =>
      h.id === id ? { ...h, memo } : h
    )
  )
}

// Hearings
export function getHearings(projectId: string): Hearing[] {
  return getAll<Hearing>(KEYS.HEARINGS)
    .filter((h) => h.projectId === projectId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function createHearing(data: Omit<Hearing, 'id' | 'createdAt'>): Hearing {
  const now = new Date().toISOString()
  const hearing: Hearing = { ...data, id: crypto.randomUUID(), createdAt: now }
  saveAll(KEYS.HEARINGS, [...getAll<Hearing>(KEYS.HEARINGS), hearing])
  // bump project updatedAt
  saveAll(
    KEYS.PROJECTS,
    getAll<Project>(KEYS.PROJECTS).map((p) =>
      p.id === data.projectId ? { ...p, updatedAt: now } : p
    )
  )
  return hearing
}

export function deleteHearing(id: string): void {
  const all = getAll<Hearing>(KEYS.HEARINGS)
  const hearing = all.find((h) => h.id === id)
  if (!hearing) return
  saveAll(KEYS.HEARINGS, all.filter((h) => h.id !== id))
  saveAll(
    KEYS.PROJECTS,
    getAll<Project>(KEYS.PROJECTS).map((p) =>
      p.id === hearing.projectId ? { ...p, updatedAt: new Date().toISOString() } : p
    )
  )
}

// Proposal Drafts
export function getDrafts(projectId: string): ProposalDraft[] {
  return getAll<ProposalDraft>(KEYS.DRAFTS)
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function saveDraft(projectId: string, content: string): ProposalDraft {
  const now = new Date().toISOString()
  const draft: ProposalDraft = { id: crypto.randomUUID(), projectId, content, createdAt: now }
  saveAll(KEYS.DRAFTS, [draft, ...getAll<ProposalDraft>(KEYS.DRAFTS)])
  return draft
}
