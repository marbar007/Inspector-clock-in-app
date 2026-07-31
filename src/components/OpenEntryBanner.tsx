import { useState } from 'react'
import type { TimeEntryWithRelations } from '../types'
import { formatClock } from '../lib/utils'
import { clockOutEntry } from '../lib/queries'

interface OpenEntryBannerProps {
  entry: TimeEntryWithRelations
  onClockedOut: () => void
}

export default function OpenEntryBanner({ entry, onClockedOut }: OpenEntryBannerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClockOut() {
    setLoading(true)
    setError(null)
    try {
      await clockOutEntry(entry.id)
      onClockedOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: entry.company.color_hex, backgroundColor: `${entry.company.color_hex}10` }}
    >
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: entry.company.color_hex }} />
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            Clocked in · {entry.company.name}
          </p>
          <p className="text-xs text-neutral-500">
            {entry.inspection_address} · since {formatClock(entry.clock_in)}
          </p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
      <button
        onClick={handleClockOut}
        disabled={loading}
        className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? 'Clocking out…' : 'Clock Out'}
      </button>
    </div>
  )
}
