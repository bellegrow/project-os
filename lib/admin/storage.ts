import { Tenant, TenantInput, TenantStatus } from './types'
import { demoTenants } from './demoData'

const STORAGE_KEY = 'pos_admin_tenants'

function loadAll(): Tenant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return demoTenants
    return JSON.parse(raw) as Tenant[]
  } catch {
    return demoTenants
  }
}

function saveAll(tenants: Tenant[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants))
  } catch {}
}

export function getTenants(): Tenant[] {
  return loadAll()
}

export function createTenant(input: TenantInput): Tenant {
  const now = new Date().toISOString()
  const tenant: Tenant = {
    id: crypto.randomUUID(),
    companyName: input.companyName,
    contactName: input.contactName,
    email: input.email,
    plan: input.plan,
    status: 'invited',
    createdAt: now,
    updatedAt: now,
  }
  const all = loadAll()
  saveAll([tenant, ...all])
  return tenant
}

export function updateTenantStatus(id: string, status: TenantStatus): void {
  const all = loadAll()
  saveAll(
    all.map(t =>
      t.id === id
        ? { ...t, status, updatedAt: new Date().toISOString() }
        : t
    )
  )
}
