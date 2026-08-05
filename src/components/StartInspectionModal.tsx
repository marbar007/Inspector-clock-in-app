import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import AddressAutocomplete from './AddressAutocomplete'
import type { CompanyRow } from '../types/database'
import { ESTIMATE_OPTIONS_MINUTES } from '../types'
import { estimateLabel } from '../lib/utils'
import { createOpenEntry, fetchBlockingEntry } from '../lib/queries'

interface StartInspectionModalProps {
  companies: CompanyRow[]
  inspectorId: string
  onClose: () => void
  onCreated: () => void
}

export default function StartInspectionModal({
  companies,
  inspectorId,
  onClose,
  onCreated,
}: StartInspectionModalProps) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const [address, setAddress] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!companyId || !address.trim()) {
      setError('Company and inspection address are required.')
      return
    }

    setLoading(true)
    try {
      const blocking = await fetchBlockingEntry(inspectorId)
      if (blocking) {
        setError(
          blocking.status === 'needs_adjustment'
            ? 'You have an inspection that auto-clocked out and needs its clock-out time fixed before you can start another.'
            : 'You already have an open inspection. Clock out before starting a new one.'
        )
        setLoading(false)
        return
      }

      await createOpenEntry({
        inspector_id: inspectorId,
        company_id: companyId,
        inspection_address: address.trim(),
        estimated_minutes: estimatedMinutes,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Start New Inspection" onClose={onClose}>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Inspection address</label>
          <AddressAutocomplete value={address} onChange={setAddress} placeholder="123 Main St, City" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Estimated completion time</label>
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
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading ? 'Clocking in…' : 'Clock In Now'}
        </button>
      </form>
    </Modal>
  )
}
