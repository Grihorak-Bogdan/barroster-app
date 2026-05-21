import { apiFetch } from './client'
import type { Notification } from '../types/notification'

export const getNotifications = () =>
  apiFetch<Notification[]>('/notifications/')

export const getUnreadCount = () =>
  apiFetch<{ count: number }>('/notifications/unread_count/')

export const markRead = (id: number) =>
  apiFetch<Notification>(`/notifications/${id}/mark_read/`, { method: 'POST' })

export const markAllRead = () =>
  apiFetch<{ marked: number }>('/notifications/mark_all_read/', { method: 'POST' })

export const broadcastNotification = (title: string, body: string) =>
  apiFetch<Notification>('/notifications/broadcast/', {
    method: 'POST',
    body: JSON.stringify({ title, body }),
  })
