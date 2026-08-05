import { useState } from 'react'
import type { CompanyRow, ProfileRow } from '../../types/database'
import EntriesTable from './EntriesTable'
import CompaniesManager from './CompaniesManager'
import InvitePanel from './InvitePanel'
import Reports from './Reports'

interface AdminPanelProps {
  companies: CompanyRow[]
  inspectors: ProfileRow[]
  onCompaniesChanged: () => void
}

const SECTIONS = ['Entries', 'Companies', 'Invite', 'Reports'] as const
type Section = (typeof SECTIONS)[number]

export default function AdminPanel({ companies, inspectors, onCompaniesChanged }: AdminPanelProps) {
  const [section, setSection] = useState<Section>('Entries')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1 text-sm">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              section === s ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {section === 'Entries' && <EntriesTable companies={companies} inspectors={inspectors} />}
      {section === 'Companies' && <CompaniesManager companies={companies} onChanged={onCompaniesChanged} />}
      {section === 'Invite' && <InvitePanel />}
      {section === 'Reports' && <Reports companies={companies} isAdmin />}
    </div>
  )
}
