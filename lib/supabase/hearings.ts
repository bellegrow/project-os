import { createClient } from './client'
import { Hearing } from '../types'

type HearingRow = {
  id: string
  project_id: string
  date: string
  memo: string
  created_at: string
}

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function fromRow(row: HearingRow): Hearing {
  return {
    id: row.id,
    projectId: row.project_id,
    date: row.date,
    memo: row.memo,
    createdAt: row.created_at,
  }
}

export async function getHearingsByProjectIds(projectIds: string[]): Promise<Hearing[]> {
  if (!isConfigured() || projectIds.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('hearings')
    .select('*')
    .in('project_id', projectIds)
    .order('date', { ascending: false })
  if (error || !data) return []
  return (data as HearingRow[]).map(fromRow)
}

export async function getAllHearings(): Promise<Hearing[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('hearings')
    .select('*')
    .order('date', { ascending: false })
  if (error || !data) return []
  return (data as HearingRow[]).map(fromRow)
}

export async function getHearings(projectId: string): Promise<Hearing[]> {
  if (!isConfigured()) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('hearings')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false })
  if (error || !data) return []
  return (data as HearingRow[]).map(fromRow)
}

export async function createHearing(
  input: Omit<Hearing, 'id' | 'createdAt'>
): Promise<Hearing | undefined> {
  if (!isConfigured()) return undefined
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hearings')
    .insert({
      project_id: input.projectId,
      date: input.date,
      memo: input.memo,
    })
    .select()
    .single()
  if (error || !data) return undefined

  // 案件の updated_at を更新して一覧での並び順に反映させる
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.projectId)

  return fromRow(data as HearingRow)
}

export async function updateHearing(id: string, memo: string, date?: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()
  const patch: Record<string, string> = { memo }
  if (date !== undefined) patch.date = date
  await supabase.from('hearings').update(patch).eq('id', id)
}

export async function deleteHearing(id: string): Promise<void> {
  if (!isConfigured()) return
  const supabase = createClient()

  // 案件IDを先に取得して updated_at をバンプする
  const { data } = await supabase
    .from('hearings')
    .select('project_id')
    .eq('id', id)
    .single()

  await supabase.from('hearings').delete().eq('id', id)

  if (data?.project_id) {
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.project_id)
  }
}
