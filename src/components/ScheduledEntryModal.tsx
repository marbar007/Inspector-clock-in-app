import { useState } from 'react'
import Modal from './Modal'
import type { TimeEntryWithRelations } from '../types'
import { ESTIMATE_OPTIONS_MINUTES } from '../types'
import { estimateLabel, formatDateLabel, formatTimeString } from '../lib/utils'
import { clockInScheduledEntry, fetchBlockingEntry } from '../lib/queries'

interface ScheduledEntryModalProps {
  entry: TimeEntryWithRelations
  onClose: () => void
  onClockedIn: () => void
}

export default function ScheduledEntryModal({ entry, onClose, onClockedIn }: ScheduledEntryModalProps) {
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClockIn() {
    setError(null)
    setLoading(true)
    try {
      const blocking = await fetchBlockingEntry(entry.inspector_id)
      if (blocking && blocking.id !== entry.id) {
        setError(
          blocking.status === 'needs_adjustment'
            ? 'Fix the previous inspection clock-out before starting a new one.'
            : 'There is already an open inspection. Clock out before starting another.'
        )
        setLoading(false)
        return
      }
      await clockInScheduledEntry(entry.id, estimatedMinutes)
      onClockedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Scheduled Inspection" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.company.color_hex }}
          />
          <span className="font-semibold text-neutral-900">{entry.company.name}</span>
        </div>

        <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">{entry.inspection_address}</p>
          <p className="mt-1 text-neutral-500">
            {entry.scheduled_date && formatDateLabel(entry.scheduled_date)} ·{' '}
            {formatTimeString(entry.arrival_start)} – {formatTimeString(entry.arrival_end)}
          </p>
        </div>

        {entry.notes && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Notes</p>
            <p className="text-sm text-neutral-700">{entry.notes}</p>
          </div>
        )}

        <div className="border-t border-neutral-200 pt-4">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Estimated completion time
          </label>
          <select
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          >
            {ESTIMATE_OPTIONS_MINUTES.map((m) => (
              <option key={m} value={m}>
                {estimateLabel(m)}
              </option>
            ))}
          </select>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleClockIn}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-yellow-300 disabled:opacity-60"
          >
            {loading ? 'Clocking in…' : 'Clock In'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
