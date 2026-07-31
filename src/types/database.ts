export type Role = 'admin' | 'reviewer' | 'inspector'
export type EntryStatus = 'scheduled' | 'open' | 'completed' | 'needs_adjustment'

export interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  created_at: string
}

export interface CompanyRow {
  id: string
  name: string
  color_hex: string
  active: boolean
  created_at: string
}

export interface TimeEntryRow {
  id: string
  inspector_id: string
  company_id: string
  inspection_address: string
  scheduled_date: string | null
  arrival_start: string | null
  arrival_end: string | null
  clock_in: string | null
  clock_out: string | null
  estimated_minutes: number | null
  auto_stopped: boolean
  hours: number | null
  notes: string | null
  status: EntryStatus
  created_at: string
  updated_at: string
}
