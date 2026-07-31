import { useState, type FormEvent } from 'react'
import type { CompanyRow } from '../../types/database'
import { createCompany, updateCompany } from '../../lib/queries'

interface CompaniesManagerProps {
  companies: CompanyRow[]
  onChanged: () => void
}

export default function CompaniesManager({ companies, onChanged }: CompaniesManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2563EB')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createCompany({ name: name.trim(), color_hex: color })
      setName('')
      setColor('#2563EB')
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(company: CompanyRow) {
    await updateCompany(company.id, { active: !company.active })
    onChanged()
  }

  async function handleColorChange(company: CompanyRow, colorHex: string) {
    await updateCompany(company.id, { color_hex: colorHex })
    onChanged()
  }

  async function handleNameChange(company: CompanyRow, newName: string) {
    if (!newName.trim() || newName === company.name) return
    await updateCompany(company.id, { name: newName.trim() })
    onChanged()
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">Companies</h2>

      <ul className="mb-4 divide-y divide-neutral-100">
        {companies.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2.5">
            <input
              type="color"
              value={c.color_hex}
              onChange={(e) => handleColorChange(c, e.target.value)}
              className="h-8 w-8 shrink-0 cursor-pointer rounded border border-neutral-200"
            />
            <input
              type="text"
              defaultValue={c.name}
              onBlur={(e) => handleNameChange(c, e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 text-sm font-medium text-neutral-800 hover:border-neutral-200 focus:border-yellow-500 focus:outline-none"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-500">
              <input type="checkbox" checked={c.active} onChange={() => toggleActive(c)} />
              Active
            </label>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-neutral-600">New company name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-neutral-200"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
