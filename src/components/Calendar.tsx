import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import type { TimeEntryWithRelations } from '../types'
import { hexToRgba, toIsoDate } from '../lib/utils'

interface CalendarProps {
  month: Date
  entries: TimeEntryWithRelations[]
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectEntry: (entry: TimeEntryWithRelations) => void
}

export default function Calendar({ month, entries, onPrevMonth, onNextMonth, onSelectEntry }: CalendarProps) {
  const gridStart = startOfWeek(startOfMonth(month))
  const gridEnd = endOfWeek(endOfMonth(month))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  function entriesForDay(day: Date) {
    const iso = toIsoDate(day)
    const scheduled = entries.filter((e) => e.status === 'scheduled' && e.scheduled_date === iso)
    const worked = entries.filter(
      (e) => e.status !== 'scheduled' && e.clock_in && isSameDay(new Date(e.clock_in), day)
    )
    return { scheduled, worked }
  }

  function hoursForDay(day: Date) {
    const { worked } = entriesForDay(day)
    return worked.reduce((sum, e) => sum + (e.hours ?? 0), 0)
  }

  const monthTotal = days
    .filter((d) => isSameMonth(d, month))
    .reduce((sum, d) => sum + hoursForDay(d), 0)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          ← Prev
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-neutral-900">{format(month, 'MMMM yyyy')}</h2>
          <p className="text-xs text-neutral-500">Month total: {monthTotal.toFixed(2)}h</p>
        </div>
        <button
          onClick={onNextMonth}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1 space-y-1 sm:space-y-2">
        {weeks.map((week, wi) => {
          const weekTotal = week.reduce((sum, d) => sum + hoursForDay(d), 0)
          return (
            <div key={wi} className="grid grid-cols-7 items-stretch gap-1 sm:gap-2">
              {week.map((day) => {
                const inMonth = isSameMonth(day, month)
                const { scheduled, worked } = entriesForDay(day)
                const dayHours = hoursForDay(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={`flex min-h-[64px] flex-col rounded-lg border p-1 text-left sm:min-h-[84px] sm:p-1.5 ${
                      inMonth ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50'
                    } ${isToday ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    <div className={`text-[11px] font-medium ${inMonth ? 'text-neutral-700' : 'text-neutral-300'}`}>
                      {format(day, 'd')}
                    </div>

                    {dayHours > 0 && (
                      <div className="mt-0.5 text-[10px] font-semibold text-neutral-500 sm:text-xs">
                        {dayHours.toFixed(2)}h
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap gap-0.5 pt-1">
                      {scheduled.map((e) => (
                        <button
                          key={e.id}
                          title={`${e.company.name} · scheduled`}
                          onClick={() => onSelectEntry(e)}
                          className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3"
                          style={{ backgroundColor: hexToRgba(e.company.color_hex, 0.35) }}
                        />
                      ))}
                      {worked.map((e) => (
                        <span
                          key={e.id}
                          title={`${e.company.name} · ${e.status}`}
                          className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3"
                          style={{ backgroundColor: e.company.color_hex }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
              <div className="col-span-7 -mt-1 pb-1 text-right text-[10px] font-medium text-neutral-400 sm:text-xs">
                Week total: {weekTotal.toFixed(2)}h
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function shiftMonth(month: Date, delta: number): Date {
  return delta > 0 ? addMonths(month, delta) : subMonths(month, -delta)
}
