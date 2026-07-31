import { useEffect, useState } from 'react'
import type { CompanyRow, EntryStatus, ProfileRow } from '../../types/database'
import type { TimeEntryWithRelations } from '../../types'
import { fetchRecentEntries, updateEntry, deleteEntry } from '../../lib/queries'
import { formatDateLabel, formatHours } from '../../lib/utils'

interface EntriesTableProps {
  companies: CompanyRow[]
  inspectors: ProfileRow[]
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

const STATUS_OPTIONS: EntryStatus[] = ['scheduled', 'open', 'completed', 'needs_adjustment']

export default function EntriesTable({ companies, inspectors }: EntriesTableProps) {
  const [entries, setEntries] = useState<TimeEntryWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const data = await fetchRecentEntries(100)
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function inspectorName(id: string) {
    return inspectors.find((p) => p.id === id)?.full_name || inspectors.find((p) => p.id === id)?.email || '—'
  }

  function startEdit(entry: TimeEntryWithRelations) {
    setEditingId(entry.id)
    setDraft({
      company_id: entry.company_id,
      inspection_address: entry.inspection_address,
      status: entry.status,
      clock_in: toLocalInputValue(entry.clock_in),
      clock_out: toLocalInputValue(entry.clock_out),
      notes: entry.notes ?? '',
    })
    setError(null)
  }

  async function saveEdit(entry: TimeEntryWithRelations) {
    try {
      await updateEntry(entry.id, {
        company_id: draft.company_id,
        inspection_address: draft.inspection_address,
        status: draft.status as EntryStatus,
        clock_in: draft.clock_in ? new Date(draft.clock_in).toISOString() : null,
        clock_out: draft.clock_out ? new Date(draft.clock_out).toISOString() : null,
        notes: draft.notes || null,
      })
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function handleDelete(entry: TimeEntryWithRelations) {
    if (!confirm(`Delete the inspection at ${entry.inspection_address}? This cannot be undone.`)) return
    await deleteEntry(entry.id)
    await load()
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">All Inspections</h2>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Inspector</th>
              <th className="py-2 pr-3">Company</th>
              <th className="py-2 pr-3">Address</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Hours</th>
              <th className="py-2 pr-3">Notes</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isEditing = editingId === entry.id
                const dateSource = entry.clock_in ?? entry.scheduled_date
                return (
                  <tr key={entry.id} className="border-b border-neutral-100 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap text-neutral-600">
                      {dateSource ? formatDateLabel(dateSource) : '—'}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-neutral-600">
                      {inspectorName(entry.inspector_id)}
                    </td>
                    <td className="py-2 pr-3">
                      {isEditing ? (
                        <select
                          value={draft.company_id}
                          onChange={(e) => setDraft((d) => ({ ...d, company_id: e.target.value }))}
                          className="rounded border border-neutral-300 px-1.5 py-1 text-sm"
                        >
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.company.color_hex }}
                          />
                          {entry.company.name}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 min-w-[160px]">
                      {isEditing ? (
                        <input
                          value={draft.inspection_address}
                          onChange={(e) => setDraft((d) => ({ ...d, inspection_address: e.target.value }))}
                          className="w-full rounded border border-neutral-300 px-1.5 py-1 text-sm"
                        />
                      ) : (
                        entry.inspection_address
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {isEditing ? (
                        <select
                          value={draft.status}
                          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                          className="rounded border border-neutral-300 px-1.5 py-1 text-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        entry.status
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatHours(entry.hours)}</td>
                    <td className="py-2 pr-3 min-w-[140px]">
                      {isEditing ? (
                        <textarea
                          value={draft.notes}
                          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                          rows={2}
                          className="w-full rounded border border-neutral-300 px-1.5 py-1 text-sm"
                        />
                      ) : (
                        <span className="line-clamp-2 text-neutral-500">{entry.notes || '—'}</span>
                      )}
                    </td>
                    <td className="py-2 pr-1 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => saveEdit(entry)}
                            className="rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => startEdit(entry)}
                            className="rounded border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry)}
                            className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
