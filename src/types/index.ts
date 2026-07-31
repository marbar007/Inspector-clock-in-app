export type { Role, EntryStatus, ProfileRow, CompanyRow, TimeEntryRow } from './database'
import type { CompanyRow, ProfileRow, TimeEntryRow } from './database'

export interface TimeEntryWithRelations extends TimeEntryRow {
  company: CompanyRow
  inspector: ProfileRow
}

export const ESTIMATE_OPTIONS_MINUTES = Array.from(
  { length: 10 },
  (_, i) => (i + 1) * 30
)
