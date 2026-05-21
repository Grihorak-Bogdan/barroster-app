import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Calendar, CalendarOff, Banknote,
  UserCheck, X, Megaphone, Send, Globe,
} from 'lucide-react'
import { getNotifications } from '../../api/notifications'
import { ForbiddenError } from '../../api/client'
import { useNotifications } from '../../contexts/NotificationContext'
import { useRole } from '../../hooks/useRole'
import { formatRelative } from '../../utils/auditLog'
import type { Notification, NotificationType } from '../../types/notification'

// ── Per-type display metadata ──────────────────────────────────────────────────

type NotifMeta = { icon: React.ElementType; color: string; bg: string; dot: string }

const TYPE_META: Record<NotificationType, NotifMeta> = {
  leave_approved:     { icon: CalendarOff, color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
  leave_rejected:     { icon: CalendarOff, color: 'text-red-700',     bg: 'bg-red-50',      dot: 'bg-red-400'     },
  shift_cancelled:    { icon: Calendar,    color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400'    },
  assignment_created: { icon: UserCheck,   color: 'text-violet-700',  bg: 'bg-violet-50',   dot: 'bg-violet-400'  },
  payroll_approved:   { icon: Banknote,    color: 'text-sky-700',     bg: 'bg-sky-50',      dot: 'bg-sky-400'     },
  payroll_paid:       { icon: Banknote,    color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-400' },
  announcement:       { icon: Megaphone,   color: 'text-amber-700',   bg: 'bg-amber-50',    dot: 'bg-amber-400'   },
}

const FALLBACK_META: NotifMeta = { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' }

function getTypeMeta(type: string): NotifMeta {
  return TYPE_META[type as NotificationType] ?? FALLBACK_META
}

// ── Resource → route ───────────────────────────────────────────────────────────

function routeFor(notif: Notification): string | null {
  if (notif.resource_type === 'leave_request') return '/leave-requests'
  if (notif.resource_type === 'shift') return `/shifts/${notif.resource_id}`
  if (notif.resource_type === 'payroll_period') return `/payroll/${notif.resource_id}`
  return null
}

// ── NotifRow ───────────────────────────────────────────────────────────────────

function NotifRow({ notif, onRead }: { notif: Notification; onRead: (id: number) => Promise<void> }) {
  const navigate = useNavigate()
  const meta = getTypeMeta(notif.type)
  const Icon = meta.icon
  const isGlobal = notif.scope === 'global'

  async function handleClick() {
    if (!notif.is_read) await onRead(notif.id)
    const route = routeFor(notif)
    if (route) navigate(route)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        !notif.is_read
          ? isGlobal
            ? 'bg-amber-50/60'
            : 'bg-sky-50/40'
          : ''
      }`}
    >
      {/* Icon bubble */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isGlobal && (
              <Globe className="w-3 h-3 text-amber-500 shrink-0" />
            )}
            <p className={`text-sm leading-snug truncate ${notif.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
              {notif.title}
            </p>
          </div>
          <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
            {formatRelative(notif.created_at)}
          </span>
        </div>
        {notif.body && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
        )}
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <span className={`w-2 h-2 rounded-full shrink-0 mt-2 ${meta.dot}`} />
      )}
    </button>
  )
}

// ── BroadcastForm ──────────────────────────────────────────────────────────────

function BroadcastForm({ onSent, onCancel }: { onSent: () => void; onCancel: () => void }) {
  const { broadcast } = useNotifications()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleSend() {
    if (!title.trim()) { setError('Title is required.'); return }
    setSending(true)
    setError('')
    try {
      await broadcast(title.trim(), body.trim())
      onSent()
    } catch {
      setError('Failed to send announcement.')
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent'

  return (
    <div className="px-4 pt-3 pb-4 border-t border-amber-100 bg-amber-50/40">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-3.5 h-3.5 text-amber-600" />
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">New Announcement</p>
        <button onClick={onCancel} className="ml-auto text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <div className="space-y-2">
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title *"
          className={inputCls}
          maxLength={200}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Message (optional)"
          rows={2}
          className={inputCls + ' resize-none'}
          maxLength={1000}
        />
        <button
          onClick={handleSend}
          disabled={sending || !title.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Sending…' : 'Send to Everyone'}
        </button>
      </div>
    </div>
  )
}

// ── NotificationBell ───────────────────────────────────────────────────────────

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { canManage } = useRole()
  const {
    unreadCount, notifications, panelLoaded,
    setNotifications, setPanelLoaded, markRead, markAllRead,
  } = useNotifications()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowBroadcast(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Fetch full list when panel opens (once per session, then on demand)
  useEffect(() => {
    if (!open || panelLoaded) return
    getNotifications()
      .then(list => { setNotifications(list); setPanelLoaded(true) })
      .catch(err => { if (!(err instanceof ForbiddenError)) setPanelLoaded(true) })
  }, [open, panelLoaded])

  const unread = notifications.filter(n => !n.is_read).length
  const globalCount = notifications.filter(n => n.scope === 'global' && !n.is_read).length

  function handleClose() {
    setOpen(false)
    setShowBroadcast(false)
  }

  function handleBroadcastSent() {
    setShowBroadcast(false)
    setPanelLoaded(false) // re-fetch so current user sees their own announcement
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (open) setShowBroadcast(false) }}
        className={`relative p-2 rounded-lg transition-colors ${
          open ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unread > 0 && (
                <span className="bg-sky-100 text-sky-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
              {globalCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  {globalCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {canManage && !showBroadcast && (
                <button
                  onClick={() => setShowBroadcast(true)}
                  className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
                  title="Send announcement"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  Announce
                </button>
              )}
              {unread > 0 && !showBroadcast && (
                <button
                  onClick={() => markAllRead()}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Broadcast form */}
          {showBroadcast && (
            <BroadcastForm
              onSent={handleBroadcastSent}
              onCancel={() => setShowBroadcast(false)}
            />
          )}

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {!panelLoaded ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Bell className="w-5 h-5 text-gray-200 animate-pulse" />
                <p className="text-sm text-gray-400">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Bell className="w-6 h-6 text-gray-200" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotifRow key={n.id} notif={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Legend */}
          {notifications.some(n => n.scope === 'global') && (
            <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] text-gray-400">Global — visible to everyone</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
