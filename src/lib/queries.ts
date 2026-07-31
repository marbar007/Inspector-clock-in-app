import { supabase } from './supabase'
import type { EntryStatus } from '../types/database'
import type { TimeEntryWithRelations } from '../types'

const ENTRY_SELECT = '*, company:companies(*), inspector:profiles(*)'

export async function fetchCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchActiveCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchEntriesForRange(startIso: string, endIso: string) {
  const { data, error } = await supabase
    .from('time_entries')
    .select(ENTRY_SELECT)
    .or(
      `and(scheduled_date.gte.${startIso},scheduled_date.lte.${endIso}),and(clock_in.gte.${startIso}T00:00:00,clock_in.lte.${endIso}T23:59:59)`
    )
    .order('scheduled_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as TimeEntryWithRelations[]
}

export async function fetchRecentEntries(limit = 10) {
  const { data, error } = await supabase
    .from('time_entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as TimeEntryWithRelations[]
}

export async function fetchBlockingEntry(inspectorId: string) {
  const { data, error } = await supabase
    .from('time_entries')
    .select(ENTRY_SELECT)
    .eq('inspector_id', inspectorId)
    .in('status', ['open', 'needs_adjustment'])
    .maybeSingle()
  if (error) throw error
  return data as unknown as TimeEntryWithRelations | null
}

export async function fetchAllEntriesInRange(startIso: string, endIso: string) {
  const { data, error } = await supabase
    .from('time_entries')
    .select(ENTRY_SELECT)
    .gte('clock_in', `${startIso}T00:00:00`)
    .lte('clock_in', `${endIso}T23:59:59`)
    .order('clock_in', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as TimeEntryWithRelations[]
}

export async function createScheduledEntry(input: {
  inspector_id: string
  company_id: string
  inspection_address: string
  scheduled_date: string
  arrival_start: string
  arrival_end: string
  notes: string | null
}) {
  const { error } = await supabase.from('time_entries').insert({
    ...input,
    status: 'scheduled',
  })
  if (error) throw error
}

export async function createOpenEntry(input: {
  inspector_id: string
  company_id: string
  inspection_address: string
  estimated_minutes: number
}) {
  const { error } = await supabase.from('time_entries').insert({
    ...input,
    status: 'open',
    clock_in: new Date().toISOString(),
  })
  if (error) throw error
}

export async function clockInScheduledEntry(entryId: string, estimatedMinutes: number) {
  const { error } = await supabase
    .from('time_entries')
    .update({
      status: 'open',
      clock_in: new Date().toISOString(),
      estimated_minutes: estimatedMinutes,
    })
    .eq('id', entryId)
  if (error) throw error
}

export async function clockOutEntry(entryId: string) {
  const { error } = await supabase
    .from('time_entries')
    .update({
      status: 'completed',
      clock_out: new Date().toISOString(),
    })
    .eq('id', entryId)
  if (error) throw error
}

export async function resolveAdjustment(entryId: string, clockOutIso: string) {
  const { error } = await supabase
    .from('time_entries')
    .update({
      status: 'completed',
      clock_out: clockOutIso,
      auto_stopped: false,
    })
    .eq('id', entryId)
  if (error) throw error
}

export async function updateEntry(
  entryId: string,
  patch: Partial<{
    company_id: string
    inspection_address: string
    scheduled_date: string | null
    arrival_start: string | null
    arrival_end: string | null
    clock_in: string | null
    clock_out: string | null
    estimated_minutes: number | null
    notes: string | null
    status: EntryStatus
  }>
) {
  const { error } = await supabase.from('time_entries').update(patch).eq('id', entryId)
  if (error) throw error
}

export async function deleteEntry(entryId: string) {
  const { error } = await supabase.from('time_entries').delete().eq('id', entryId)
  if (error) throw error
}

export async function createCompany(input: { name: string; color_hex: string }) {
  const { error } = await supabase.from('companies').insert(input)
  if (error) throw error
}

export async function updateCompany(
  id: string,
  patch: Partial<{ name: string; color_hex: string; active: boolean }>
) {
  const { error } = await supabase.from('companies').update(patch).eq('id', id)
  if (error) throw error
}
