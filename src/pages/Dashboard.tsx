import { useCallback, useEffect, useState } from 'react'
import { endOfMonth, startOfMonth } from 'date-fns'
import Header from '../components/Header'
import Calendar, { shiftMonth } from '../components/Calendar'
import StartInspectionModal from '../components/StartInspectionModal'
import ScheduleInspectionModal from '../components/ScheduleInspectionModal'
import ScheduledEntryModal from '../components/ScheduledEntryModal'
import NeedsAdjustmentModal from '../components/NeedsAdjustmentModal'
import OpenEntryBanner from '../components/OpenEntryBanner'
import RecentEntries from '../components/RecentEntries'
import AdminPanel from '../components/admin/AdminPanel'
import { useAuth } from '../hooks/useAuth'
import { useSunsetGradient } from '../hooks/useSunsetGradient'
import {
  fetchBlockingEntry,
  fetchCompanies,
  fetchEntriesForRange,
  fetchProfiles,
  fetchRecentEntries,
} from '../lib/queries'
import type { CompanyRow, ProfileRow } from '../types/database'
import type { TimeEntryWithRelations } from '../types'
import { toIsoDate } from '../lib/utils'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const background = useSunsetGradient()

  const [tab, setTab] = useState<'dashboard' | 'admin'>('dashboard')
  const [month, setMonth] = useState(new Date())
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [inspectors, setInspectors] = useState<ProfileRow[]>([])
  const [monthEntries, setMonthEntries] = useState<TimeEntryWithRelations[]>([])
  const [recentEntries, setRecentEntries] = useState<TimeEntryWithRelations[]>([])
  const [blockingEntry, setBlockingEntry] = useState<TimeEntryWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  const [showStart, setShowStart] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryWithRelations | null>(null)

  const loadAll = useCallback(async () => {
    if (!user) return
    const start = toIsoDate(startOfMonth(month))
    const end = toIsoDate(endOfMonth(month))

    const [companiesData, entriesData, recentData, blocking] = await Promise.all([
      fetchCompanies(),
      fetchEntriesForRange(start, end),
      fetchRecentEntries(10),
      fetchBlockingEntry(user.id),
    ])

    setCompanies(companiesData)
    setMonthEntries(entriesData)
    setRecentEntries(recentData)
    setBlockingEntry(blocking)

    if (isAdmin) {
      const profilesData = await fetchProfiles()
      setInspectors(profilesData)
    }

    setLoading(false)
  }, [user, month, isAdmin])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  function handleSelectEntry(entry: TimeEntryWithRelations) {
    if (entry.status === 'scheduled') setSelectedEntry(entry)
  }

  const needsAdjustment = blockingEntry?.status === 'needs_adjustment' ? blockingEntry : null
  const openEntry = blockingEntry?.status === 'open' ? blockingEntry : null

  return (
    <div className="min-h-svh" style={{ background }}>
      <Header tab={tab} onTabChange={setTab} />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {tab === 'admin' && isAdmin ? (
          <AdminPanel companies={companies} inspectors={inspectors} onCompaniesChanged={loadAll} />
        ) : loading ? (
          <p className="py-12 text-center text-sm text-neutral-500">Loading…</p>
        ) : (
          <div className="space-y-5">
            {openEntry && <OpenEntryBanner entry={openEntry} onClockedOut={loadAll} />}

            <Calendar
              month={month}
              entries={monthEntries}
              onPrevMonth={() => setMonth((m) => shiftMonth(m, -1))}
              onNextMonth={() => setMonth((m) => shiftMonth(m, 1))}
              onSelectEntry={handleSelectEntry}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowStart(true)}
                disabled={!!blockingEntry}
                className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start New Inspection
              </button>
              <button
                onClick={() => setShowSchedule(true)}
                className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
              >
                Schedule Inspection
              </button>
            </div>

            <RecentEntries entries={recentEntries} />
          </div>
        )}
      </main>

      {showStart && user && (
        <StartInspectionModal
          companies={companies.filter((c) => c.active)}
          inspectorId={user.id}
          onClose={() => setShowStart(false)}
          onCreated={() => {
            setShowStart(false)
            loadAll()
          }}
        />
      )}

      {showSchedule && user && (
        <ScheduleInspectionModal
          companies={companies.filter((c) => c.active)}
          inspectors={inspectors}
          currentUserId={user.id}
          isAdmin={isAdmin}
          onClose={() => setShowSchedule(false)}
          onCreated={() => {
            setShowSchedule(false)
            loadAll()
          }}
        />
      )}

      {selectedEntry && (
        <ScheduledEntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onClockedIn={() => {
            setSelectedEntry(null)
            loadAll()
          }}
        />
      )}

      {needsAdjustment && (
        <NeedsAdjustmentModal entry={needsAdjustment} onResolved={loadAll} />
      )}
    </div>
  )
}
