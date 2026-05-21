import { useEffect, useState } from 'react'
import {
  ClipboardList,
  Building2,
  Users,
  Calendar,
  CalendarOff,
  UserPlus,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { getAuditLogs } from '../api/auditLog'
import { ForbiddenError } from '../api/client'
import type { AuditLog } from '../types/auditLog'
import { useToast } from '../contexts/ToastContext'
import {
  getActionMeta, actorName, actorInitials,
  formatRelative, formatAbsolute, avatarColor,
} from '../utils/auditLog'

const PAGE_SIZE = 20

// ── Resource type filters ──────────────────────────────────────────────────────

type ResourceFilter = { label: string; value: string; icon: React.ElementType }

const RESOURCE_FILTERS: ResourceFilter[] = [
  { label: 'All',            value: '',             icon: ClipboardList },
  { label: 'Branches',       value: 'branch',       icon: Building2 },
  { label: 'Employment',     value: 'employment',   icon: UserPlus },
  { label: 'Shifts',         value: 'shift',        icon: Calendar },
  { label: 'Assignments',    value: 'assignment',   icon: Users },
  { label: 'Leave Requests', value: 'leave_request', icon: CalendarOff },
]

// ── MetadataPanel ──────────────────────────────────────────────────────────────

function MetadataPanel({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata)
  if (entries.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full">
          <span className="font-medium text-gray-500">{k}:</span>
          {String(v)}
        </span>
      ))}
    </div>
  )
}

// ── ActionBadge ────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const meta = getActionMeta(action)
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

// ── LogRow ─────────────────────────────────────────────────────────────────────

function LogRow({ log, idx }: { log: AuditLog; idx: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasMetadata = Object.keys(log.metadata).length > 0
  const color = avatarColor(log.user, idx)

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      {/* Actor */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${color}`}>
            <span className="text-white text-[10px] font-semibold">{actorInitials(log)}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-tight">{actorName(log)}</p>
            {log.user_email && (
              <p className="text-[11px] text-gray-400 leading-tight">{log.user_email}</p>
            )}
          </div>
        </div>
      </td>

      {/* Action */}
      <td className="px-5 py-3.5">
        <ActionBadge action={log.action} />
      </td>

      {/* Resource */}
      <td className="px-5 py-3.5">
        <p className="text-sm text-gray-700 font-medium leading-tight">{log.resource_name || '—'}</p>
        {hasMetadata && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[11px] text-sky-600 hover:text-sky-700 mt-0.5"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'hide details' : 'details'}
          </button>
        )}
        {expanded && <MetadataPanel metadata={log.metadata} />}
      </td>

      {/* Timestamp */}
      <td className="px-5 py-3.5 text-right">
        <p className="text-sm text-gray-500" title={formatAbsolute(log.created_at)}>
          {formatRelative(log.created_at)}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{formatAbsolute(log.created_at)}</p>
      </td>
    </tr>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [resourceFilter, setResourceFilter] = useState('')
  const [page, setPage] = useState(1)

  function fetchLogs(resource: string) {
    setLoading(true)
    getAuditLogs(resource ? { resource_type: resource } : {})
      .then(setLogs)
      .catch((err) => { if (!(err instanceof ForbiddenError)) toast('Failed to load audit log.', 'error') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs(resourceFilter) }, [resourceFilter])

  const total = logs.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paged = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleFilter(value: string) {
    setResourceFilter(value)
    setPage(1)
  }

  return (
    <div className="p-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            A history of all important actions taken in the system.
          </p>
        </div>
        <button
          onClick={() => fetchLogs(resourceFilter)}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Resource type filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {RESOURCE_FILTERS.map((f) => {
          const Icon = f.icon
          const active = resourceFilter === f.value
          return (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                { label: 'Actor',    cls: 'text-left' },
                { label: 'Action',  cls: 'text-left' },
                { label: 'Resource', cls: 'text-left' },
                { label: 'When',    cls: 'text-right' },
              ].map((h) => (
                <th
                  key={h.label}
                  className={`text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5 ${h.cls}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(4)].map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              paged.map((log, idx) => (
                <LogRow key={log.id} log={log} idx={(page - 1) * PAGE_SIZE + idx} />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {total === 0 ? 'No entries' : (
              <>
                Showing{' '}
                <span className="font-medium text-gray-700">{Math.min((page - 1) * PAGE_SIZE + 1, total)}</span>
                {' '}–{' '}
                <span className="font-medium text-gray-700">{Math.min(page * PAGE_SIZE, total)}</span>
                {' '}of{' '}
                <span className="font-medium text-gray-700">{total}</span> entries
              </>
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
