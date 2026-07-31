import { useState } from 'react'
import Modal from './Modal'
import type { TimeEntryWithRelations } from '../types'
import { formatClock, formatDateLabel } from '../lib/utils'
import { resolveAdjustment } from '../lib/queries'

interface NeedsAdjustmentModalProps {
  entry: TimeEntryWithRelations
  onResolved: () => void
}

function toLocalInputValue(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date()
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export default function NeedsAdjustmentModal({ entry, onResolved }: NeedsAdjustmentModalProps) {
  const [clockOutLocal, setClockOutLocal] = useState(() => toLocalInputValue(entry.clock_out))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setError(null)
    const clockOutDate = new Date(clockOutLocal)

    if (entry.clock_in && clockOutDate <= new Date(entry.clock_in)) {
      setError('Clock-out time must be after the clock-in time.')
      return
    }

    setLoading(true)
    try {
      await resolveAdjustment(entry.id, clockOutDate.toISOString())
      onResolved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Fix Your Clock-Out">
      <div className="space-y-4">
        <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-neutral-700">
          You were automatically clocked out of this inspection because it ran past its estimate.
          Enter your real clock-out time to continue.
        </p>

        <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.company.color_hex }} />
            <span className="font-semibold text-neutral-900">{entry.company.name}</span>
          </div>
          <p className="mt-1 font-medium text-neutral-900">{entry.inspection_address}</p>
          <p className="mt-1 text-neutral-500">
            Clocked in {entry.clock_in && formatDateLabel(entry.clock_in)} at {formatClock(entry.clock_in)}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Actual clock-out time</label>
          <input
            type="datetime-local"
            value={clockOutLocal}
            onChange={(e) => setClockOutLocal(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save and Complete'}
        </button>
      </div>
    </Modal>
  )
}
