import { useMemo, useState } from 'react'
import { fetchAllEntriesInRange } from '../../lib/queries'
import type { TimeEntryWithRelations } from '../../types'
import type { CompanyRow } from '../../types/database'
import { formatClock, formatDateLabel, toIsoDate } from '../../lib/utils'

interface ReportsProps {
  companies: CompanyRow[]
  isAdmin: boolean
}

function startOfThisMonthIso() {
  const d = new Date()
  return toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1))
}

export default function Reports({ companies, isAdmin }: ReportsProps) {
  const [start, setStart] = useState(startOfThisMonthIso())
  const [end, setEnd] = useState(toIsoDate(new Date()))
  const [companyId, setCompanyId] = useState('')
  const [entries, setEntries] = useState<TimeEntryWithRelations[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function runReport() {
    setLoading(true)
    const data = await fetchAllEntriesInRange(start, end)
    setEntries(data)
    setLoading(false)
  }

  const filteredEntries = useMemo(() => {
    if (!entries) return null
    if (!companyId) return entries
    return entries.filter((e) => e.company_id === companyId)
  }, [entries, companyId])

  const byCompany = new Map<string, { name: string; hours: number }>()
  const byInspector = new Map<string, { name: string; hours: number }>()

  filteredEntries?.forEach((e) => {
    const hours = e.hours ?? 0
    const company = byCompany.get(e.company_id) ?? { name: e.company.name, hours: 0 }
    company.hours += hours
    byCompany.set(e.company_id, company)

    const inspectorName = e.inspector.full_name || e.inspector.email || 'Unknown'
    const inspector = byInspector.get(e.inspector_id) ?? { name: inspectorName, hours: 0 }
    inspector.hours += hours
    byInspector.set(e.inspector_id, inspector)
  })

  async function exportXlsx() {
    if (!filteredEntries) return
    const XLSX = await import('xlsx')

    const dataRows: (string | number | null)[][] = [
      ['Date', 'Inspector', 'Company', 'Address', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Notes'],
      ...filteredEntries.map((e) => [
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

    const companyTotals = [...byCompany.values()]
    const overallTotal = companyTotals.reduce((sum, c) => sum + c.hours, 0)
    const totalsRows: (string | number)[][] = [
      ['Company', 'Total Hours'],
      ...companyTotals.map((c) => [c.name, Number(c.hours.toFixed(2))]),
      ['Overall total', Number(overallTotal.toFixed(2))],
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(dataRows), 'Data')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(totalsRows), 'Totals')
    XLSX.writeFile(workbook, `inspections_${start}_to_${end}.xlsx`)
  }

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
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={runReport}
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? 'Running…' : 'Run Report'}
        </button>
        {filteredEntries && (
          <button
            onClick={exportXlsx}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Export Excel
          </button>
        )}
      </div>

      {filteredEntries && (
        <div className={`grid gap-4 ${isAdmin ? 'sm:grid-cols-2' : ''}`}>
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
          {isAdmin && (
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
          )}
        </div>
      )}
    </div>
  )
}
