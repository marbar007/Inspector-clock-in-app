import type { TimeEntryWithRelations } from '../types'
import { formatDateLabel, formatHours } from '../lib/utils'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-neutral-100 text-neutral-600',
  open: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-700',
  needs_adjustment: 'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  open: 'In progress',
  completed: 'Completed',
  needs_adjustment: 'Needs adjustment',
}

export default function RecentEntries({ entries }: { entries: TimeEntryWithRelations[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">Recent Entries</h2>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">No inspections yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {entries.map((e) => {
            const dateSource = e.clock_in ?? e.scheduled_date
            return (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: e.company.color_hex }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {e.company.name} · {e.inspection_address}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {dateSource ? formatDateLabel(dateSource) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-700">{formatHours(e.hours)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[e.status]}`}>
                    {STATUS_LABELS[e.status]}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
