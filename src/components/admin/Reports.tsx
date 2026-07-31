import { useState } from 'react'
import { fetchAllEntriesInRange } from '../../lib/queries'
import type { TimeEntryWithRelations } from '../../types'
import { downloadCsv, formatClock, formatDateLabel, toIsoDate } from '../../lib/utils'

function startOfThisMonthIso() {
  const d = new Date()
  return toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1))
}

export default function Reports() {
  const [start, setStart] = useState(startOfThisMonthIso())
  const [end, setEnd] = useState(toIsoDate(new Date()))
  const [entries, setEntries] = useState<TimeEntryWithRelations[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function runReport() {
    setLoading(true)
    const data = await fetchAllEntriesInRange(start, end)
    setEntries(data)
    setLoading(false)
  }

  function exportCsv() {
    if (!entries) return
    const rows: (string | number | null)[][] = [
      ['Date', 'Inspector', 'Company', 'Address', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Notes'],
      ...entries.map((e) => [
        e.clock_in ? formatDateLabel(e.clock_in) : e.scheduled_date,
        e.inspector.full_name || e.inspector.email,
        e.company.name,
        e.inspection_address,
        formatClock(e.clock_in),
        formatClock(e.clock_out),
        e.hours,
        e.status,
        e.notes,
      ]),
    ]
    downloadCsv(`inspections_${start}_to_${end}.csv`, rows)
  }

  const byCompany = new Map<string, { name: string; hours: number }>()
  const byInspector = new Map<string, { name: string; hours: number }>()

  entries?.forEach((e) => {
    const hours = e.hours ?? 0
    const company = byCompany.get(e.company_id) ?? { name: e.company.name, hours: 0 }
    company.hours += hours
    byCompany.set(e.company_id, company)

    const inspectorName = e.inspector.full_name || e.inspector.email || 'Unknown'
    const inspector = byInspector.get(e.inspector_id) ?? { name: inspectorName, hours: 0 }
    inspector.hours += hours
    byInspector.set(e.inspector_id, inspector)
  })

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">Reports</h2>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Start date</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">End date</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <button
          onClick={runReport}
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? 'Running…' : 'Run Report'}
        </button>
        {entries && (
          <button
            onClick={exportCsv}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Export CSV
          </button>
        )}
      </div>

      {entries && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Hours by Company
            </h3>
            <ul className="space-y-1 text-sm">
              {[...byCompany.values()].map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span className="text-neutral-600">{c.name}</span>
                  <span className="font-medium text-neutral-900">{c.hours.toFixed(2)}h</span>
                </li>
              ))}
              {byCompany.size === 0 && <li className="text-neutral-400">No data</li>}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Hours by Inspector
            </h3>
            <ul className="space-y-1 text-sm">
              {[...byInspector.values()].map((i) => (
                <li key={i.name} className="flex justify-between">
                  <span className="text-neutral-600">{i.name}</span>
                  <span className="font-medium text-neutral-900">{i.hours.toFixed(2)}h</span>
                </li>
              ))}
              {byInspector.size === 0 && <li className="text-neutral-400">No data</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
