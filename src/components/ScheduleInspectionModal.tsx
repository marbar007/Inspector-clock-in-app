import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import AddressAutocomplete from './AddressAutocomplete'
import type { CompanyRow, ProfileRow } from '../types/database'
import { createScheduledEntry } from '../lib/queries'
import { toIsoDate } from '../lib/utils'

interface ScheduleInspectionModalProps {
  companies: CompanyRow[]
  inspectors: ProfileRow[]
  currentUserId: string
  isAdmin: boolean
  onClose: () => void
  onCreated: () => void
}

export default function ScheduleInspectionModal({
  companies,
  inspectors,
  currentUserId,
  isAdmin,
  onClose,
  onCreated,
}: ScheduleInspectionModalProps) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [inspectorId, setInspectorId] = useState(currentUserId)
  const [address, setAddress] = useState('')
  const [date, setDate] = useState(toIsoDate(new Date()))
  const [arrivalStart, setArrivalStart] = useState('09:00')
  const [arrivalEnd, setArrivalEnd] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!companyId || !address.trim() || !date) {
      setError('Company, address, and date are required.')
      return
    }
    if (arrivalEnd <= arrivalStart) {
      setError('Arrival window end must be after the start.')
      return
    }

    setLoading(true)
    try {
      await createScheduledEntry({
        inspector_id: isAdmin ? inspectorId : currentUserId,
        company_id: companyId,
        inspection_address: address.trim(),
        scheduled_date: date,
        arrival_start: arrivalStart,
        arrival_end: arrivalEnd,
        notes: notes.trim() || null,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Schedule Inspection" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Inspector</label>
            <select
              value={inspectorId}
              onChange={(e) => setInspectorId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            >
              {inspectors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Inspection address</label>
          <AddressAutocomplete value={address} onChange={setAddress} placeholder="123 Main St, City" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Arrival start</label>
            <input
              type="time"
              required
              value={arrivalStart}
              onChange={(e) => setArrivalStart(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Arrival end</label>
            <input
              type="time"
              required
              value={arrivalEnd}
              onChange={(e) => setArrivalEnd(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Homeowner or admin notes"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? 'Scheduling…' : 'Schedule Inspection'}
        </button>
      </form>
    </Modal>
  )
}
