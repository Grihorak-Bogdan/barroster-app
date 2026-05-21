import { useEffect, useState } from 'react'
import { BarChart2, Calendar, Building2, Loader2, Download, TrendingUp, Clock } from 'lucide-react'
import { getHoursSummary } from '../api/reports'
import type { HoursSummaryEntry } from '../api/reports'
import { getBranches } from '../api/branches'
import type { Branch } from '../types/branch'
import { useRole } from '../hooks/useRole'
import { useAuth } from '../contexts/AuthContext'
import { AVATAR_COLORS, getDisplayName, getInitials } from '../utils/ui'
import { formatHours } from '../utils/format'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function weeksAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n * 7)
  return d.toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const { canManage } = useRole()
  const { user } = useAuth()

  const [fromDate, setFromDate] = useState(weeksAgo(4))
  const [toDate, setToDate] = useState(today())
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [entries, setEntries] = useState<HoursSummaryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (canManage) {
      getBranches().then(setBranches).catch(() => {})
    }
  }, [canManage])

  useEffect(() => {
    setLoading(true)
    setError('')
    getHoursSummary({
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      branch: branchId || undefined,
    })
      .then(setEntries)
      .catch(() => setError('Failed to load hours data.'))
      .finally(() => setLoading(false))
  }, [fromDate, toDate, branchId])

  const totalHours = entries.reduce((s, e) => s + e.total_hours, 0)
  const totalShifts = entries.reduce((s, e) => s + e.total_shifts, 0)
  const topEntry = entries.reduce<HoursSummaryEntry | null>(
    (best, e) => (!best || e.total_hours > best.total_hours ? e : best),
    null,
  )

  function handleExportCSV() {
    const header = canManage
      ? 'Name,Email,Shifts,Hours\n'
      : 'Shifts,Hours\n'
    const rows = entries
      .map((e) =>
        canManage
          ? `"${getDisplayName(e)}","${e.user_email}",${e.total_shifts},${e.total_hours.toFixed(2)}`
          : `${e.total_shifts},${e.total_hours.toFixed(2)}`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hours-report-${fromDate}-to-${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-sky-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              {canManage ? 'Hours Report' : 'My Hours'}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {canManage
              ? 'Worked hours per employee across confirmed and completed shifts.'
              : 'Your logged hours across confirmed and completed shifts.'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={entries.length === 0}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="outline-none text-gray-800 bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="outline-none text-gray-800 bg-transparent"
              />
            </div>
          </div>
          {canManage && branches.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Branch</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="outline-none text-gray-800 bg-transparent pr-4"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-sky-500" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatHours(totalHours)}</p>
            <p className="text-xs text-gray-400 mt-0.5">across all staff</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs font-medium text-gray-500">Total Shifts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalShifts}</p>
            <p className="text-xs text-gray-400 mt-0.5">confirmed & completed</p>
          </div>

          {canManage ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-xs font-medium text-gray-500">Top Employee</span>
              </div>
              {topEntry ? (
                <>
                  <p className="text-base font-bold text-gray-900 truncate">{getDisplayName(topEntry)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatHours(topEntry.total_hours)}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs font-medium text-gray-500">Avg per Shift</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalShifts > 0 ? formatHours(totalHours / totalShifts) : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">average hours per shift</p>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 text-sm">{error}</div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BarChart2 className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">No data for this period</p>
            <p className="text-xs mt-1">Try adjusting the date range or branch filter.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {canManage && (
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shifts
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg per Shift
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry, i) => {
                const avgH = entry.total_shifts > 0 ? entry.total_hours / entry.total_shifts : 0
                const maxH = entries.reduce((m, e) => Math.max(m, e.total_hours), 0)
                const barPct = maxH > 0 ? (entry.total_hours / maxH) * 100 : 0

                return (
                  <tr key={entry.user_id} className="hover:bg-gray-50/50 transition-colors">
                    {canManage && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold ${
                              AVATAR_COLORS[i % AVATAR_COLORS.length]
                            }`}
                          >
                            {getInitials(entry)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{getDisplayName(entry)}</p>
                            <p className="text-xs text-gray-400 truncate">{entry.user_email}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-gray-700">{entry.total_shifts}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900">{formatHours(entry.total_hours)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatHours(avgH)}</td>
                    <td className="px-5 py-3.5 w-32">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400 rounded-full transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {!canManage && entries.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Showing hours for {user?.email} across confirmed and completed shifts only.
        </p>
      )}
    </div>
  )
}
