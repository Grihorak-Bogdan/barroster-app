import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, RefreshCw, ArrowRight } from 'lucide-react'
import { getAuditLogs } from '../../api/auditLog'
import { ForbiddenError } from '../../api/client'
import type { AuditLog } from '../../types/auditLog'
import {
  getActionMeta, actorName, actorInitials,
  formatRelative, formatAbsolute, avatarColor,
} from '../../utils/auditLog'

// ── FeedItem ───────────────────────────────────────────────────────────────────

function FeedItem({ log, idx }: { log: AuditLog; idx: number }) {
  const meta    = getActionMeta(log.action)
  const name    = actorName(log)
  const initials = actorInitials(log)
  const color   = avatarColor(log.user, idx)

  return (
    <div className="flex items-start gap-3 py-3 group">
      {/* Colored timeline connector */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${color}`}>
          {initials}
        </div>
        <div className="w-px flex-1 bg-gray-100 mt-1.5 min-h-[12px]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-700 leading-snug">
            <span className="font-semibold text-gray-900">{name}</span>
            {' '}
            <span className="text-gray-500">{meta.verb}</span>
            {log.resource_name && (
              <>
                {' — '}
                <span className="font-medium text-gray-800">{log.resource_name}</span>
              </>
            )}
          </p>
          <span
            className="text-[11px] text-gray-400 whitespace-nowrap shrink-0 mt-0.5"
            title={formatAbsolute(log.created_at)}
          >
            {formatRelative(log.created_at)}
          </span>
        </div>

        {/* Action badge — subtle, below the sentence */}
        <span className={`inline-flex items-center gap-1 mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
          {meta.label}
        </span>
      </div>
    </div>
  )
}

// ── ActivityFeed ───────────────────────────────────────────────────────────────

export default function ActivityFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true)
    getAuditLogs({ limit: 10 })
      .then(setLogs)
      .catch(err => { if (!(err instanceof ForbiddenError)) setLogs([]) })
      .finally(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/audit-log"
            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3 mt-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: `${65 + (i % 3) * 10}%` }} />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10">
          <Activity className="w-7 h-7 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No activity recorded yet</p>
        </div>
      ) : (
        <div className="mt-1">
          {logs.map((log, idx) => (
            <FeedItem key={log.id} log={log} idx={idx} />
          ))}
        </div>
      )}
    </div>
  )
}
