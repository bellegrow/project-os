import { createClient } from './client'
import { ProjectFile, ProjectFileInput, ProjectFileUpdateInput, FileCategory } from '../types'

type FileRow = {
  id: string
  project_id: string
  customer_id: string | null
  name: string
  category: string
  file_type: string | null
  file_size: number | null
  storage_path: string | null
  public_url: string | null
  external_url: string | null
  note: string | null
  created_at: string
  updated_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: FileRow): ProjectFile {
  return {
    id: row.id,
    projectId: row.project_id,
    customerId: row.customer_id ?? undefined,
    name: row.name,
    category: (row.category as FileCategory) ?? 'other',
    fileType: row.file_type ?? undefined,
    fileSize: row.file_size ?? undefined,
    storagePath: row.storage_path ?? undefined,
    publicUrl: row.public_url ?? undefined,
    externalUrl: row.external_url ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getAllProjectFiles(): Promise<ProjectFile[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  // TODO: v1.4+ — .eq('organization_id', organizationId) でテナント分離フィルタを追加
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as FileRow[]).map(fromRow)
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as FileRow[]).map(fromRow)
}

export async function getProjectFilesByCustomer(customerId: string): Promise<ProjectFile[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as FileRow[]).map(fromRow)
}

export async function createProjectFile(input: ProjectFileInput): Promise<ProjectFile | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return undefined
  const { data, error } = await supabase
    .from('project_files')
    .insert({
      user_id: session.user.id,
      project_id: input.projectId,
      customer_id: input.customerId ?? null,
      name: input.name,
      category: input.category ?? 'other',
      file_type: input.fileType ?? null,
      file_size: input.fileSize ?? null,
      storage_path: input.storagePath ?? null,
      public_url: input.publicUrl ?? null,
      external_url: input.externalUrl ?? null,
      note: input.note ?? null,
    })
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as FileRow)
}

export async function updateProjectFile(id: string, input: ProjectFileUpdateInput): Promise<ProjectFile | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined) patch.name = input.name
  if (input.category !== undefined) patch.category = input.category
  if (input.externalUrl !== undefined) patch.external_url = input.externalUrl
  if (input.note !== undefined) patch.note = input.note
  const { data, error } = await supabase
    .from('project_files')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return undefined
  return fromRow(data as FileRow)
}

export async function deleteProjectFile(id: string, storagePath?: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  if (storagePath) {
    await supabase.storage.from('project-files').remove([storagePath])
  }
  await supabase.from('project_files').delete().eq('id', id)
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  meta: { name?: string; customerId?: string; category?: FileCategory; note?: string }
): Promise<ProjectFile | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return undefined

  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : ''
  const storagePath = `${session.user.id}/${projectId}/${Date.now()}${ext}`

  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(storagePath, file, { upsert: false })
  if (uploadError) return undefined

  return createProjectFile({
    projectId,
    customerId: meta.customerId,
    name: meta.name ?? file.name,
    category: meta.category ?? 'other',
    fileType: file.type || undefined,
    fileSize: file.size,
    storagePath,
    note: meta.note,
  })
}

export async function getProjectFileUrl(storagePath: string): Promise<string | null> {
  if (!isConfigured()) return null
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('project-files')
    .createSignedUrl(storagePath, 3600)
  if (error || !data) return null
  return data.signedUrl
}
