import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  getUnreadCount,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  broadcastNotification as apiBroadcast,
} from '../api/notifications'
import type { Notification } from '../types/notification'

type NotificationContextValue = {
  unreadCount: number
  notifications: Notification[]
  panelLoaded: boolean
  setNotifications: (n: Notification[]) => void
  setPanelLoaded: (v: boolean) => void
  refresh: () => void
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  broadcast: (title: string, body: string) => Promise<Notification>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const POLL_MS = 60_000

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [panelLoaded, setPanelLoaded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(() => {
    getUnreadCount()
      .then(r => setUnreadCount(r.count))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    timerRef.current = setInterval(refresh, POLL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [refresh])

  async function markRead(id: number) {
    const updated = await apiMarkRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? updated : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await apiMarkAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: n.read_at ?? new Date().toISOString() })))
    setUnreadCount(0)
  }

  async function broadcast(title: string, body: string): Promise<Notification> {
    const notif = await apiBroadcast(title, body)
    // Prepend globally, since current user also sees it
    setNotifications(prev => [notif, ...prev])
    return notif
  }

  return (
    <NotificationContext.Provider value={{
      unreadCount, notifications, panelLoaded,
      setNotifications, setPanelLoaded,
      refresh, markRead, markAllRead, broadcast,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider')
  return ctx
}
