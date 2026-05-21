import { useEffect, useState } from 'react'
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  type ShiftPayload,
} from '../api/shifts'
import type { Shift } from '../types/shift'

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = () => {
    setLoading(true)
    getShifts()
      .then(setShifts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetch, [])

  const create = async (data: ShiftPayload) => {
    const shift = await createShift(data)
    setShifts((prev) => [shift, ...prev])
    return shift
  }

  const update = async (id: string, data: Partial<ShiftPayload>) => {
    const shift = await updateShift(id, data)
    setShifts((prev) => prev.map((s) => (s.id === id ? shift : s)))
    return shift
  }

  const remove = async (id: string) => {
    await deleteShift(id)
    setShifts((prev) => prev.filter((s) => s.id !== id))
  }

  return { shifts, loading, error, refetch: fetch, create, update, remove }
}
